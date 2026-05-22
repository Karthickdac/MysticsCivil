import { useState, useMemo } from "react";
import {
  useListDsrRates,
  useCreateDsrRate,
  useUpdateDsrRate,
  getListDsrRatesQueryKey,
} from "@workspace/api-client-react";
import type { DsrRate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/ocms-format";
import { Plus, Search, Edit2, Check, X, BookOpen } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const TRADES = [
  "Earthwork","RCC","Masonry","Plaster","Flooring","Tiling","Waterproofing",
  "Painting","MEP-Electrical","MEP-Plumbing","MEP-HVAC","Facade","Structural Steel",
  "Piling","Roads","External Works","Landscaping","Prelims","Finishing","Glazing",
];

const STATES = [
  "Delhi","Haryana","Maharashtra","Karnataka","Tamil Nadu","Telangana",
  "Gujarat","Rajasthan","Uttar Pradesh","West Bengal","Madhya Pradesh","Chhattisgarh",
];

const CITY_TIERS = ["T1", "T2", "T3"];
const SOURCES = ["DSR", "SSR", "MoRTH", "CPWD", "Market", "Quoted"];

function NewRateDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", trade: TRADES[0], unit: "", state: STATES[0], cityTier: "T2", rate: "", source: "DSR", effectiveYear: new Date().getFullYear() });
  const { toast } = useToast();
  const qc = useQueryClient();
  const createRate = useCreateDsrRate();

  const submit = () => {
    if (!form.code || !form.description || !form.unit || !form.rate) {
      toast({ title: "Fill all required fields", variant: "destructive" }); return;
    }
    createRate.mutate(
      { data: { ...form, rate: Number(form.rate) } },
      {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListDsrRatesQueryKey({}) }); toast({ title: "Rate added" }); setOpen(false); setForm(f => ({ ...f, code: "", description: "", unit: "", rate: "" })); },
        onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Rate</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add DSR/SSR Rate</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div><label className="text-xs font-medium">Code</label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. DSR-5.1.2" /></div>
          <div>
            <label className="text-xs font-medium">Trade</label>
            <Select value={form.trade} onValueChange={v => setForm(f => ({ ...f, trade: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><label className="text-xs font-medium">Description</label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Full item description" /></div>
          <div><label className="text-xs font-medium">Unit</label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. cum, sqm, MT" /></div>
          <div><label className="text-xs font-medium">Rate (₹)</label><Input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} /></div>
          <div>
            <label className="text-xs font-medium">State</label>
            <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">City Tier</label>
            <Select value={form.cityTier} onValueChange={v => setForm(f => ({ ...f, cityTier: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CITY_TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium">Source</label>
            <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><label className="text-xs font-medium">Effective Year</label><Input type="number" value={form.effectiveYear} onChange={e => setForm(f => ({ ...f, effectiveYear: Number(e.target.value) }))} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createRate.isPending}>Add Rate</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RateRow({ rate }: { rate: DsrRate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(rate.rate));
  const updateRate = useUpdateDsrRate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const save = () => {
    updateRate.mutate(
      { rateId: rate.id, data: { rate: Number(val) } },
      {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getListDsrRatesQueryKey({}) }); setEditing(false); toast({ title: "Rate updated" }); },
        onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }),
      },
    );
  };

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 group">
      <td className="py-2 px-2 text-xs font-mono text-muted-foreground">{rate.code}</td>
      <td className="py-2 px-2 text-sm">{rate.description}</td>
      <td className="py-2 px-2"><Badge variant="outline" className="text-[10px]">{rate.trade}</Badge></td>
      <td className="py-2 px-2 text-center text-xs">{rate.unit}</td>
      <td className="py-2 px-2 text-xs text-muted-foreground">{rate.state}</td>
      <td className="py-2 px-2 text-center text-xs">{rate.cityTier}</td>
      <td className="py-2 px-2 text-right tabular-nums font-medium">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input type="number" value={val} onChange={e => setVal(e.target.value)} className="h-6 w-24 text-right text-xs" />
            <button onClick={save} className="text-emerald-600"><Check className="h-3 w-3" /></button>
            <button onClick={() => setEditing(false)} className="text-rose-500"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <span>₹{Number(rate.rate).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        )}
      </td>
      <td className="py-2 px-2 text-center text-xs text-muted-foreground">{rate.effectiveYear}</td>
      <td className="py-2 px-2 text-xs text-muted-foreground">{rate.source}</td>
      <td className="py-2 px-2">
        <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

export default function DsrRatesPage() {
  const [q, setQ] = useState("");
  const [filterTrade, setFilterTrade] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const { data: rates = [], isLoading } = useListDsrRates({ q: q || undefined, trade: filterTrade !== "all" ? filterTrade : undefined, state: filterState !== "all" ? filterState : undefined, cityTier: filterTier !== "all" ? filterTier : undefined });

  const tradeGroups = useMemo(() => {
    const g: Record<string, number> = {};
    for (const r of rates) g[r.trade] = (g[r.trade] ?? 0) + 1;
    return Object.entries(g).sort((a, b) => b[1] - a[1]);
  }, [rates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" /> DSR / SSR Rate Library
          </h1>
          <p className="text-muted-foreground mt-1">Searchable rate database — editable by QS. Rates auto-populate estimation forms.</p>
        </div>
        <NewRateDialog />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search description or code…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Select value={filterTrade} onValueChange={setFilterTrade}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All trades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trades</SelectItem>
            {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All states" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-28"><SelectValue placeholder="All tiers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {CITY_TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{rates.length}</span> rates
        {tradeGroups.slice(0, 4).map(([t, c]) => <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded">{t}: {c}</span>)}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No rates found. Adjust filters or add new rates.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase text-muted-foreground border-b bg-muted/30">
                  <tr>
                    <th className="text-left py-2 px-2">Code</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-left py-2 px-2">Trade</th>
                    <th className="text-center py-2 px-2">Unit</th>
                    <th className="text-left py-2 px-2">State</th>
                    <th className="text-center py-2 px-2">Tier</th>
                    <th className="text-right py-2 px-2">Rate ₹</th>
                    <th className="text-center py-2 px-2">Year</th>
                    <th className="text-left py-2 px-2">Source</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map(r => <RateRow key={r.id} rate={r} />)}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
