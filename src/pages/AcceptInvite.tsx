import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "loading" | "accepting" | "success" | "error" | "need-auth";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  const accept = async () => {
    if (!token || !user) return;
    setState("accepting");
    try {
      const { data, error } = await supabase.functions.invoke("accept-team-invite", {
        body: { invite_token: token },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessage(data.message ?? "Bienvenue dans l'équipe !");
      setState("success");
      setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Une erreur est survenue.");
      setState("error");
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState("need-auth");
    } else {
      accept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center space-y-5">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-[#0F2D52] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {(state === "loading" || state === "accepting") && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-[#0F2D52] mx-auto" />
            <p className="text-sm text-[#6B7280]">
              {state === "loading" ? "Vérification de l'invitation…" : "Rejoindre l'équipe…"}
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <div>
              <p className="font-semibold text-[#111827]">{message}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Redirection vers le dashboard…</p>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto" />
            <div>
              <p className="font-semibold text-[#111827]">Invitation invalide</p>
              <p className="text-sm text-[#6B7280] mt-1">{message}</p>
            </div>
            <Link to="/dashboard">
              <Button className="w-full" variant="outline">Retour au dashboard</Button>
            </Link>
          </>
        )}

        {state === "need-auth" && (
          <>
            <div>
              <p className="font-semibold text-lg text-[#111827]">Rejoindre l'équipe</p>
              <p className="text-sm text-[#6B7280] mt-1">
                Connectez-vous ou créez un compte pour accepter cette invitation.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link to={`/login?invite=${token}`}>
                <Button className="w-full bg-[#0F2D52] hover:bg-[#1E4D8C] text-white">
                  Se connecter
                </Button>
              </Link>
              <Link to={`/signup?invite=${token}`}>
                <Button className="w-full" variant="outline">
                  Créer un compte
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              L'invitation sera automatiquement acceptée après connexion.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
