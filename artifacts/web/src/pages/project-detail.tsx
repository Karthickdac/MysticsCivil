import { useGetProjectDashboard, getGetProjectDashboardQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, Calendar, FileText, LayoutDashboard, ListTodo, MapPin, AlertCircle, Camera, FolderOpen, Calculator, GitBranch, TrendingUp, Banknote, ShoppingCart } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { WbsTab } from "@/components/project-tabs/wbs-tab";
import { MilestonesTab } from "@/components/project-tabs/milestones-tab";
import { DprsTab } from "@/components/project-tabs/dprs-tab";
import { PhotosTab } from "@/components/project-tabs/photos-tab";
import { DocumentsTab } from "@/components/project-tabs/documents-tab";
import { IssuesTab } from "@/components/project-tabs/issues-tab";
import EstimationPage from "@/pages/estimation";
import VariationOrdersPage from "@/pages/variation-orders";
import BoqVsActualPage from "@/pages/boq-vs-actual";
import FinancialPage from "@/pages/financial";
import SupplyChainPage from "@/pages/supply-chain";

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

  const ganttBounds = (() => {
    const dates: number[] = [];
    for (const a of miniGantt) {
      if (a.plannedStart) dates.push(new Date(a.plannedStart).getTime());
      if (a.plannedEnd) dates.push(new Date(a.plannedEnd).getTime());
      if (a.actualStart) dates.push(new Date(a.actualStart).getTime());
      if (a.actualEnd) dates.push(new Date(a.actualEnd).getTime());
    }
    if (dates.length === 0) return null;
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    return { min, max, span: Math.max(1, max - min) };
  })();

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
          <TabsTrigger value="estimation" className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Estimation</TabsTrigger>
          <TabsTrigger value="variation-orders" className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> VOs</TabsTrigger>
          <TabsTrigger value="boq-actual" className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> BOQ vs Actual</TabsTrigger>
          <TabsTrigger value="dprs" className="flex items-center gap-2"><FileText className="h-4 w-4" /> DPRs</TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2"><Camera className="h-4 w-4" /> Photos</TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Documents</TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Issues</TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Financial</TabsTrigger>
          <TabsTrigger value="supply-chain" className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Supply Chain</TabsTrigger>
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

            {/* Panel 5: Mini Gantt */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Schedule — Top Activities (Mini Gantt)</CardTitle>
              </CardHeader>
              <CardContent>
                {!ganttBounds || miniGantt.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">No scheduled activities yet.</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase text-muted-foreground tracking-wide">
                      <span>{new Date(ganttBounds.min).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</span>
                      <span>{new Date(ganttBounds.max).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}</span>
                    </div>
                    {miniGantt.map((a) => {
                      const ps = a.plannedStart ? new Date(a.plannedStart).getTime() : null;
                      const pe = a.plannedEnd ? new Date(a.plannedEnd).getTime() : null;
                      const as = a.actualStart ? new Date(a.actualStart).getTime() : null;
                      const ae = a.actualEnd ? new Date(a.actualEnd).getTime() : null;
                      const pos = (t: number) => ((t - ganttBounds.min) / ganttBounds.span) * 100;
                      return (
                        <div key={a.activityId} className="grid grid-cols-12 gap-2 items-center text-xs">
                          <div className="col-span-4 truncate">
                            <span className="font-mono text-muted-foreground mr-2">{a.code}</span>{a.name}
                          </div>
                          <div className="col-span-8 relative h-6 bg-slate-100 rounded">
                            {ps !== null && pe !== null && (
                              <div className="absolute top-0.5 h-2 bg-slate-300 rounded" style={{ left: `${pos(ps)}%`, width: `${Math.max(1, pos(pe) - pos(ps))}%` }} title="Planned" />
                            )}
                            {as !== null && (
                              <div
                                className={`absolute bottom-0.5 h-2 rounded ${a.status === "delayed" ? "bg-rose-500" : a.status === "at_risk" ? "bg-amber-500" : a.status === "completed" ? "bg-blue-500" : "bg-emerald-500"}`}
                                style={{ left: `${pos(as)}%`, width: `${Math.max(1, pos(ae ?? Date.now()) - pos(as))}%` }}
                                title="Actual"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex gap-4 pt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-slate-300 rounded" /> Planned</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-emerald-500 rounded" /> Actual on-track</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-amber-500 rounded" /> At risk</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 bg-rose-500 rounded" /> Delayed</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Panel 6: Photo Timeline Wall */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Camera className="h-4 w-4" /> Recent Site Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPhotos.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">No photos uploaded yet.</div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {recentPhotos.map((p: any) => (
                      <div key={p.id} className="aspect-square rounded overflow-hidden bg-muted relative group">
                        <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] px-1.5 py-1 opacity-0 group-hover:opacity-100 transition">
                          {p.caption || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Panel 7: Next Milestone */}
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
        <TabsContent value="estimation"><EstimationPage projectId={id} /></TabsContent>
        <TabsContent value="variation-orders"><VariationOrdersPage projectId={id} /></TabsContent>
        <TabsContent value="boq-actual"><BoqVsActualPage projectId={id} /></TabsContent>
        <TabsContent value="dprs"><DprsTab projectId={id} /></TabsContent>
        <TabsContent value="photos"><PhotosTab projectId={id} /></TabsContent>
        <TabsContent value="documents"><DocumentsTab projectId={id} /></TabsContent>
        <TabsContent value="issues"><IssuesTab projectId={id} /></TabsContent>
        <TabsContent value="financial"><FinancialPage projectId={id} /></TabsContent>
        <TabsContent value="supply-chain"><SupplyChainPage projectId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}
