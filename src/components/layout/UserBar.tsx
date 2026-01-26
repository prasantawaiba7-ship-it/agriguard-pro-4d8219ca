import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserBar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const displayEmail = user.email || profile?.phone || "";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
        {/* Left: App branding */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-lg">🌾</span>
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-foreground">HUNCHA</span>
        </div>

        {/* Center: User info */}
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">{displayName}</span>
            {displayEmail && (
              <span className="hidden sm:inline"> ({displayEmail})</span>
            )}
          </div>
        </div>

        {/* Right: Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/farmer/profile")}>
              <User className="w-4 h-4 mr-2" />
              प्रोफाइल
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/subscription")}>
              <Crown className="w-4 h-4 mr-2" />
              सदस्यता
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              लग आउट
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
