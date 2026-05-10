import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionStatus {
  subscribed: boolean;
  status: string | null;
  plan: string | null;
  price_id: string | null;
  product_id: string | null;
  subscription_end: string | null;
  trial_end: string | null;
}

export const useSubscription = () => {
  const { user, session } = useAuth();

  const query = useQuery<SubscriptionStatus>({
    queryKey: ["subscription", user?.id],
    enabled: !!user && !!session,
    staleTime: 60_000, // 1 min
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as SubscriptionStatus;
    },
  });

  return {
    subscribed: query.data?.subscribed ?? false,
    status: query.data?.status ?? null,
    plan: query.data?.plan ?? null,
    isAdmin: query.data?.plan === "admin",
    isTrial: query.data?.status === "trialing",
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
