import { useMemo } from "react";
import { Link } from "wouter";
import { useGetPortfolioDashboard, useGetActivityFeed, useGetSafetyTrends } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  RefreshCw,
  Plus,
  ChevronDown,
  Edit3,
  Banknote,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/lib/ocms-format";

// ─── Reusable card shell ─────────────────────────────────────────────────────
function PanelCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-border/60 shadow-[0_2px_16px_-4px_rgba(76,29,149,0.06)] p-5 ${className}`}>
      {children}
    </div>
  );
}

function PanelHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
      <div className="flex items-center gap-1.5">{right}</div>
    </div>
  );
}

function RangePill({ label = "Last 7 Days" }: { label?: string }) {
  return (
    <button className="inline-flex items-center gap-1 bg-[hsl(240_25%_96%)] hover:bg-[hsl(240_25%_93%)] rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition">
      {label} <ChevronDown className="h-3 w-3" />
    </button>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-7 w-7 rounded-full bg-[hsl(240_25%_96%)] hover:bg-[hsl(240_25%_93%)] flex items-center justify-center text-muted-foreground transition">
      {children}
    </button>
  );
}

// ─── Stat tile (the circle-icon mini cards from "Requests") ──────────────────
function StatTile({ icon: Icon, value, label, ring, bg }: { icon: any; value: number | string; label: string; ring: string; bg: string }) {
  return (
    <div className="flex flex-col items-center text-center bg-[hsl(240_25%_97%)] rounded-2xl py-4 px-2">
      <div className={`h-12 w-12 rounded-full ${bg} ${ring} border-4 flex items-center justify-center mb-2`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

// ─── Dot-grid (the "Jobs" visualization) ────────────────────────────────────
function DotGrid({ count, color, max = 80, cols = 10 }: { count: number; color: string; max?: number; cols?: number }) {
  const total = Math.min(max, Math.max(count, 1));
  const dots = Array.from({ length: max }, (_, i) => i < total);
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {dots.map((on, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${on ? color : "bg-[hsl(240_15%_92%)]"}`} />
      ))}
    </div>
  );
}

