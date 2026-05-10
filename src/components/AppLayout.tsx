import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, Users, Target, LogOut, History, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Biens", icon: Building2 },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/matching", label: "Matching", icon: Target },
  { to: "/matching/history", label: "Historique", icon: History },
  { to: "/account", label: "Mon compte", icon: UserCircle },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/properties": "Mes biens",
  "/leads": "Mes leads",
  "/matching": "Matching",
  "/matching/history": "Historique des matchs",
  "/account": "Mon compte",
};

function AppSidebar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-line-soft h-16 justify-center px-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-[hsl(var(--gold))] flex items-center justify-center text-sm font-medium shrink-0">LM</div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-[15px] font-medium text-foreground">LeadMatch</div>
            <div className="text-[12px] text-muted-foreground">Espace agence</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[12px] font-medium text-muted-foreground normal-case tracking-normal">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.to}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-line-soft p-3">
        <div className="flex items-center gap-3">
          <Link to="/account" className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-[13px] font-medium text-[hsl(var(--gold))] shrink-0 hover:opacity-80 transition-opacity" title="Mon compte">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </Link>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <Link to="/account" className="text-[13px] font-medium text-foreground truncate hover:underline block">Mon compte</Link>
            <div className="text-[11px] text-muted-2 truncate">{user?.email}</div>
          </div>
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary group-data-[collapsible=icon]:hidden"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const { pathname } = useLocation();
  const pageTitle = title ?? TITLES[pathname] ?? "";
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-4 px-6 border-b border-line-soft bg-card shrink-0">
            <SidebarTrigger className="text-muted-foreground" />
            <h1 className="text-[18px] font-normal text-foreground">{pageTitle}</h1>
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </header>
          <main className="flex-1 min-h-0 overflow-auto bg-background">{children}</main>
          <footer className="shrink-0 border-t border-line-soft bg-card px-6 py-2 flex flex-wrap gap-4 items-center">
            <span className="text-[11px] text-muted-foreground">© 2026 LeadMatch Immo</span>
            <div className="flex gap-3 ml-auto">
              {[
                { to: "/mentions-legales", label: "Mentions légales" },
                { to: "/confidentialite", label: "Confidentialité" },
                { to: "/cgu", label: "CGU" },
                { to: "/cgv", label: "CGV" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
