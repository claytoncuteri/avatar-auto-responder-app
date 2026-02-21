import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity as ActivityIcon, MessageSquare, Send, Zap, AlertCircle, Filter } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityLogEntry } from "@shared/schema";

const activityTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  keyword_triggered: { icon: Zap, color: "text-amber-500", label: "Keyword Triggered" },
  comment_replied: { icon: MessageSquare, color: "text-blue-500", label: "Comment Replied" },
  dm_sent: { icon: Send, color: "text-emerald-500", label: "DM Sent" },
  error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
};

export default function ActivityPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const queryUrl = (() => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("activityType", typeFilter);
    if (platformFilter !== "all") params.set("platform", platformFilter);
    const qs = params.toString();
    return qs ? `/api/activity?${qs}` : "/api/activity";
  })();

  const { data: activities, isLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: [queryUrl],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="page-activity">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Activity Log</h1>
        <p className="text-muted-foreground text-sm">Track all automated actions and system events</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="keyword_triggered">Keyword Triggered</SelectItem>
            <SelectItem value="comment_replied">Comment Replied</SelectItem>
            <SelectItem value="dm_sent">DM Sent</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-platform-filter">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="threads">Threads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!activities || activities.length === 0 ? (
        <Card className="text-center py-12" data-testid="empty-activity">
          <CardContent className="space-y-4">
            <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No Activity Yet</h3>
              <p className="text-muted-foreground text-sm">
                Activity will appear here once your automation triggers start firing.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 animate-stagger">
          {activities.map((activity) => {
            const config = activityTypeConfig[activity.activityType] || activityTypeConfig.error;
            const Icon = config.icon;
            return (
              <Card key={activity.id} data-testid={`card-activity-${activity.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted shrink-0 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{config.label}</span>
                        {activity.platform && (
                          <span className={`platform-badge platform-${activity.platform}`}>
                            {activity.platform}
                          </span>
                        )}
                        {activity.status && (
                          <Badge
                            variant={activity.status === "success" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                      {activity.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
