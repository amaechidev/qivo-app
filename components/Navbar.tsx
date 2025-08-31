"use client";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Bell, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Create Poll", path: "/create" },
  ];

  if (!user) {
    return null;
  }

  return (
    <nav className="glass-effect border-b border-border/50 sticky top-0 z-50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Enhanced Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer spring-animation hover:scale-105"
            onClick={() => router.push("/dashboard")}
            data-testid="link-logo"
          >
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
              <BarChart3 className="text-primary-foreground text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">Qivo</span>
              <span className="text-xs text-muted-foreground -mt-1 hidden sm:block">
                Real-time polling
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  pathname === item.path ? "text-foreground font-medium" : ""
                }`}
                onClick={() => router.push(item.path)}
                data-testid={`link-${item.label
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {item.label}
              </Button>
            ))}
            {/* <Button
              onClick={() => router.push("/create")}
              className="spring-animation touch-target"
              data-testid="button-create-nav"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Poll
            </Button> */}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors hidden md:flex"
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2"
                  data-testid="button-user-menu"
                >
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.user_metadata.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:inline text-foreground">
                    {user.user_metadata.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/create")}>
                  Create Poll
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="button-mobile-menu"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className={`justify-start ${
                          location.pathname === item.path
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => {
                          router.push(item.path);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                    <Button
                      onClick={() => {
                        router.push("/create");
                        setMobileMenuOpen(false);
                      }}
                      className="justify-start spring-animation"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Poll
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