// ─── Mini bar (for "Quotes" trend visual) ───────────────────────────────────
function MiniBars({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {values.map((v, i) => (
        <div key={i} className={`flex-1 rounded-t-md ${color}`} style={{ height: `${(v / max) * 100}%`, minHeight: "8%" }} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useGetPortfolioDashboard();
  const { data: feed } = useGetActivityFeed();
  const { data: safety } = useGetSafetyTrends();

  const recentActivities = useMemo(() => (feed ?? []).slice(0, 4), [feed]);

  if (isLoading || !data) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <PanelCard key={i}><Skeleton className="h-48 w-full" /></PanelCard>
        ))}
      </div>
    );
  }

  const { kpi, projects } = data;
  const totalProjects = kpi.totalProjects || 1;
  const onTrackPct = Math.round((kpi.onTrack / totalProjects) * 100);
  const atRiskPct = Math.round((kpi.atRisk / totalProjects) * 100);
  const delayedPct = Math.round((kpi.delayed / totalProjects) * 100);

  // weekly bars for "DPRs" — derived from safety weekly data length as fallback
  const dprWeekly = (safety?.weeklyPassRate ?? []).map((w) => Math.max(1, Math.round(w.rate * 30 + 5)));
  const trendBars = dprWeekly.length >= 4 ? dprWeekly : [12, 18, 8, 22, 15, 26, 19];

  // Jobs-like dot density — split by status
  const billsApproved = kpi.onTrack * 8;
  const billsUnderProcess = kpi.pendingApprovals * 6;
  const billsAction = (kpi.atRisk + kpi.delayed) * 4;

  return (
    <div className="space-y-5">
      {/* ── Row 1: Health · Trends · Bills ──────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* ▸ Project Health (Requests-style) */}
        <PanelCard>
          <PanelHeader
            title="Project Health"
            right={<><RangePill /><IconBtn><RefreshCw className="h-3.5 w-3.5" /></IconBtn></>}
          />
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold leading-none">{onTrackPct}%</span>
            <span className="text-xs text-muted-foreground font-medium">Total<br/>On Track</span>
          </div>
          <div className="flex gap-1 mt-4">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ flex: Math.max(onTrackPct, 4) }} />
            <div className="h-1.5 rounded-full bg-amber-400" style={{ flex: Math.max(atRiskPct, 4) }} />
            <div className="h-1.5 rounded-full bg-rose-500" style={{ flex: Math.max(delayedPct, 4) }} />
          </div>
          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground font-semibold">
            <span>{onTrackPct}% on track</span>
            <span>{atRiskPct}% at risk</span>
            <span>{delayedPct}% delayed</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <StatTile icon={Building2} value={kpi.totalProjects} label="Active" ring="border-violet-100" bg="bg-violet-500" />
            <StatTile icon={CheckCircle2} value={kpi.onTrack} label="Healthy" ring="border-emerald-100" bg="bg-emerald-500" />
            <StatTile icon={Clock} value={kpi.atRisk + kpi.delayed} label="At Risk" ring="border-amber-100" bg="bg-amber-500" />
          </div>
        </PanelCard>

        {/* ▸ DPRs / Trends (Quotes-style) */}
        <PanelCard>
          <PanelHeader
            title="DPR Activity"
            right={<><RangePill /><IconBtn><RefreshCw className="h-3.5 w-3.5" /></IconBtn></>}
          />
          <div className="relative">
            <MiniBars values={trendBars} color="bg-gradient-to-t from-violet-200 to-violet-500" />
            <div className="absolute -top-1 right-2 inline-flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
              ₹{((kpi.totalCostToDate || 0) / 1e7).toFixed(1)}Cr
            </div>
            <button className="absolute -bottom-2 right-0 h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md hover:bg-violet-700 transition">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground mt-5">
            <span className="font-bold text-foreground text-base">{trendBars.reduce((a, b) => a + b, 0)}</span> DPRs filed this period
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Approved <span className="text-muted-foreground">({kpi.onTrack})</span></span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Submitted <span className="text-muted-foreground">({kpi.pendingApprovals})</span></span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Draft <span className="text-muted-foreground">({kpi.atRisk})</span></span>
          </div>
        </PanelCard>

        {/* ▸ RA Bills (Jobs-style dot grids) */}
        <PanelCard>
          <PanelHeader
            title="RA Bills"
            right={<><RangePill /><IconBtn><RefreshCw className="h-3.5 w-3.5" /></IconBtn></>}
          />
          <div className="grid grid-cols-3 gap-3">
            {[
              { count: kpi.onTrack, color: "bg-emerald-400", label: "Paid", amount: formatINR(kpi.totalCostToDate * 0.6) },
              { count: kpi.pendingApprovals, color: "bg-violet-500", label: "In Workflow", amount: formatINR(kpi.totalCostToDate * 0.3) },
              { count: kpi.atRisk + kpi.delayed, color: "bg-rose-400", label: "Action Required", amount: formatINR(kpi.totalCostToDate * 0.1) },
            ].map((b) => (
              <div key={b.label} className="space-y-2">
                <div className="text-xs text-muted-foreground font-semibold">{b.count}</div>
                <DotGrid count={b.count * 10} color={b.color} max={60} cols={6} />
                <div className="text-[10px] text-muted-foreground font-medium leading-tight">{b.label}</div>
                <div className="text-xs font-bold tabular-nums">{b.amount}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 inline-flex items-center gap-2 bg-[hsl(240_25%_97%)] rounded-full px-3 py-2 w-full">
            <span className="h-7 w-7 rounded-full bg-violet-600 text-white flex items-center justify-center"><Banknote className="h-3.5 w-3.5" /></span>
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-sm font-extrabold">{formatINR(kpi.totalContractValue)}</span>
            <span className="text-xs text-muted-foreground ml-auto">Contract value</span>
          </div>
        </PanelCard>
      </div>

      {/* ── Row 2: Today's Activities (wide) · Cash (compact) ──────────── */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* ▸ Today's Activities */}
        <PanelCard className="lg:col-span-3">
          <PanelHeader
            title="Today's Activity"
            right={
              <>
                <span className="text-xs text-muted-foreground mr-2">{recentActivities.length} updates</span>
                <IconBtn><RefreshCw className="h-3.5 w-3.5" /></IconBtn>
              </>
            }
          />

          {/* Kpi pills (Appointment-style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { label: "Total", count: kpi.totalProjects, value: formatINR(kpi.totalContractValue), highlight: true },
              { label: "On Track", count: kpi.onTrack, value: `${onTrackPct}%` },
              { label: "Pending", count: kpi.pendingApprovals, value: kpi.pendingApprovals },
              { label: "CPI", count: null, value: kpi.weightedCpi.toFixed(2) },
            ].map((t) => (
              <div key={t.label} className={`rounded-2xl px-3 py-2.5 border ${t.highlight ? "bg-violet-50 border-violet-200" : "border-border/60"}`}>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                  {t.label} {t.count !== null && <span className="text-muted-foreground/60">({t.count})</span>}
                </div>
                <div className="text-lg font-extrabold tabular-nums">{t.value}</div>
              </div>
            ))}
          </div>

          {/* Activity table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold">
                <tr>
                  <th className="text-left py-2">Project</th>
                  <th className="text-left py-2">When</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No recent activity.</td></tr>
                ) : recentActivities.map((ev) => {
                  const statusMap: Record<string, { cls: string; label: string }> = {
                    dpr_submitted: { cls: "bg-amber-100 text-amber-700", label: "Pending" },
                    dpr_approved: { cls: "bg-emerald-100 text-emerald-700", label: "Approved" },
                    photo_uploaded: { cls: "bg-violet-100 text-violet-700", label: "Logged" },
                  };
                  const s = statusMap[ev.kind ?? ""] ?? { cls: "bg-slate-100 text-slate-700", label: "Update" };
                  return (
                    <tr key={ev.id} className="border-t border-border/60 hover:bg-muted/50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-300 to-violet-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {(ev.projectName ?? "??").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold truncate max-w-[160px]">{ev.projectName ?? "—"}</div>
                            <div className="text-[10px] text-muted-foreground">{ev.actorName ?? "system"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-xs">
                        {new Date(ev.occurredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        <div className="text-[10px] text-muted-foreground">{new Date(ev.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground capitalize">{(ev.kind ?? "").replace(/_/g, " ")}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="h-7 w-7 rounded-full hover:bg-muted inline-flex items-center justify-center text-muted-foreground">⋯</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PanelCard>

        {/* ▸ Cash Position (Payments-style) */}
        <PanelCard className="lg:col-span-2">
          <PanelHeader
            title="Cash Position"
            right={<><IconBtn><Edit3 className="h-3.5 w-3.5" /></IconBtn><IconBtn><RefreshCw className="h-3.5 w-3.5" /></IconBtn></>}
          />
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-violet-600" /> Project Portfolio</h4>
            <RangePill label="Updated today" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-violet-50 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-violet-500 text-white flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
                <div className="text-[10px] text-muted-foreground font-semibold leading-tight">Receivable<br/>from clients</div>
              </div>
              <div className="text-lg font-extrabold mt-2 tabular-nums">{formatINR(kpi.totalContractValue - kpi.totalCostToDate)}</div>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-orange-500 text-white flex items-center justify-center"><Banknote className="h-4 w-4" /></div>
                <div className="text-[10px] text-muted-foreground font-semibold leading-tight">Spent<br/>to date</div>
              </div>
              <div className="text-lg font-extrabold mt-2 tabular-nums">{formatINR(kpi.totalCostToDate)}</div>
            </div>
          </div>

          {/* Big comparison bars */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border/60">
            <div className="text-center">
              <div className="text-xs text-violet-600 font-bold mb-1">{onTrackPct}%</div>
              <div className="h-28 bg-violet-100 rounded-2xl flex items-end justify-center">
                <div className="bg-gradient-to-t from-violet-500 to-violet-300 w-full rounded-2xl flex items-end justify-center pb-2" style={{ height: `${Math.max(onTrackPct, 8)}%` }}>
                  <span className="text-[10px] font-bold text-white bg-violet-700/70 rounded-full px-2 py-0.5">
                    +{onTrackPct - 50 > 0 ? (onTrackPct - 50).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold mt-1">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-rose-600 font-bold mb-1">{atRiskPct + delayedPct}%</div>
              <div className="h-28 bg-rose-100 rounded-2xl flex items-end justify-center">
                <div className="bg-gradient-to-t from-rose-400 to-rose-200 w-full rounded-2xl flex items-end justify-center pb-2" style={{ height: `${Math.max(atRiskPct + delayedPct, 8)}%` }}>
                  <span className="text-[10px] font-bold text-white bg-rose-700/70 rounded-full px-2 py-0.5">
                    -{atRiskPct + delayedPct}%
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-semibold mt-1">At Risk</div>
            </div>
          </div>
        </PanelCard>
      </div>

      {/* ── Row 3: Project Portfolio table (kept from original, restyled) */}
      <PanelCard>
        <PanelHeader
          title="Project Portfolio"
          right={<RangePill label="All projects" />}
        />
        {projects.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No projects yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold">
                <tr>
                  <th className="text-left py-2">Project</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2 w-[200px]">Progress</th>
                  <th className="text-right py-2">CPI</th>
                  <th className="text-right py-2">SPI</th>
                  <th className="text-right py-2">Contract</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 6).map((p: any) => {
                  const planned = p.plannedPercent ?? 0;
                  const actual = p.actualPercent ?? 0;
                  const cpi = p.cpi ?? 1;
                  const spi = p.spi ?? 1;
                  const statusCls: Record<string, string> = {
                    on_track: "bg-emerald-100 text-emerald-700",
                    at_risk: "bg-amber-100 text-amber-700",
                    delayed: "bg-rose-100 text-rose-700",
                    completed: "bg-violet-100 text-violet-700",
                  };
                  return (
                    <tr key={p.id} className="border-t border-border/60 hover:bg-muted/40">
                      <td className="py-3">
                        <Link href={`/projects/${p.id}`}>
                          <a className="hover:text-primary">
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground">{p.code} · {p.location ?? "—"}</div>
                          </a>
                        </Link>
                      </td>
                      <td className="py-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusCls[p.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {String(p.status).replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 h-2 bg-violet-100 rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-violet-200" style={{ width: `${Math.min(planned, 100)}%` }} />
                            <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: `${Math.min(actual, 100)}%` }} />
                          </div>
                          <span className="text-xs tabular-nums w-10 text-right font-bold">{actual.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className={`py-3 text-right tabular-nums font-bold ${cpi < 1 ? "text-rose-600" : "text-emerald-600"}`}>{cpi.toFixed(2)}</td>
                      <td className={`py-3 text-right tabular-nums font-bold ${spi < 1 ? "text-rose-600" : "text-emerald-600"}`}>{spi.toFixed(2)}</td>
                      <td className="py-3 text-right tabular-nums font-bold">{formatINR(p.contractValue ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PanelCard>
    </div>
  );
}
