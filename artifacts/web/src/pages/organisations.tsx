import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOrganisations,
  useCreateOrganisation,
  getListOrganisationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Building } from "lucide-react";

export default function Organisations() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", legalName: "", gstin: "", pan: "", city: "", state: "",
  });

  const { data } = useListOrganisations({
    query: { queryKey: getListOrganisationsQueryKey() },
  });
  const create = useCreateOrganisation();

  const submit = () => {
    if (!form.name) return;
    create.mutate(
      { data: form },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ name: "", legalName: "", gstin: "", pan: "", city: "", state: "" });
          qc.invalidateQueries({ queryKey: getListOrganisationsQueryKey() });
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organisations</h1>
          <p className="text-sm text-muted-foreground mt-1">Companies and entities billing on this tenant.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New Organisation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Organisation</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Legal Name</Label><Input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} /></div>
              <div><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              <div><Label>PAN</Label><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} /></div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={create.isPending}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Organisations</CardTitle></CardHeader>
        <CardContent>
          {!data?.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No organisations yet.</div>
          ) : (
            <div className="divide-y">
              {data.map((o) => (
                <div key={o.id} className="flex items-center gap-4 py-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{o.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[o.legalName, o.gstin, [o.city, o.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
