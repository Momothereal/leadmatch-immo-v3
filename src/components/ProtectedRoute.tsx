import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { subscribed, loading: subLoading, refetch } = useSubscription();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Après retour de Stripe (?checkout=success) → vider le cache et refetch
  useEffect(() => {
    if (location.search.includes("checkout=success") && user) {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      // Retry avec backoff — Stripe peut prendre 1-2s pour activer l'abonnement
      const t1 = setTimeout(() => refetch(), 800);
      const t2 = setTimeout(() => refetch(), 2500);
      const t3 = setTimeout(() => refetch(), 5000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [location.search, user]);

  if (authLoading || (user && subLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        {location.search.includes("checkout=success") && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Activation de votre abonnement…
          </p>
        )}
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!subscribed) return <Navigate to="/pricing" replace />;

  return <>{children}</>;
};
