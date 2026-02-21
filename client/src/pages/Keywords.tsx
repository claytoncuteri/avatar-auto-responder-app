import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, KeyRound, MessageSquare, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import type { KeywordTrigger } from "@shared/schema";

const platformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "threads", label: "Threads" },
];

export default function Keywords() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [sendDm, setSendDm] = useState(false);
  const [dmTemplate, setDmTemplate] = useState("");
  const [sendReply, setSendReply] = useState(true);
  const [useAi, setUseAi] = useState(true);
  const [variations, setVariations] = useState<string[]>(["", "", ""]);

  const { data: keywords, isLoading } = useQuery<KeywordTrigger[]>({
    queryKey: ["/api/keywords"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/keywords", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Keyword trigger created" });
      resetForm();
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create keyword", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/keywords/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/keywords/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Keyword trigger deleted" });
    },
  });

  function resetForm() {
    setKeyword("");
    setSelectedPlatforms(["instagram"]);
    setSendDm(false);
    setDmTemplate("");
    setSendReply(true);
    setUseAi(true);
    setVariations(["", "", ""]);
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  function handleSubmit() {
    if (!keyword.trim() || selectedPlatforms.length === 0) {
      toast({ title: "Please fill in the keyword and select at least one platform", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      keyword: keyword.trim(),
      platforms: selectedPlatforms,
      sendDm,
      dmTemplate: sendDm ? dmTemplate : null,
      dmVariables: sendDm ? { link: "{{link}}" } : null,
      sendCommentReply: sendReply,
      commentVariations: sendReply && !useAi ? variations.filter((v) => v.trim()) : [],
      useAi,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-keywords">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Keyword Triggers</h1>
          <p className="text-muted-foreground text-sm">Automate responses when keywords are detected in comments</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-keyword">
              <Plus className="h-4 w-4 mr-2" />
              New Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Keyword Trigger</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label>Keyword / Phrase</Label>
                <Input
                  placeholder="e.g., pricing, free guide, link"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  data-testid="input-keyword"
                />
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((p) => (
                    <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedPlatforms.includes(p.value)}
                        onCheckedChange={() => togglePlatform(p.value)}
                        data-testid={`checkbox-platform-${p.value}`}
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <Label className="cursor-pointer">Auto Comment Reply</Label>
                  </div>
                  <Switch checked={sendReply} onCheckedChange={setSendReply} data-testid="switch-send-reply" />
                </div>
                {sendReply && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">AI-Generated Replies</span>
                      </div>
                      <Switch checked={useAi} onCheckedChange={setUseAi} data-testid="switch-use-ai" />
                    </div>
                    {!useAi && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Reply Variations (3-5 random)</Label>
                        {variations.map((v, i) => (
                          <Input
                            key={i}
                            placeholder={`Variation ${i + 1}`}
                            value={v}
                            onChange={(e) => {
                              const newV = [...variations];
                              newV[i] = e.target.value;
                              setVariations(newV);
                            }}
                            data-testid={`input-variation-${i}`}
                          />
                        ))}
                        {variations.length < 5 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVariations([...variations, ""])}
                            data-testid="button-add-variation"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Variation
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    <Label className="cursor-pointer">Auto DM</Label>
                  </div>
                  <Switch checked={sendDm} onCheckedChange={setSendDm} data-testid="switch-send-dm" />
                </div>
                {sendDm && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground">DM Template (use {"{{link}}"} for variables)</Label>
                    <Textarea
                      placeholder={"Hey! Thanks for your interest. Here's the link: {{link}}"}
                      value={dmTemplate}
                      onChange={(e) => setDmTemplate(e.target.value)}
                      className="min-h-[80px]"
                      data-testid="input-dm-template"
                    />
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-submit-keyword"
              >
                {createMutation.isPending ? "Creating..." : "Create Trigger"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!keywords || keywords.length === 0 ? (
        <Card className="text-center py-12" data-testid="empty-keywords">
          <CardContent className="space-y-4">
            <KeyRound className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No Keyword Triggers</h3>
              <p className="text-muted-foreground text-sm">Create keyword triggers to automatically respond to comments.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-stagger">
          {keywords.map((kw) => (
            <Card key={kw.id} data-testid={`card-keyword-${kw.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="font-mono">{kw.keyword}</Badge>
                      {kw.isActive ? (
                        <Badge variant="secondary" className="text-emerald-600 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground text-xs">Paused</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(kw.platforms as string[])?.map((p: string) => (
                        <span key={p} className={`platform-badge platform-${p}`}>{p}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {kw.sendCommentReply && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {kw.useAi ? "AI Reply" : `${(kw.commentVariations as string[])?.length || 0} variations`}
                        </span>
                      )}
                      {kw.sendDm && (
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" /> Auto DM
                        </span>
                      )}
                      <span>Triggered {kw.triggeredCount || 0}x</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={kw.isActive ?? false}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: kw.id, isActive: checked })}
                      data-testid={`switch-keyword-${kw.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(kw.id)}
                      data-testid={`button-delete-keyword-${kw.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
