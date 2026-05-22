import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users, CalendarCheck, Wallet, FileSpreadsheet,
  ClipboardCheck, AlertTriangle, ShieldCheck, HardHat,
  Plus, CheckCircle, XCircle, Clock, Flame, Zap,
  Construction, AlertCircle, TrendingUp, BarChart3,
} from "lucide-react";

const API = "/api";

async function api(path: string, opts?: RequestInit) {
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(text || r.statusText);
  }
  return r.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TRADES = ["mason","carpenter","plumber","electrician","welder","painter","steel_fixer","helper","operator","driver","supervisor","other"];
const SKILLS = ["unskilled","semi_skilled","skilled","highly_skilled"];
const PPE_TYPES = ["helmet","vest","gloves","boots","harness","goggles","ear_protection","face_shield","respirator"];
const PERMIT_TYPES = ["hot_work","height","confined_space","electrical","excavation"];
const INCIDENT_CLASSES = ["near_miss","first_aid","lti","fatality","property_damage"];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800", inactive: "bg-gray-100 text-gray-700",
    terminated: "bg-red-100 text-red-800", draft: "bg-gray-100 text-gray-700",
    computed: "bg-blue-100 text-blue-800", approved: "bg-green-100 text-green-800",
    paid: "bg-purple-100 text-purple-800", pending: "bg-yellow-100 text-yellow-800",
    passed: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-800",
    open: "bg-red-100 text-red-800", capa_submitted: "bg-orange-100 text-orange-800",
    re_inspection: "bg-blue-100 text-blue-800", closed: "bg-gray-100 text-gray-700",
    minor: "bg-yellow-100 text-yellow-800", major: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800", extreme: "bg-red-200 text-red-900",
    high: "bg-orange-100 text-orange-800", medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800", active_permit: "bg-green-100 text-green-800",
    near_miss: "bg-yellow-100 text-yellow-800", first_aid: "bg-blue-100 text-blue-800",
    lti: "bg-orange-100 text-orange-800", fatality: "bg-red-200 text-red-900",
    property_damage: "bg-purple-100 text-purple-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

