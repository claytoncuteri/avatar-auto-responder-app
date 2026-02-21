import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, Send, CheckCircle2, Clock, Filter, ExternalLink } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@shared/schema";

export default function CommentHub() {
  const { toast } = useToast();
  const [platformFilter, setPlatformFilter] = useState("all");
  const [unrespondedOnly, setUnrespondedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const queryParams = new URLSearchParams();
  if (platformFilter !== "all") queryParams.set("platform", platformFilter);
  if (unrespondedOnly) queryParams.set("unresponded", "true");

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/comments", platformFilter, unrespondedOnly.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/comments?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, responseText }: { id: number; responseText: string }) => {
      const res = await apiRequest("PATCH", `/api/comments/${id}/respond`, { responseText, responseMethod: "manual" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Response sent" });
      setReplyingTo(null);
      setReplyText("");
    },
    onError: () => {
      toast({ title: "Failed to send response", variant: "destructive" });
    },
  });

  const filteredComments = comments?.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.commentText.toLowerCase().includes(q) ||
      c.commenterUsername.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-comment-hub">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Comment Hub</h1>
        <p className="text-muted-foreground text-sm">Unified inbox for all your social media comments</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-comments"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-platform-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="threads">Threads</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            checked={unrespondedOnly}
            onCheckedChange={setUnrespondedOnly}
            data-testid="switch-unresponded"
          />
          <Label className="text-sm cursor-pointer">Unresponded only</Label>
        </div>
      </div>

      {!filteredComments || filteredComments.length === 0 ? (
        <Card className="text-center py-12" data-testid="empty-comments">
          <CardContent className="space-y-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No Comments Found</h3>
              <p className="text-muted-foreground text-sm">
                {unrespondedOnly
                  ? "All comments have been responded to!"
                  : "Comments will appear here when detected on your connected platforms."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-stagger">
          {filteredComments.map((comment) => (
            <Card key={comment.id} data-testid={`card-comment-${comment.id}`}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`platform-badge platform-${comment.platform}`}>
                        {comment.platform}
                      </span>
                      <span className="font-medium text-sm truncate">@{comment.commenterUsername}</span>
                      {comment.postType && (
                        <Badge variant="secondary" className="text-xs">{comment.postType}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {comment.hasResponded ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {comment.responseMethod === "auto" ? "Auto" : "Manual"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {comment.postUrl && (
                        <a href={comment.postUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" data-testid={`button-view-post-${comment.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-sm">{comment.commentText}</p>

                  {comment.hasResponded && comment.responseText && (
                    <div className="pl-4 border-l-2 border-primary/30 text-sm text-muted-foreground">
                      <span className="font-medium text-primary text-xs">Reply:</span> {comment.responseText}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {comment.commentedAt && formatDistanceToNow(new Date(comment.commentedAt), { addSuffix: true })}
                    </span>
                    {!comment.hasResponded && (
                      <>
                        {replyingTo === comment.id ? (
                          <div className="flex items-center gap-2 flex-1 max-w-md">
                            <Input
                              placeholder="Type your reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="flex-1"
                              data-testid={`input-reply-${comment.id}`}
                            />
                            <Button
                              size="sm"
                              onClick={() => respondMutation.mutate({ id: comment.id, responseText: replyText })}
                              disabled={!replyText.trim() || respondMutation.isPending}
                              data-testid={`button-send-reply-${comment.id}`}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setReplyingTo(null); setReplyText(""); }}
                              data-testid={`button-cancel-reply-${comment.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setReplyingTo(comment.id)}
                            data-testid={`button-reply-${comment.id}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply
                          </Button>
                        )}
                      </>
                    )}
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
