import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useReferral = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["referral", user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const referralCode = query.data?.referral_code ?? null;
  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : null;

  return { referralCode, referralLink, loading: query.isLoading };
};
