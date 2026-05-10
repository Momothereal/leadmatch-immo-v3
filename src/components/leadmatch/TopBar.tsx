import { Search, Bell, Plus, Menu } from "lucide-react";
import { LISTING } from "@/data/mock";

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps = {}) => (
  <div className="h-14 flex items-center gap-4 px-5 border-b border-line bg-card">
    <button
      onClick={onMenuClick}
      className="lg:hidden w-9 h-9 -ml-2 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
      aria-label="Menu"
    >
      <Menu className="w-4 h-4" strokeWidth={2} />
    </button>
    <div className="hidden md:flex items-center gap-1.5 text-[12.5px]">
      <span className="text-muted-foreground">Mes biens</span>
      <span className="text-muted-2">/</span>
      <span className="font-medium text-foreground font-mono text-[12px]">{LISTING.ref}</span>
    </div>

    <div className="flex-1 max-w-xl mx-auto flex items-center gap-2 px-3 h-9 rounded-md bg-muted/60 border border-transparent focus-within:bg-card focus-within:border-line transition">
      <Search className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
      <input
        placeholder="Rechercher un bien, un lead, une référence…"
        className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground"
      />
      <kbd className="hidden sm:inline-flex items-center px-1.5 h-5 rounded text-[10.5px] font-mono text-muted-foreground bg-card border border-line">
        ⌘K
      </kbd>
    </div>

    <div className="flex items-center gap-2">
      <button className="w-9 h-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition">
        <Bell className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <button className="h-9 px-3 rounded-md bg-primary hover:bg-primary-dark text-primary-foreground text-[12.5px] font-medium flex items-center gap-1.5 transition shadow-sm">
        <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
        Nouveau
      </button>
    </div>
  </div>
);
