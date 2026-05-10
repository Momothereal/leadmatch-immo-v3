import { useState } from "react";
import { LayoutDashboard, Building2, Users, Upload, Layers, Users2, Settings, LogOut, X, type LucideIcon } from "lucide-react";
import { fmtInt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ImportDialog } from "./import/ImportDialog";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  icon: LucideIcon;
  label: string;
  count?: number | null;
  active?: boolean;
  onClick?: () => void;
}

const navBottom: NavItem[] = [
  { icon: Users2, label: "Mon agence" },
  { icon: Settings, label: "Paramètres" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps = {}) => {
  const [importOpen, setImportOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navMain: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Building2, label: "Mes biens", count: 28, active: true },
    { icon: Users, label: "Mes leads", count: 147 },
    { icon: Upload, label: "Import", onClick: () => setImportOpen(true) },
    { icon: Layers, label: "Matchs", count: 412 },
  ];

  const content = (
    <>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold text-sm">
            LM
          </div>
          <div className="leading-tight flex-1">
            <div className="text-[13.5px] font-semibold text-white">LeadMatch Immo</div>
            <div className="text-[11.5px] text-sidebar-muted">Agence Lefort</div>
          </div>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden text-sidebar-muted hover:text-white p-1"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
      </div>

      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <NavGroup title="Espace de travail" items={navMain} />
          <NavGroup title="Organisation" items={navBottom} />
      </div>

      <div className="m-3 p-3 rounded-lg bg-sidebar-accent/60 flex items-center gap-3 border border-sidebar-border">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {(user?.email?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="leading-tight min-w-0 flex-1">
            <div className="text-[12.5px] font-medium text-white truncate">
              {user?.email ?? "Utilisateur"}
            </div>
            <div className="text-[11px] text-sidebar-muted truncate">Agence</div>
          </div>
          <button
            onClick={signOut}
            title="Se déconnecter"
            className="text-sidebar-muted hover:text-white transition-colors p-1"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
          </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-[240px] flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="relative w-[260px] flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full">
            {content}
          </aside>
        </div>
      )}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
};

const NavGroup = ({ title, items }: { title: string; items: NavItem[] }) => (
  <div>
    <div className="px-3 mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-sidebar-muted">
      {title}
    </div>
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors",
              item.active
                ? "bg-sidebar-active/15 text-white font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            )}
          >
            <Icon className={cn("w-[15px] h-[15px]", item.active && "text-primary")} strokeWidth={1.8} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count != null && (
              <span className={cn("text-[11px] tnum", item.active ? "text-white/80" : "text-sidebar-muted")}>
                {fmtInt(item.count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
