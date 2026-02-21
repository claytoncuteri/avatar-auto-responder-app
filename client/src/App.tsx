import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Link2,
  KeyRound,
  MessageSquare,
  Activity,
  LogOut,
  Loader2,
  Zap,
} from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import Platforms from "@/pages/Platforms";
import Keywords from "@/pages/Keywords";
import CommentHub from "@/pages/CommentHub";
import ActivityPage from "@/pages/Activity";
import NotFound from "@/pages/not-found";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/platforms", label: "Platforms", icon: Link2 },
  { path: "/keywords", label: "Keywords", icon: KeyRound },
  { path: "/comments", label: "Comment Hub", icon: MessageSquare },
  { path: "/activity", label: "Activity", icon: Activity },
];

function AppLayout() {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-panel p-12 max-w-md w-full text-center space-y-6" data-testid="login-card">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text" data-testid="text-app-title">
              Avatar Auto Responder
            </h1>
            <p className="text-muted-foreground text-sm">
              AI-powered social media automation platform
            </p>
          </div>
          <a href="/api/login">
            <Button size="lg" className="w-full" data-testid="button-login">
              Sign In with Replit
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-panel border-b rounded-none px-6">
        <div className="flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="flex items-center gap-2" data-testid="link-home">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold gradient-text text-lg">Avatar</span>
              </a>
            </Link>
            <nav className="flex items-center gap-1" data-testid="nav-main">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`nav-item ${location === item.path ? "active" : ""}`}
                    data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-username">
              {user.firstName || user.email || "User"}
            </span>
            <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/platforms" component={Platforms} />
          <Route path="/keywords" component={Keywords} />
          <Route path="/comments" component={CommentHub} />
          <Route path="/activity" component={ActivityPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
