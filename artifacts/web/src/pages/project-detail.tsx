import { useGetProjectDashboard, getGetProjectDashboardQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Calendar, FileText, LayoutDashboard, ListTodo, MapPin, AlertCircle, Camera, FolderOpen } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { WbsTab } from "@/components/project-tabs/wbs-tab";
import { MilestonesTab } from "@/components/project-tabs/milestones-tab";
import { DprsTab } from "@/components/project-tabs/dprs-tab";
import { PhotosTab } from "@/components/project-tabs/photos-tab";
import { DocumentsTab } from "@/components/project-tabs/documents-tab";
import { IssuesTab } from "@/components/project-tabs/issues-tab";

export default function ProjectDetail() {
  const params = useParams();
  const id = params.id as string;
  
  const { data, isLoading } = useGetProjectDashboard(id, {
    query: { enabled: !!id, queryKey: getGetProjectDashboardQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!data) return <div>Project not found</div>;

  const { project, health, cost, miniGantt, activityStatusCounts, recentPhotos, pendingActions, nextMilestone } = data;

  const statusColors: Record<string, string> = {
    not_started: "bg-slate-200 text-slate-700",
    on_track: "bg-emerald-100 text-emerald-800",
    at_risk: "bg-amber-100 text-amber-800",
    delayed: "bg-rose-100 text-rose-800",
    on_hold: "bg-slate-200 text-slate-700",
    completed: "bg-blue-100 text-blue-800",
  };

  const chartStatusColors = {
    not_started: "#94a3b8", // slate-400
    on_track: "#10b981", // emerald-500
    at_risk: "#f59e0b", // amber-500
    delayed: "#ef4444", // rose-500
    on_hold: "#64748b", // slate-500
    completed: "#3b82f6", // blue-500
  };

  const activityData = [
    { name: 'Not Started', value: activityStatusCounts.not_started, fill: chartStatusColors.not_started },
    { name: 'On Track', value: activityStatusCounts.on_track, fill: chartStatusColors.on_track },
    { name: 'At Risk', value: activityStatusCounts.at_risk, fill: chartStatusColors.at_risk },
    { name: 'Delayed', value: activityStatusCounts.delayed, fill: chartStatusColors.delayed },
    { name: 'Completed', value: activityStatusCounts.completed, fill: chartStatusColors.completed },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={statusColors[project.status] || "bg-primary"}>{project.status.replace("_", " ")}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {project.code}</span>
            {project.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {project.location}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-background border h-auto p-1 overflow-x-auto flex-nowrap w-full justify-start">
          <TabsTrigger value="dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="wbs" className="flex items-center gap-2"><ListTodo className="h-4 w-4" /> WBS</TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Milestones</TabsTrigger>
          <TabsTrigger value="dprs" className="flex items-center gap-2"><FileText className="h-4 w-4" /> DPRs</TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2"><Camera className="h-4 w-4" /> Photos</TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Documents</TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Panel 1: Health Ring */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Project Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: "Actual", value: health.actualPercent }, { name: "Remaining", value: 100 - health.actualPercent }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                      >
                        <Cell fill={chartStatusColors[health.status] || "#10b981"} />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-[-100px] mb-[60px]">
                  <div className="text-3xl font-bold">{health.actualPercent}%</div>
                  <div className="text-xs text-muted-foreground">Planned: {health.plannedPercent}%</div>
                </div>
              </CardContent>
            </Card>

            {/* Panel 2: Cost Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Cost Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Budget to Date</span>
                      <span className="font-medium">₹{(cost.budgetToDate / 100000).toFixed(2)}L</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Cost to Date</span>
                      <span className="font-medium">₹{(cost.costToDate / 100000).toFixed(2)}L</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${cost.cpi < 1 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                           style={{ width: `${Math.min((cost.costToDate / cost.budgetToDate) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-between items-center border-t">
                    <div className="text-sm">Cost Performance Index</div>
                    <div className={`text-xl font-bold ${cost.cpi < 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {cost.cpi.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel 3: Activity Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Activity Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Panel 4: Pending Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Pending Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingActions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No pending actions.</div>
                ) : (
                  <div className="space-y-4">
                    {pendingActions.map(action => (
                      <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <AlertCircle className={`h-5 w-5 ${action.severity === 'high' || action.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                          <div>
                            <div className="font-medium text-sm">{action.title}</div>
                            <div className="text-xs text-muted-foreground capitalize">{action.kind.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-medium ${action.ageDays > 3 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                            {action.ageDays} days old
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Panel 5: Next Milestone */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Next Milestone</CardTitle>
              </CardHeader>
              <CardContent>
                {nextMilestone ? (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{nextMilestone.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">Target: {new Date(nextMilestone.targetDate).toLocaleDateString()}</p>
                    <Badge variant="outline" className={statusColors[nextMilestone.status]}>
                      {nextMilestone.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">No upcoming milestones.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wbs"><WbsTab projectId={id} /></TabsContent>
        <TabsContent value="milestones"><MilestonesTab projectId={id} /></TabsContent>
        <TabsContent value="dprs"><DprsTab projectId={id} /></TabsContent>
        <TabsContent value="photos"><PhotosTab projectId={id} /></TabsContent>
        <TabsContent value="documents"><DocumentsTab projectId={id} /></TabsContent>
        <TabsContent value="issues"><IssuesTab projectId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}
