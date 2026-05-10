import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Pricing from "./pages/Pricing.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Properties from "./pages/Properties.tsx";
import Leads from "./pages/Leads.tsx";
import Matching from "./pages/Matching.tsx";
import PropertyDetail from "./pages/PropertyDetail.tsx";
import LeadDetail from "./pages/LeadDetail.tsx";
import MatchHistory from "./pages/MatchHistory.tsx";
import MatchDetail from "./pages/MatchDetail.tsx";
import Account from "./pages/Account.tsx";
import AcceptInvite from "./pages/AcceptInvite.tsx";
import MentionsLegales from "./pages/legal/MentionsLegales.tsx";
import Confidentialite from "./pages/legal/Confidentialite.tsx";
import CGU from "./pages/legal/CGU.tsx";
import CGV from "./pages/legal/CGV.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth defaultMode="signin" />} />
            <Route path="/signup" element={<Auth defaultMode="signup" />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
            <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/matching" element={<ProtectedRoute><Matching /></ProtectedRoute>} />
            <Route path="/matching/history" element={<ProtectedRoute><MatchHistory /></ProtectedRoute>} />
            <Route path="/matching/history/:id" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            {/* Pages légales */}
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
            <Route path="/cgu" element={<CGU />} />
            <Route path="/cgv" element={<CGV />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
