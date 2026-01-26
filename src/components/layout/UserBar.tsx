import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Crown, Home } from "lucide-react";
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
  const location = useLocation();

  // Hide on home page and auth page
  if (!user || location.pathname === "/" || location.pathname === "/auth") return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";

  // Handle user name click - navigate to profile without adding to history stack
  const handleProfileClick = () => {
    if (location.pathname !== "/farmer/profile") {
      navigate("/farmer/profile");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t border-border/50">
      <div className="container mx-auto px-3 py-1.5 flex items-center justify-between">
        {/* LEFT: User name */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <span className="font-medium text-xs text-foreground truncate max-w-[120px] sm:max-w-[180px]">
            {displayName}
          </span>
        </div>

        {/* RIGHT: Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1">
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">सेटिङ</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
            <DropdownMenuItem onClick={() => navigate("/farmer")}>
              <Home className="w-4 h-4 mr-2" />
              ड्यासबोर्ड
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/subscription")}>
              <Crown className="w-4 h-4 mr-2" />
              सदस्यता
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              साइन आउट
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}