function fmt(v: any) { return v != null && v !== "" ? String(v) : "—"; }
function fmtCur(v: any) { const n = parseFloat(v ?? "0"); return isNaN(n) ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`; }
function fmtDate(v: any) { if (!v) return "—"; return new Date(v).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }); }
function permitIcon(type: string) {
  const map: Record<string, any> = { hot_work: Flame, height: Construction, electrical: Zap, confined_space: AlertTriangle, excavation: Construction };
  const Icon = map[type] ?? ShieldCheck;
  return <Icon className="h-4 w-4 inline mr-1" />;
}

// ─── Workers Tab ──────────────────────────────────────────────────────────────
function WorkersTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ["workers", projectId],
    queryFn: () => api(`/projects/${projectId}/workers`),
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: (body: any) => api(`/projects/${projectId}/workers`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workers", projectId] }); setOpen(false); setForm({}); toast({ title: "Worker registered" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const tradeCount: Record<string, number> = {};
  for (const w of workers) tradeCount[w.trade] = (tradeCount[w.trade] ?? 0) + 1;
  const activeCount = workers.filter((w: any) => w.status === "active").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{workers.length}</div><div className="text-sm text-muted-foreground">Total Workers</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{activeCount}</div><div className="text-sm text-muted-foreground">Active</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{Object.keys(tradeCount).length}</div><div className="text-sm text-muted-foreground">Trades</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{workers.filter((w: any) => w.bocwRegNumber).length}</div><div className="text-sm text-muted-foreground">BOCW Registered</div></CardContent></Card>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Worker Register</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Register Worker</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Register Worker</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              {[["name","Full Name"],["aadhaarNumber","Aadhaar"],["phone","Phone"]].map(([k, lbl]) => (
                <div key={k} className="col-span-2 space-y-1"><Label>{lbl}</Label><Input value={form[k]??""} onChange={e=>f(k,e.target.value)} /></div>
              ))}
              <div className="space-y-1"><Label>Trade</Label>
                <Select value={form.trade??""} onValueChange={v=>f("trade",v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TRADES.map(t=><SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Skill Level</Label>
                <Select value={form.skillLevel??""} onValueChange={v=>f("skillLevel",v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SKILLS.map(s=><SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {[["dailyRate","Daily Rate (₹)"],["bocwRegNumber","BOCW Reg No."],["pfNumber","PF Number"],["bankName","Bank Name"],["accountNumber","Account No."],["ifscCode","IFSC"]].map(([k,lbl])=>(
                <div key={k} className="space-y-1"><Label>{lbl}</Label><Input value={form[k]??""} onChange={e=>f(k,e.target.value)} /></div>
              ))}
            </div>
            <Button className="w-full" onClick={() => create.mutate(form)} disabled={!form.name || !form.trade || create.isPending}>
              {create.isPending ? "Registering…" : "Register Worker"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <div className="text-muted-foreground text-sm">Loading…</div> : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{["Code","Name","Trade","Skill","Daily Rate","PF No.","BOCW","Status"].map(h=><th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {workers.map((w: any) => (
                <tr key={w.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{w.workerCode}</td>
                  <td className="px-3 py-2 font-medium">{w.name}</td>
                  <td className="px-3 py-2">{w.trade?.replace(/_/g," ")}</td>
                  <td className="px-3 py-2">{w.skillLevel?.replace(/_/g," ")}</td>
                  <td className="px-3 py-2">{fmtCur(w.dailyRate)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fmt(w.pfNumber)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{fmt(w.bocwRegNumber)}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(w.status)}`}>{w.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ attendanceDate: new Date().toISOString().slice(0, 10) });
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: workers = [] } = useQuery({ queryKey: ["workers", projectId], queryFn: () => api(`/projects/${projectId}/workers`), enabled: !!projectId });
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance", projectId], queryFn: () => api(`/projects/${projectId}/attendance`), enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: (body: any) => api(`/projects/${projectId}/attendance`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance", projectId] }); setOpen(false); toast({ title: "Attendance recorded" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const todayRecords = records.filter((r: any) => new Date(r.attendanceDate).toDateString() === new Date().toDateString());
  const totalOt = records.reduce((s: number, r: any) => s + parseFloat(r.overtimeHours ?? "0"), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{records.length}</div><div className="text-sm text-muted-foreground">Total Records (2 weeks)</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{todayRecords.length}</div><div className="text-sm text-muted-foreground">Today Present</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-orange-600">{Math.round(totalOt * 10) / 10}h</div><div className="text-sm text-muted-foreground">Total OT (period)</div></CardContent></Card>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Attendance Register</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Mark Attendance</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1"><Label>Worker</Label>
                <Select value={form.workerId??""} onValueChange={v=>f("workerId",v)}>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>{(workers as any[]).map(w=><SelectItem key={w.id} value={w.id}>{w.name} ({w.workerCode})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.attendanceDate??""} onChange={e=>f("attendanceDate",e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Mark In</Label><Input type="time" value={form.markInTime??""} onChange={e=>f("markInTime",e.target.value)} /></div>
                <div className="space-y-1"><Label>Mark Out</Label><Input type="time" value={form.markOutTime??""} onChange={e=>f("markOutTime",e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>Remarks</Label><Input value={form.remarks??""} onChange={e=>f("remarks",e.target.value)} /></div>
            </div>
            <Button className="w-full" disabled={!form.workerId || !form.attendanceDate || create.isPending} onClick={() => {
              const body: any = { ...form };
              if (form.markInTime) body.markInTime = `${form.attendanceDate}T${form.markInTime}:00`;
              if (form.markOutTime) body.markOutTime = `${form.attendanceDate}T${form.markOutTime}:00`;
              create.mutate(body);
            }}>{create.isPending ? "Saving…" : "Record Attendance"}</Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{["Date","Worker","Mark In","Mark Out","Hours","OT Hrs","OT Approved","Geofence"].map(h=><th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8} className="px-3 py-4 text-center text-muted-foreground">Loading…</td></tr> :
            (records as any[]).slice(0, 50).map((r: any) => {
              const worker = (workers as any[]).find(w => w.id === r.workerId);
              return (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2">{fmtDate(r.attendanceDate)}</td>
                  <td className="px-3 py-2 font-medium">{worker?.name ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.markInTime ? new Date(r.markInTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.markOutTime ? new Date(r.markOutTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                  <td className="px-3 py-2">{fmt(r.hoursWorked)}h</td>
                  <td className="px-3 py-2 text-orange-600">{parseFloat(r.overtimeHours??0) > 0 ? `${r.overtimeHours}h` : "—"}</td>
                  <td className="px-3 py-2">{r.otApproved ? <CheckCircle className="h-4 w-4 text-green-500" /> : parseFloat(r.overtimeHours??0) > 0 ? <Clock className="h-4 w-4 text-yellow-500" /> : "—"}</td>
                  <td className="px-3 py-2">{r.withinGeofence ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payroll Tab ──────────────────────────────────────────────────────────────
function PayrollTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["payroll", projectId], queryFn: () => api(`/projects/${projectId}/payroll-periods`), enabled: !!projectId,
  });
  const { data: lines = [] } = useQuery({
    queryKey: ["payroll-lines", selectedPeriod], queryFn: () => api(`/payroll-periods/${selectedPeriod}/lines`),
    enabled: !!selectedPeriod,
  });
  const { data: workers = [] } = useQuery({ queryKey: ["workers", projectId], queryFn: () => api(`/projects/${projectId}/workers`), enabled: !!projectId });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/payroll-periods`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", projectId] }); setOpen(false); setForm({}); toast({ title: "Period created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const compute = useMutation({
    mutationFn: (id: string) => api(`/payroll-periods/${id}/compute`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", projectId] }); toast({ title: "Payroll computed — EPF/ESI/PT/LWF calculated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const approve = useMutation({
    mutationFn: (id: string) => api(`/payroll-periods/${id}/approve`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", projectId] }); toast({ title: "Payroll approved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const workerMap = Object.fromEntries((workers as any[]).map(w => [w.id, w.name]));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Payroll Periods</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Period</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Payroll Period</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1"><Label>Period Name</Label><Input placeholder="May 2026 — Week 1" value={form.periodName??""} onChange={e=>f("periodName",e.target.value)} /></div>
              <div className="space-y-1"><Label>Type</Label>
                <Select value={form.periodType??"monthly"} onValueChange={v=>f("periodType",v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="fortnightly">Fortnightly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>From Date</Label><Input type="date" value={form.fromDate??""} onChange={e=>f("fromDate",e.target.value)} /></div>
                <div className="space-y-1"><Label>To Date</Label><Input type="date" value={form.toDate??""} onChange={e=>f("toDate",e.target.value)} /></div>
              </div>
            </div>
            <Button className="w-full" disabled={!form.periodName || !form.fromDate || !form.toDate || create.isPending} onClick={() => create.mutate(form)}>
              {create.isPending ? "Creating…" : "Create Period"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? <div className="text-muted-foreground text-sm">Loading…</div> :
        (periods as any[]).map((p: any) => (
          <Card key={p.id} className={`cursor-pointer transition-all ${selectedPeriod === p.id ? "ring-2 ring-primary" : ""}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between">
                <div onClick={() => setSelectedPeriod(selectedPeriod === p.id ? null : p.id)}>
                  <div className="font-semibold">{p.periodName}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(p.fromDate)} → {fmtDate(p.toDate)} · {p.periodType}</div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Gross: <strong>{fmtCur(p.totalGross)}</strong></span>
                    <span>Deductions: <strong>{fmtCur(p.totalDeductions)}</strong></span>
                    <span>Net: <strong className="text-green-600">{fmtCur(p.totalNet)}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(p.status)}`}>{p.status}</span>
                  {p.status === "draft" && <Button size="sm" variant="outline" onClick={() => compute.mutate(p.id)} disabled={compute.isPending}>Compute</Button>}
                  {p.status === "computed" && <Button size="sm" onClick={() => approve.mutate(p.id)} disabled={approve.isPending}>Approve</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedPeriod && lines.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Wage Bill Detail</h4>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>{["Worker","Days","OT hrs","Basic","OT Amt","Gross","EPF Ee","ESI Ee","PT","LWF","Deductions","Net Wages"].map(h=><th key={h} className="px-2 py-2 text-right first:text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(lines as any[]).map((l: any) => (
                  <tr key={l.id} className="border-t hover:bg-muted/30">
                    <td className="px-2 py-1.5 font-medium">{workerMap[l.workerId] ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right">{l.presentDays}</td>
                    <td className="px-2 py-1.5 text-right">{l.otHours}</td>
                    <td className="px-2 py-1.5 text-right">{fmtCur(l.basicWages)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtCur(l.otAmount)}</td>
                    <td className="px-2 py-1.5 text-right font-medium">{fmtCur(l.grossWages)}</td>
                    <td className="px-2 py-1.5 text-right text-red-600">{fmtCur(l.epfEmployee)}</td>
                    <td className="px-2 py-1.5 text-right text-red-600">{fmtCur(l.esiEmployee)}</td>
                    <td className="px-2 py-1.5 text-right text-red-600">{fmtCur(l.pt)}</td>
                    <td className="px-2 py-1.5 text-right text-red-600">{fmtCur(l.lwf)}</td>
                    <td className="px-2 py-1.5 text-right text-red-600">{fmtCur(l.totalDeductions)}</td>
                    <td className="px-2 py-1.5 text-right font-semibold text-green-700">{fmtCur(l.netWages)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ITP Tab ──────────────────────────────────────────────────────────────────
function ItpTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<any>(null);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: itps = [], isLoading } = useQuery({ queryKey: ["itps", projectId], queryFn: () => api(`/projects/${projectId}/itps`), enabled: !!projectId });
  const { data: detail } = useQuery({ queryKey: ["itp-detail", selected?.id], queryFn: () => api(`/itps/${selected.id}`), enabled: !!selected?.id });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/itps`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["itps", projectId] }); setOpen(false); toast({ title: "ITP created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const approveMut = useMutation({
    mutationFn: (id: string) => api(`/itps/${id}/approve`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["itps", projectId] }); toast({ title: "ITP approved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Inspection Test Plans</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New ITP</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create ITP</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1"><Label>Title</Label><Input value={form.title??""} onChange={e=>f("title",e.target.value)} placeholder="e.g. RCC Slab ITP" /></div>
                <div className="space-y-1"><Label>Revision</Label><Input value={form.revision??"0"} onChange={e=>f("revision",e.target.value)} /></div>
              </div>
              <Button className="w-full" disabled={!form.title || create.isPending} onClick={() => create.mutate(form)}>{create.isPending ? "Creating…" : "Create ITP"}</Button>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> :
        (itps as any[]).map((itp: any) => (
          <Card key={itp.id} className={`cursor-pointer hover:shadow transition-all ${selected?.id === itp.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelected(itp)}>
            <CardContent className="pt-3 pb-3">
              <div className="font-medium text-sm">{itp.title}</div>
              <div className="text-xs text-muted-foreground">Rev {itp.revision}</div>
              <div className="flex justify-between items-center mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(itp.status)}`}>{itp.status}</span>
                {itp.status === "draft" && (
                  <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); approveMut.mutate(itp.id); }} disabled={approveMut.isPending}>Approve</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="md:col-span-2">
        {selected && detail ? (
          <Card>
            <CardHeader><CardTitle className="text-base">{detail.title} — Hold / Witness Points</CardTitle></CardHeader>
            <CardContent>
              {detail.items?.length === 0 ? <div className="text-sm text-muted-foreground">No checkpoints added yet.</div> : (
                <div className="space-y-2">
                  {(detail.items ?? []).map((item: any, i: number) => (
                    <div key={item.id} className="rounded border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium">{i+1}. {item.activityDescription}</div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${item.checkPointType === "hold" ? "bg-red-100 text-red-800" : item.checkPointType === "witness" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>{item.checkPointType}</span>
                      </div>
                      {item.acceptanceCriteria && <div className="text-xs text-muted-foreground mt-1">✓ {item.acceptanceCriteria}</div>}
                      {item.referenceCode && <div className="text-xs text-blue-600 mt-0.5">Ref: {item.referenceCode}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm border rounded-lg p-8">Select an ITP to view checkpoints</div>
        )}
      </div>
    </div>
  );
}

// ─── Inspection Requests Tab ───────────────────────────────────────────────────
function InspectionsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ inspectionDate: new Date().toISOString().slice(0,10) });
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: irs = [], isLoading } = useQuery({ queryKey: ["irs", projectId], queryFn: () => api(`/projects/${projectId}/inspection-requests`), enabled: !!projectId });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/inspection-requests`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["irs", projectId] }); setOpen(false); toast({ title: "Inspection Request raised" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const passed = (irs as any[]).filter(r => r.result === "passed").length;
  const failed = (irs as any[]).filter(r => r.result === "failed").length;
  const pending = (irs as any[]).filter(r => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{irs.length}</div><div className="text-sm text-muted-foreground">Total IRs</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{pending}</div><div className="text-sm text-muted-foreground">Pending</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{passed}</div><div className="text-sm text-muted-foreground">Passed</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{failed}</div><div className="text-sm text-muted-foreground">Failed</div></CardContent></Card>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Inspection Requests</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Raise IR</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Raise Inspection Request</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1"><Label>Inspection Date</Label><Input type="date" value={form.inspectionDate??""} onChange={e=>f("inspectionDate",e.target.value)} /></div>
              <div className="space-y-1"><Label>Location</Label><Input value={form.location??""} onChange={e=>f("location",e.target.value)} /></div>
              <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes??""} onChange={e=>f("notes",e.target.value)} rows={3} /></div>
            </div>
            <Button className="w-full" disabled={!form.inspectionDate || create.isPending} onClick={() => create.mutate(form)}>{create.isPending ? "Raising…" : "Raise IR"}</Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{["IR No.","Date","Location","Status","Result"].map(h=><th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">Loading…</td></tr> :
            (irs as any[]).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{r.irNumber}</td>
                <td className="px-3 py-2">{fmtDate(r.inspectionDate)}</td>
                <td className="px-3 py-2">{fmt(r.location)}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(r.status)}`}>{r.status}</span></td>
                <td className="px-3 py-2">{r.result ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.result === "passed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{r.result}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NCR Tab ──────────────────────────────────────────────────────────────────
function NcrTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<any>(null);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: ncrs = [], isLoading } = useQuery({ queryKey: ["ncrs", projectId], queryFn: () => api(`/projects/${projectId}/ncrs`), enabled: !!projectId });
  const { data: detail } = useQuery({ queryKey: ["ncr-detail", selected?.id], queryFn: () => api(`/ncrs/${selected.id}`), enabled: !!selected?.id });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/ncrs`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ncrs", projectId] }); setOpen(false); toast({ title: "NCR raised" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const patchNcr = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api(`/ncrs/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ncrs", projectId] }); toast({ title: "NCR updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const open_ = (ncrs as any[]).filter(n => n.status === "open").length;
  const closed = (ncrs as any[]).filter(n => n.status === "closed").length;
  const critical = (ncrs as any[]).filter(n => n.severity === "critical").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{ncrs.length}</div><div className="text-sm text-muted-foreground">Total NCRs</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{open_}</div><div className="text-sm text-muted-foreground">Open</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-orange-600">{critical}</div><div className="text-sm text-muted-foreground">Critical</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{closed}</div><div className="text-sm text-muted-foreground">Closed</div></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">NCR List</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Raise NCR</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Raise NCR</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1"><Label>Trade</Label><Input value={form.trade??""} onChange={e=>f("trade",e.target.value)} /></div>
                  <div className="space-y-1"><Label>Severity</Label>
                    <Select value={form.severity??"minor"} onValueChange={v=>f("severity",v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="minor">Minor</SelectItem><SelectItem value="major">Major</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Description</Label><Textarea value={form.description??""} onChange={e=>f("description",e.target.value)} rows={3} /></div>
                  <div className="space-y-1"><Label>Root Cause</Label><Textarea value={form.rootCause??""} onChange={e=>f("rootCause",e.target.value)} rows={2} /></div>
                </div>
                <Button className="w-full" disabled={!form.description || create.isPending} onClick={() => create.mutate(form)}>{create.isPending ? "Raising…" : "Raise NCR"}</Button>
              </DialogContent>
            </Dialog>
          </div>
          {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> :
          (ncrs as any[]).map((n: any) => (
            <Card key={n.id} className={`cursor-pointer hover:shadow transition-all ${selected?.id === n.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelected(n)}>
              <CardContent className="pt-3 pb-3">
                <div className="flex justify-between items-start">
                  <div className="font-mono text-xs text-muted-foreground">{n.ncrNumber}</div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(n.severity)}`}>{n.severity}</span>
                </div>
                <div className="text-sm font-medium mt-1 line-clamp-2">{n.description}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(n.status)}`}>{n.status.replace(/_/g," ")}</span>
                  {n.status !== "closed" && <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); patchNcr.mutate({ id: n.id, body: { status: "closed" } }); }}>Close</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="md:col-span-2">
          {selected && detail ? (
            <Card>
              <CardHeader><CardTitle className="text-base">{detail.ncrNumber} — {detail.severity.toUpperCase()}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label className="text-xs">Description</Label><p className="text-sm mt-1">{detail.description}</p></div>
                {detail.rootCause && <div><Label className="text-xs">Root Cause</Label><p className="text-sm mt-1">{detail.rootCause}</p></div>}
                {detail.reworkCost && parseFloat(detail.reworkCost) > 0 && <div><Label className="text-xs">Rework Cost</Label><p className="text-sm mt-1 font-semibold">{fmtCur(detail.reworkCost)}</p></div>}
                <div>
                  <Label className="text-xs mb-2 block">CAPA Actions</Label>
                  {(detail.actions ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No actions yet</div> :
                  (detail.actions ?? []).map((a: any) => (
                    <div key={a.id} className="border rounded p-2 mb-2">
                      <div className="text-xs font-medium text-blue-600">{a.actionType.replace(/_/g," ").toUpperCase()}</div>
                      <div className="text-sm">{a.description}</div>
                      {a.dueDate && <div className="text-xs text-muted-foreground">Due: {fmtDate(a.dueDate)}</div>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm border rounded-lg p-8">Select an NCR to view details</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Safety Permits Tab ────────────────────────────────────────────────────────
function PermitsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    startDateTime: `${new Date().toISOString().slice(0, 10)}T08:00`,
    endDateTime: `${new Date().toISOString().slice(0, 10)}T18:00`,
  });
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: permits = [], isLoading } = useQuery({ queryKey: ["permits", projectId], queryFn: () => api(`/projects/${projectId}/safety-permits`), enabled: !!projectId });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/safety-permits`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["permits", projectId] }); setOpen(false); toast({ title: "Permit raised" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const patchPermit = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api(`/safety-permits/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["permits", projectId] }); toast({ title: "Permit updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Permit-to-Work Board</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Permit</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Issue Permit to Work</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1"><Label>Permit Type</Label>
                <Select value={form.permitType??""} onValueChange={v=>f("permitType",v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{PERMIT_TYPES.map(t=><SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Work Description</Label><Textarea value={form.workDescription??""} onChange={e=>f("workDescription",e.target.value)} rows={2} /></div>
              <div className="space-y-1"><Label>Location</Label><Input value={form.location??""} onChange={e=>f("location",e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Start</Label><Input type="datetime-local" value={form.startDateTime??""} onChange={e=>f("startDateTime",e.target.value)} /></div>
                <div className="space-y-1"><Label>End</Label><Input type="datetime-local" value={form.endDateTime??""} onChange={e=>f("endDateTime",e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>Hazards</Label><Textarea value={form.hazards??""} onChange={e=>f("hazards",e.target.value)} rows={2} /></div>
              <div className="space-y-1"><Label>Precautions</Label><Textarea value={form.precautions??""} onChange={e=>f("precautions",e.target.value)} rows={2} /></div>
            </div>
            <Button className="w-full" disabled={!form.permitType || !form.workDescription || create.isPending} onClick={() => create.mutate(form)}>{create.isPending ? "Creating…" : "Issue Permit"}</Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> :
        (permits as any[]).map((p: any) => (
          <Card key={p.id}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{permitIcon(p.permitType)}{p.permitType.replace(/_/g," ").toUpperCase()}</div>
                  <div className="font-mono text-xs">{p.permitNumber}</div>
                  <div className="text-sm font-medium mt-1 line-clamp-2">{p.workDescription}</div>
                  {p.location && <div className="text-xs text-muted-foreground">{p.location}</div>}
                  <div className="text-xs text-muted-foreground mt-1">{fmtDate(p.startDateTime)} → {new Date(p.endDateTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(p.status)}`}>{p.status}</span>
                <div className="flex gap-1">
                  {p.status === "pending" && <Button size="sm" variant="outline" onClick={() => patchPermit.mutate({ id: p.id, body: { status: "approved" } })} disabled={patchPermit.isPending}>Approve</Button>}
                  {p.status === "approved" && <Button size="sm" onClick={() => patchPermit.mutate({ id: p.id, body: { status: "active" } })} disabled={patchPermit.isPending}>Activate</Button>}
                  {p.status === "active" && <Button size="sm" variant="outline" onClick={() => patchPermit.mutate({ id: p.id, body: { status: "closed" } })} disabled={patchPermit.isPending}>Close</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── HIRA Tab ─────────────────────────────────────────────────────────────────
function HiraTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ likelihood: "3", severity: "3", residualLikelihood: "2", residualSeverity: "2" });
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const { data: hira = [], isLoading } = useQuery({ queryKey: ["hira", projectId], queryFn: () => api(`/projects/${projectId}/hira`), enabled: !!projectId });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/hira`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hira", projectId] }); setOpen(false); toast({ title: "HIRA entry added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const riskColor = (level: string) => ({ extreme: "bg-red-200 text-red-900 border-red-300", high: "bg-orange-100 text-orange-800 border-orange-200", medium: "bg-yellow-100 text-yellow-800 border-yellow-200", low: "bg-green-100 text-green-800 border-green-200" }[level] ?? "bg-gray-100");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">HIRA — Hazard Register</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Hazard</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add HIRA Entry</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1"><Label>Hazard Description</Label><Textarea value={form.hazardDescription??""} onChange={e=>f("hazardDescription",e.target.value)} rows={2} /></div>
              <div className="space-y-1"><Label>Category</Label><Input value={form.hazardCategory??""} onChange={e=>f("hazardCategory",e.target.value)} placeholder="Physical / Chemical / Electrical…" /></div>
              <div className="grid grid-cols-2 gap-3">
                {[["likelihood","Likelihood (1-5)"],["severity","Severity (1-5)"]].map(([k,lbl])=>(
                  <div key={k} className="space-y-1"><Label>{lbl}</Label>
                    <Select value={String(form[k]??3)} onValueChange={v=>f(k,v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="space-y-1"><Label>Control Measures</Label><Textarea value={form.controlMeasures??""} onChange={e=>f("controlMeasures",e.target.value)} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                {[["residualLikelihood","Residual Likelihood"],["residualSeverity","Residual Severity"]].map(([k,lbl])=>(
                  <div key={k} className="space-y-1"><Label>{lbl}</Label>
                    <Select value={String(form[k]??2)} onValueChange={v=>f(k,v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1,2,3,4,5].map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled={!form.hazardDescription || create.isPending} onClick={() => create.mutate(form)}>{create.isPending ? "Saving…" : "Add Entry"}</Button>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="space-y-2">
          {(hira as any[]).map((h: any) => (
            <div key={h.id} className={`rounded-lg border p-3 ${riskColor(h.riskLevel)}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-sm">{h.hazardDescription}</div>
                  {h.hazardCategory && <div className="text-xs mt-0.5 opacity-75">{h.hazardCategory}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold">{h.riskScore}</div>
                  <div className="text-xs uppercase font-medium">{h.riskLevel}</div>
                  <div className="text-xs opacity-75">{h.likelihood}×{h.severity}</div>
                </div>
              </div>
              {h.controlMeasures && <div className="text-xs mt-2 border-t pt-2 opacity-80">✓ {h.controlMeasures}</div>}
              <div className="text-xs mt-1 opacity-60">Residual: {h.residualLikelihood}×{h.residualSeverity} = {h.residualRiskScore}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Incidents Tab ─────────────────────────────────────────────────────────────
function IncidentsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ incidentDate: new Date().toISOString().slice(0,10), classification: "near_miss" });
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: incidents = [], isLoading } = useQuery({ queryKey: ["incidents", projectId], queryFn: () => api(`/projects/${projectId}/incidents`), enabled: !!projectId });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/incidents`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents", projectId] }); setOpen(false); toast({ title: "Incident reported" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const closeInc = useMutation({
    mutationFn: (id: string) => api(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents", projectId] }); toast({ title: "Incident closed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const clsMap: Record<string, string> = { near_miss: "Near Miss", first_aid: "First Aid", lti: "LTI", fatality: "Fatality", property_damage: "Property Damage" };
  const totalLostDays = (incidents as any[]).reduce((s: number, i: any) => s + (i.lostDays ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{incidents.length}</div><div className="text-sm text-muted-foreground">Total Incidents</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-yellow-600">{(incidents as any[]).filter(i=>i.classification==="near_miss").length}</div><div className="text-sm text-muted-foreground">Near Miss</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{(incidents as any[]).filter(i=>["lti","fatality"].includes(i.classification)).length}</div><div className="text-sm text-muted-foreground">LTI / Fatality</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{totalLostDays}</div><div className="text-sm text-muted-foreground">Lost Days</div></CardContent></Card>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Incident Register</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Report Incident</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Report Incident</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1"><Label>Title</Label><Input value={form.title??""} onChange={e=>f("title",e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.incidentDate??""} onChange={e=>f("incidentDate",e.target.value)} /></div>
                <div className="space-y-1"><Label>Classification</Label>
                  <Select value={form.classification??"near_miss"} onValueChange={v=>f("classification",v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INCIDENT_CLASSES.map(c=><SelectItem key={c} value={c}>{clsMap[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label>Location</Label><Input value={form.location??""} onChange={e=>f("location",e.target.value)} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={form.description??""} onChange={e=>f("description",e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Injured Persons</Label><Input value={form.injured??""} onChange={e=>f("injured",e.target.value)} /></div>
                <div className="space-y-1"><Label>Lost Days</Label><Input type="number" min="0" value={form.lostDays??""} onChange={e=>f("lostDays",e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>Immediate Action</Label><Textarea value={form.immediateAction??""} onChange={e=>f("immediateAction",e.target.value)} rows={2} /></div>
            </div>
            <Button className="w-full" disabled={!form.title || !form.incidentDate || create.isPending} onClick={() => create.mutate(form)}>{create.isPending ? "Reporting…" : "Report Incident"}</Button>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="space-y-2">
          {(incidents as any[]).map((inc: any) => (
            <Card key={inc.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{inc.incidentNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(inc.classification)}`}>{clsMap[inc.classification] ?? inc.classification}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(inc.status)}`}>{inc.status}</span>
                    </div>
                    <div className="font-medium text-sm mt-1">{inc.title}</div>
                    {inc.location && <div className="text-xs text-muted-foreground">{inc.location} · {fmtDate(inc.incidentDate)}</div>}
                    {inc.immediateAction && <div className="text-xs mt-1 text-green-700">Action: {inc.immediateAction}</div>}
                    {inc.lostDays > 0 && <div className="text-xs text-red-600 mt-0.5">Lost Days: {inc.lostDays}</div>}
                  </div>
                  {inc.status === "open" && (
                    <Button size="sm" variant="outline" onClick={() => closeInc.mutate(inc.id)} disabled={closeInc.isPending}>Close</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Safety Dashboard Tab ──────────────────────────────────────────────────────
function SafetyDashboardTab({ projectId }: { projectId: string }) {
  const { data: dash, isLoading } = useQuery({
    queryKey: ["safety-dash", projectId], queryFn: () => api(`/projects/${projectId}/safety-dashboard`), enabled: !!projectId,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading safety dashboard…</div>;
  if (!dash) return null;

  const scoreInputs = [
    { label: "PPE Compliance", value: dash.ppeCompliancePct, max: 100 },
    { label: "Open Permits", value: dash.openPermits + dash.activePermits, maxBad: true },
    { label: "Open NCRs", value: dash.openNcrs, maxBad: true },
    { label: "Open Incidents", value: dash.openIncidents, maxBad: true },
  ];
  const safetyScore = Math.max(0, Math.round(dash.ppeCompliancePct - (dash.openNcrs * 5) - (dash.openIncidents * 10)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4">
          <div className="text-3xl font-bold text-green-600">{dash.ppeCompliancePct}%</div>
          <div className="text-sm text-muted-foreground">PPE Compliance</div>
          <div className="mt-2 h-2 rounded bg-muted overflow-hidden"><div className="h-2 bg-green-500 rounded" style={{ width: `${dash.ppeCompliancePct}%` }} /></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-3xl font-bold text-yellow-600">{dash.openPermits + dash.activePermits}</div><div className="text-sm text-muted-foreground">Active/Pending Permits</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-3xl font-bold text-orange-600">{dash.openNcrs}</div><div className="text-sm text-muted-foreground">Open NCRs</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-3xl font-bold text-red-600">{dash.openIncidents}</div><div className="text-sm text-muted-foreground">Open Incidents</div></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-base">Safety Score</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-5xl font-bold ${safetyScore >= 80 ? "text-green-600" : safetyScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>{safetyScore}</div>
            <div className="text-sm text-muted-foreground">/100</div>
            <div className={`mt-2 text-sm font-medium ${safetyScore >= 80 ? "text-green-600" : safetyScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {safetyScore >= 80 ? "Good" : safetyScore >= 60 ? "Needs Attention" : "Critical — Immediate Action Required"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{dash.totalWorkers} active workers</div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent Incidents</CardTitle></CardHeader>
          <CardContent>
            {dash.recentIncidents?.length === 0 ? <div className="text-sm text-muted-foreground">No incidents — good work!</div> :
            (dash.recentIncidents ?? []).map((i: any) => (
              <div key={i.id} className="border-b last:border-0 py-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(i.classification)}`}>{i.classification.replace(/_/g," ")}</span>
                  <span className="text-sm font-medium">{i.title}</span>
                </div>
                <div className="text-xs text-muted-foreground">{fmtDate(i.incidentDate)} {i.location ? `· ${i.location}` : ""}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {dash.highRisks?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base text-orange-700">High / Extreme Risk Hazards</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dash.highRisks.map((h: any) => (
                <div key={h.id} className={`rounded p-2 border text-sm ${h.riskLevel === "extreme" ? "border-red-300 bg-red-50" : "border-orange-300 bg-orange-50"}`}>
                  <div className="font-medium">{h.hazardDescription}</div>
                  <div className="text-xs mt-0.5 opacity-75">Risk: {h.riskScore} ({h.riskLevel}) · {h.hazardCategory}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── PPE Register Tab ─────────────────────────────────────────────────────────
function PpeTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ condition: "new" });
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: ppes = [], isLoading } = useQuery({ queryKey: ["ppe", projectId], queryFn: () => api(`/projects/${projectId}/ppe-issues`), enabled: !!projectId });
  const { data: workers = [] } = useQuery({ queryKey: ["workers", projectId], queryFn: () => api(`/projects/${projectId}/workers`), enabled: !!projectId });

  const create = useMutation({
    mutationFn: (b: any) => api(`/projects/${projectId}/ppe-issues`, { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ppe", projectId] }); setOpen(false); toast({ title: "PPE issued" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const workerMap = Object.fromEntries((workers as any[]).map(w => [w.id, w.name]));
  const byType: Record<string, number> = {};
  for (const p of ppes as any[]) byType[p.ppeType] = (byType[p.ppeType] ?? 0) + 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">PPE Issue Register</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Issue PPE</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue PPE</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1"><Label>Worker</Label>
                <Select value={form.workerId??""} onValueChange={v=>f("workerId",v)}>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>{(workers as any[]).map(w=><SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>PPE Type</Label>
                <Select value={form.ppeType??""} onValueChange={v=>f("ppeType",v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{PPE_TYPES.map(t=><SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Condition</Label>
                <Select value={form.condition??"new"} onValueChange={v=>f("condition",v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["new","good","worn","damaged"].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" disabled={!form.workerId || !form.ppeType || create.isPending} onClick={() => create.mutate(form)}>{create.isPending ? "Issuing…" : "Issue PPE"}</Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {Object.entries(byType).map(([type, count]) => (
          <div key={type} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{type.replace(/_/g," ")}: {count}</div>
        ))}
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{["Worker","PPE Type","Issued Date","Condition"].map(h=><th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Loading…</td></tr> :
            (ppes as any[]).slice(0, 50).map((p: any) => (
              <tr key={p.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{workerMap[p.workerId] ?? "—"}</td>
                <td className="px-3 py-2">{p.ppeType.replace(/_/g," ")}</td>
                <td className="px-3 py-2">{fmtDate(p.issuedDate)}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${p.condition === "new" ? "bg-green-100 text-green-800" : p.condition === "damaged" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>{p.condition}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkforcePage({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="workers">
        <TabsList className="bg-background border h-auto p-1 overflow-x-auto flex-nowrap w-full justify-start">
          <TabsTrigger value="workers" className="flex items-center gap-1.5"><Users className="h-4 w-4" />Workers</TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-1.5"><CalendarCheck className="h-4 w-4" />Attendance</TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-1.5"><Wallet className="h-4 w-4" />Payroll</TabsTrigger>
          <TabsTrigger value="itp" className="flex items-center gap-1.5"><ClipboardCheck className="h-4 w-4" />ITP</TabsTrigger>
          <TabsTrigger value="inspections" className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" />Inspections</TabsTrigger>
          <TabsTrigger value="ncr" className="flex items-center gap-1.5"><AlertCircle className="h-4 w-4" />NCR</TabsTrigger>
          <TabsTrigger value="permits" className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />Permits</TabsTrigger>
          <TabsTrigger value="hira" className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />HIRA</TabsTrigger>
          <TabsTrigger value="ppe" className="flex items-center gap-1.5"><HardHat className="h-4 w-4" />PPE</TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />Incidents</TabsTrigger>
          <TabsTrigger value="safety-dashboard" className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4" />Safety Dash</TabsTrigger>
        </TabsList>

        <TabsContent value="workers"><WorkersTab projectId={projectId} /></TabsContent>
        <TabsContent value="attendance"><AttendanceTab projectId={projectId} /></TabsContent>
        <TabsContent value="payroll"><PayrollTab projectId={projectId} /></TabsContent>
        <TabsContent value="itp"><ItpTab projectId={projectId} /></TabsContent>
        <TabsContent value="inspections"><InspectionsTab projectId={projectId} /></TabsContent>
        <TabsContent value="ncr"><NcrTab projectId={projectId} /></TabsContent>
        <TabsContent value="permits"><PermitsTab projectId={projectId} /></TabsContent>
        <TabsContent value="hira"><HiraTab projectId={projectId} /></TabsContent>
        <TabsContent value="ppe"><PpeTab projectId={projectId} /></TabsContent>
        <TabsContent value="incidents"><IncidentsTab projectId={projectId} /></TabsContent>
        <TabsContent value="safety-dashboard"><SafetyDashboardTab projectId={projectId} /></TabsContent>
      </Tabs>
    </div>
  );
}
