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

export const STRIPE_PRICES = {
  starter_monthly: "price_1TTeMHJ8qNxQbhjwlNA6dNUx",
  pro_monthly:     "price_1TTeMhJ8qNxQbhjw5OzN1jHi",
  pro_yearly:      "price_1TTvntJ8qNxQbhjwn1DG4sxT",
} as const;

export const STANDARD_LEAD_LIMIT = 200;

export const useSubscription = () => {
  const { user, session } = useAuth();

  const query = useQuery<SubscriptionStatus>({
    queryKey: ["subscription", user?.id],
    enabled: !!user && !!session,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as SubscriptionStatus;
    },
  });

  const priceId = query.data?.price_id ?? null;
  const trialEnd = query.data?.trial_end ?? null;

  const isPro =
    query.data?.plan === "admin" ||
    priceId === STRIPE_PRICES.pro_monthly ||
    priceId === STRIPE_PRICES.pro_yearly;

  const isStandard = !isPro && !!query.data?.subscribed;

  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((+new Date(trialEnd) - Date.now()) / 86_400_000))
    : null;

  return {
    subscribed: query.data?.subscribed ?? false,
    status: query.data?.status ?? null,
    plan: query.data?.plan ?? null,
    price_id: priceId,
    trial_end: trialEnd,
    subscription_end: query.data?.subscription_end ?? null,
    isAdmin: query.data?.plan === "admin",
    isTrial: query.data?.status === "trialing",
    isPro,
    isStandard,
    trialDaysLeft,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};
