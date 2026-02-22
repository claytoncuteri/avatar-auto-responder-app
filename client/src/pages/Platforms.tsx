import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CheckCircle2, XCircle, Link2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { SiInstagram, SiFacebook, SiYoutube, SiThreads } from "react-icons/si";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import type { PlatformConnection } from "@shared/schema";

const platformConfig: Record<string, { name: string; icon: any; color: string; badgeClass: string; hasOAuth: boolean }> = {
  instagram: { name: "Instagram", icon: SiInstagram, color: "text-pink-500", badgeClass: "platform-instagram", hasOAuth: false },
  facebook: { name: "Facebook", icon: SiFacebook, color: "text-blue-600", badgeClass: "platform-facebook", hasOAuth: false },
  youtube: { name: "YouTube", icon: SiYoutube, color: "text-red-600", badgeClass: "platform-youtube", hasOAuth: true },
  threads: { name: "Threads", icon: SiThreads, color: "text-foreground", badgeClass: "platform-threads", hasOAuth: false },
};

export default function Platforms() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [open, setOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("success") === "youtube_connected") {
      toast({ title: "YouTube connected successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation("/platforms", { replace: true });
    }
    const error = params.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        youtube_auth_denied: "YouTube authorization was denied",
        youtube_auth_failed: "YouTube authorization failed. Please try again.",
        youtube_no_channel: "No YouTube channel found for this account",
      };
      toast({
        title: "Connection failed",
        description: errorMessages[error] || "Something went wrong",
        variant: "destructive",
      });
      setLocation("/platforms", { replace: true });
    }
  }, [searchString]);

  const { data: platforms, isLoading } = useQuery<PlatformConnection[]>({
    queryKey: ["/api/platforms"],
  });

  const connectYouTubeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/youtube/auth");
      return res.json();
    },
    onSuccess: (data: { authUrl: string }) => {
      window.location.href = data.authUrl;
    },
    onError: () => {
      toast({ title: "Failed to start YouTube authorization", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/platforms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Platform connected successfully" });
      setOpen(false);
      setAccountName("");
      setAccountId("");
      setAccessToken("");
    },
    onError: () => {
      toast({ title: "Failed to connect platform", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/platforms/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/platforms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Platform disconnected" });
    },
  });

  const hasYouTube = platforms?.some(p => p.platform === "youtube" && p.isActive);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-platforms">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Platform Connections</h1>
          <p className="text-muted-foreground text-sm">Connect and manage your social media accounts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => connectYouTubeMutation.mutate()}
            disabled={connectYouTubeMutation.isPending}
            data-testid="button-connect-youtube"
          >
            {connectYouTubeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SiYoutube className="h-4 w-4 mr-2 text-red-600" />
            )}
            {hasYouTube ? "Reconnect YouTube" : "Connect YouTube"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-platform">
                <Plus className="h-4 w-4 mr-2" />
                Manual Connect
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect a Platform</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger data-testid="select-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(platformConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key} data-testid={`option-platform-${key}`}>
                          <span className="flex items-center gap-2">
                            <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                            {cfg.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPlatform === "youtube" ? (
                  <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      For YouTube, use the "Connect YouTube" button instead. It will securely authorize your account via Google OAuth.
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setOpen(false);
                        connectYouTubeMutation.mutate();
                      }}
                      disabled={connectYouTubeMutation.isPending}
                      data-testid="button-oauth-youtube-dialog"
                    >
                      <SiYoutube className="h-4 w-4 mr-2" />
                      Connect with YouTube
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        placeholder="@youraccount"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        data-testid="input-account-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account / Page ID</Label>
                      <Input
                        placeholder="Account or Page ID"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        data-testid="input-account-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        placeholder="Paste your access token"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        data-testid="input-access-token"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => createMutation.mutate({
                        platform: selectedPlatform,
                        accountName,
                        accountId,
                        accessToken,
                      })}
                      disabled={createMutation.isPending || !accountName}
                      data-testid="button-submit-platform"
                    >
                      {createMutation.isPending ? "Connecting..." : "Connect"}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!platforms || platforms.length === 0 ? (
        <Card className="text-center py-12" data-testid="empty-platforms">
          <CardContent className="space-y-4">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No Platforms Connected</h3>
              <p className="text-muted-foreground text-sm">Connect your social media accounts to start automating responses.</p>
            </div>
            <Button
              onClick={() => connectYouTubeMutation.mutate()}
              disabled={connectYouTubeMutation.isPending}
              data-testid="button-connect-youtube-empty"
            >
              <SiYoutube className="h-4 w-4 mr-2 text-red-600" />
              Connect YouTube
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
          {platforms.map((platform) => {
            const cfg = platformConfig[platform.platform] || platformConfig.instagram;
            const Icon = cfg.icon;
            const metadata = platform.metadata as any;
            return (
              <Card key={platform.id} data-testid={`card-platform-${platform.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${cfg.badgeClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{platform.accountName || cfg.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs">{cfg.name}</Badge>
                          {platform.isActive ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600" data-testid={`status-active-${platform.id}`}>
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                        </div>
                        {platform.platform === "youtube" && metadata && (
                          <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                            {metadata.subscriberCount && (
                              <span>{parseInt(metadata.subscriberCount).toLocaleString()} subscribers</span>
                            )}
                            {metadata.videoCount && (
                              <span>{parseInt(metadata.videoCount).toLocaleString()} videos</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {platform.platform === "youtube" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => connectYouTubeMutation.mutate()}
                          title="Reconnect"
                          data-testid={`button-reconnect-youtube-${platform.id}`}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Switch
                        checked={platform.isActive ?? false}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: platform.id, isActive: checked })}
                        data-testid={`switch-platform-${platform.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(platform.id)}
                        data-testid={`button-delete-platform-${platform.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {platform.accountId && (
                    <p className="text-xs text-muted-foreground mt-3">ID: {platform.accountId}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
