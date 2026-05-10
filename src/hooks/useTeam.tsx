import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const MAX_SEATS = 5;        // 1 owner + 4 agents
export const MAX_MONTHLY = 20;     // max add/remove par mois calendaire

export interface TeamMember {
  id: string;
  email: string;
  user_id: string | null;
  role: "agent";
  status: "pending" | "active" | "removed";
  invite_token: string;
  invited_at: string;
  joined_at: string | null;
}

export interface Team {
  id: string;
  owner_id: string;
  name: string | null;
  max_seats: number;
  monthly_actions: number;
  monthly_actions_reset_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isResetDue(team: Team): boolean {
  return new Date(team.monthly_actions_reset_at) <= new Date();
}

function effectiveMonthlyActions(team: Team): number {
  return isResetDue(team) ? 0 : team.monthly_actions;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTeam() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── Fetch team ────────────────────────────────────────────────────────
  const teamQuery = useQuery<Team | null>({
    queryKey: ["team", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Team | null;
    },
  });

  // ── Fetch members ─────────────────────────────────────────────────────
  const membersQuery = useQuery<TeamMember[]>({
    queryKey: ["team-members", teamQuery.data?.id],
    enabled: !!teamQuery.data?.id,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamQuery.data!.id)
        .neq("status", "removed")
        .order("invited_at", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["team", user?.id] });
    qc.invalidateQueries({ queryKey: ["team-members", teamQuery.data?.id] });
  };

  // ── Invite agent ──────────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Créer l'équipe si elle n'existe pas
      let team = teamQuery.data;
      if (!team) {
        const { data: newTeam, error: teamErr } = await supabase
          .from("teams")
          .insert({ owner_id: user!.id })
          .select()
          .single();
        if (teamErr) throw teamErr;
        team = newTeam as Team;
        qc.setQueryData(["team", user!.id], team);
      }

      // 2. Vérifier limite mensuelle (reset si besoin)
      const used = effectiveMonthlyActions(team);
      if (used >= MAX_MONTHLY) {
        throw new Error(`Limite mensuelle atteinte (${MAX_MONTHLY} actions/mois). Revient le ${new Date(team.monthly_actions_reset_at).toLocaleDateString("fr-FR")}.`);
      }

      // 3. Vérifier sièges disponibles
      const activeMembers = (membersQuery.data ?? []).filter((m) => m.status !== "removed");
      if (activeMembers.length >= MAX_SEATS - 1) {
        throw new Error(`Limite atteinte : ${MAX_SEATS - 1} agents maximum sur le plan Pro.`);
      }

      // 4. Vérifier doublon
      const existing = activeMembers.find((m) => m.email === normalizedEmail);
      if (existing) throw new Error("Cet agent fait déjà partie de l'équipe.");

      // 5. Insérer le membre
      const { error: insertErr } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, email: normalizedEmail });
      if (insertErr) throw insertErr;

      // 6. Incrémenter le compteur (reset si besoin)
      const resetDue = isResetDue(team);
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1, 1);
      nextReset.setHours(0, 0, 0, 0);

      await supabase
        .from("teams")
        .update({
          monthly_actions: resetDue ? 1 : team.monthly_actions + 1,
          ...(resetDue ? { monthly_actions_reset_at: nextReset.toISOString() } : {}),
        })
        .eq("id", team.id);
    },
    onSuccess: () => {
      toast.success("Invitation créée !");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Remove agent ──────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const team = teamQuery.data;
      if (!team) throw new Error("Équipe introuvable");

      const used = effectiveMonthlyActions(team);
      if (used >= MAX_MONTHLY) {
        throw new Error(`Limite mensuelle atteinte (${MAX_MONTHLY} actions/mois).`);
      }

      const { error } = await supabase
        .from("team_members")
        .update({ status: "removed" })
        .eq("id", memberId);
      if (error) throw error;

      const resetDue = isResetDue(team);
      const nextReset = new Date();
      nextReset.setMonth(nextReset.getMonth() + 1, 1);
      nextReset.setHours(0, 0, 0, 0);

      await supabase
        .from("teams")
        .update({
          monthly_actions: resetDue ? 1 : team.monthly_actions + 1,
          ...(resetDue ? { monthly_actions_reset_at: nextReset.toISOString() } : {}),
        })
        .eq("id", team.id);
    },
    onSuccess: () => {
      toast.success("Agent retiré de l'équipe");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const team = teamQuery.data ?? null;
  const members = membersQuery.data ?? [];
  const activeMembers = members.filter((m) => m.status !== "removed");
  const usedSeats = activeMembers.length;
  const remainingSeats = (MAX_SEATS - 1) - usedSeats;
  const usedActions = team ? effectiveMonthlyActions(team) : 0;

  return {
    team,
    members: activeMembers,
    loading: teamQuery.isLoading,
    usedSeats,
    remainingSeats,
    usedActions,
    maxMonthly: MAX_MONTHLY,
    inviteAgent: (email: string) => inviteMutation.mutateAsync(email),
    removeAgent: (id: string) => removeMutation.mutate(id),
    inviting: inviteMutation.isPending,
    removing: removeMutation.isPending,
  };
}
