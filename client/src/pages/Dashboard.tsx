import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link2, KeyRound, MessageSquare, Send, TrendingUp, Clock, Zap } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  connectedPlatforms: number;
  activeKeywords: number;
  unrespondedComments: number;
  totalComments: number;
  dmsSent: number;
  recentActivity: Array<{
    id: number;
    activityType: string;
    platform: string | null;
    description: string;
    status: string | null;
    createdAt: string | null;
  }>;
}

const statCards = [
  { key: "connectedPlatforms", title: "Connected Platforms", icon: Link2, gradient: "from-violet-500 to-purple-600" },
  { key: "activeKeywords", title: "Active Keywords", icon: KeyRound, gradient: "from-blue-500 to-cyan-500" },
  { key: "unrespondedComments", title: "Unresponded", icon: MessageSquare, gradient: "from-amber-500 to-orange-500" },
  { key: "dmsSent", title: "DMs Sent", icon: Send, gradient: "from-emerald-500 to-green-500" },
] as const;

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="page-dashboard">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Monitor your social media automation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {statCards.map((stat) => (
          <div key={stat.key} className="stat-card" data-testid={`stat-${stat.key}`}>
            <div className="flex items-center justify-between gap-1">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-2xl font-bold">{(stats as any)?.[stat.key] ?? 0}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shrink-0`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/platforms">
              <a className="stat-card flex items-center gap-3 cursor-pointer" data-testid="link-quick-platforms">
                <Link2 className="h-6 w-6 text-violet-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Connect Platforms</p>
                  <p className="text-xs text-muted-foreground">Link social accounts</p>
                </div>
              </a>
            </Link>
            <Link href="/keywords">
              <a className="stat-card flex items-center gap-3 cursor-pointer" data-testid="link-quick-keywords">
                <KeyRound className="h-6 w-6 text-blue-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Create Keywords</p>
                  <p className="text-xs text-muted-foreground">Set up triggers</p>
                </div>
              </a>
            </Link>
            <Link href="/comments">
              <a className="stat-card flex items-center gap-3 cursor-pointer" data-testid="link-quick-comments">
                <MessageSquare className="h-6 w-6 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Comment Hub</p>
                  <p className="text-xs text-muted-foreground">View your inbox</p>
                </div>
              </a>
            </Link>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 text-sm" data-testid={`activity-item-${activity.id}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activity.status === "success" ? "bg-emerald-500" : activity.status === "failed" ? "bg-red-500" : "bg-amber-500"}`} />
                  <div className="min-w-0">
                    <p className="text-sm truncate">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {activity.platform && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{activity.platform}</Badge>
                      )}
                      {activity.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity yet. Connect a platform to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
