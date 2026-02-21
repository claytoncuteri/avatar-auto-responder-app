import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Sign in failed",
        description: error.message.includes("401") ? "Invalid email or password" : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Sign up failed",
        description: error.message.includes("409") ? "An account with this email already exists" : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signin") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ email, password, firstName, lastName });
    }
  }

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" data-testid="page-auth">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />

      <div className="w-full max-w-md relative">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
          data-testid="link-back-home"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </button>

        <Card className="glass-panel">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold" data-testid="text-auth-title">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to your Avatar Auto Responder account"
                  : "Get started with Avatar Auto Responder"}
              </p>
            </div>

            <div className="space-y-3">
              <a href="/api/login" className="block">
                <Button variant="outline" className="w-full" type="button" data-testid="button-google-signin">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs">First name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-9"
                        data-testid="input-first-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-auth">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary font-medium hover:underline"
                    data-testid="button-switch-to-signup"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-primary font-medium hover:underline"
                    data-testid="button-switch-to-signin"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
