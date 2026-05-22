import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetPortfolioDashboard, useGetActivityFeed } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowUpDown,
  Camera,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { formatINR, statusBadgeClass } from "@/lib/ocms-format";

type SortKey = "name" | "actualPercent" | "cpi" | "spi" | "contractValue" | "status";

export default function Dashboard() {
  const { data, isLoading } = useGetPortfolioDashboard();
  const { data: feed } = useGetActivityFeed();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("actualPercent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const projects = useMemo(() => {
    if (!data) return [];
    const filtered = data.projects.filter((p) => {
      const text = `${p.code} ${p.name} ${p.location ?? ""} ${p.clientName ?? ""}`.toLowerCase();
      return text.includes(q.toLowerCase());
    });
    return [...filtered].sort((a: any, b: any) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === "string" ? String(av).localeCompare(String(bv)) : Number(av) - Number(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, q, sortKey, sortDir]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-[100px]" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-[120px]" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { kpi } = data;

  const kpis = [
    { label: "Active Projects", value: kpi.totalProjects, icon: Building2, hint: `${kpi.onTrack} on track` },
    { label: "On Track", value: kpi.onTrack, icon: CheckCircle2, tone: "text-emerald-600", hint: "Healthy" },
    { label: "At Risk + Delayed", value: kpi.atRisk + kpi.delayed, icon: AlertTriangle, tone: "text-rose-600", hint: `${kpi.atRisk} at risk · ${kpi.delayed} delayed` },
    { label: "Pending Approvals", value: kpi.pendingApprovals, icon: Clock, tone: "text-amber-600", hint: "Awaiting sign-off" },
    { label: "Contract Value", value: formatINR(kpi.totalContractValue), icon: IndianRupee, hint: `Spent: ${formatINR(kpi.totalCostToDate)}` },
    { label: "Weighted CPI", value: kpi.weightedCpi.toFixed(2), icon: TrendingUp, tone: kpi.weightedCpi < 1 ? "text-rose-600" : "text-emerald-600", hint: kpi.weightedCpi < 1 ? "Over budget" : "Within budget" },
  ];

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortHeader = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th className={`text-${align} py-2 px-2 cursor-pointer select-none hover:text-foreground`} onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3 opacity-60" /></span>
    </th>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
        <p className="text-muted-foreground mt-1">Live status across every site you have access to.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.tone ?? "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${k.tone ?? ""}`}>{k.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Project Portfolio</CardTitle>
            <Input
              placeholder="Filter by name, code, location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs h-9"
            />
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No matching projects.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <SortHeader k="name" label="Project" />
                      <SortHeader k="status" label="Status" />
                      <th className="text-left py-2 px-2 w-[180px]">Progress</th>
                      <SortHeader k="cpi" label="CPI" align="right" />
                      <SortHeader k="spi" label="SPI" align="right" />
                      <SortHeader k="contractValue" label="Contract" align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p: any) => {
                      const planned = p.plannedPercent ?? 0;
                      const actual = p.actualPercent ?? 0;
                      const cpi = p.cpi ?? 1;
                      const spi = p.spi ?? 1;
                      return (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="py-2 px-2">
                            <Link href={`/projects/${p.id}`}>
                              <a className="hover:text-primary">
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.code} · {p.location ?? "—"}</div>
                              </a>
                            </Link>
                          </td>
                          <td className="py-2 px-2">
                            <span className={`text-xs px-2 py-0.5 rounded border ${statusBadgeClass(p.status)}`}>
                              {String(p.status).replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-slate-300" style={{ width: `${Math.min(planned, 100)}%` }} />
                                <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${Math.min(actual, 100)}%` }} />
                              </div>
                              <span className="text-xs tabular-nums w-10 text-right">{actual.toFixed(0)}%</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">plan {planned.toFixed(0)}%</div>
                          </td>
                          <td className={`py-2 px-2 text-right tabular-nums ${cpi < 1 ? "text-rose-600" : "text-emerald-700"}`}>{cpi.toFixed(2)}</td>
                          <td className={`py-2 px-2 text-right tabular-nums ${spi < 1 ? "text-rose-600" : "text-emerald-700"}`}>{spi.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{formatINR(p.contractValue ?? 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {!feed?.length ? (
              <div className="text-sm text-muted-foreground text-center py-6">No recent activity.</div>
            ) : (
              feed.slice(0, 20).map((ev) => {
                const Icon = ev.kind?.startsWith("dpr") ? FileText : ev.kind?.startsWith("photo") ? Camera : ClipboardCheck;
                return (
                  <div key={ev.id} className="flex gap-3 text-sm">
                    <div className="p-1.5 rounded bg-muted h-fit"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{ev.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {ev.projectName ?? "—"} · {new Date(ev.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        {ev.actorName && ` · ${ev.actorName}`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
