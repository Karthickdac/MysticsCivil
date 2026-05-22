import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOrganisations,
  useCreateOrganisation,
  useUpdateOrganisation,
  useGetMyProfile,
  getListOrganisationsQueryKey,
  type Organisation,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Building, Pencil } from "lucide-react";

type OrgForm = {
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logoUrl: string;
};

const EMPTY_FORM: OrgForm = {
  name: "", legalName: "", gstin: "", pan: "", address: "", city: "", state: "", pincode: "", logoUrl: "",
};

function toForm(o: Organisation): OrgForm {
  return {
    name: o.name ?? "",
    legalName: o.legalName ?? "",
    gstin: o.gstin ?? "",
    pan: o.pan ?? "",
    address: o.address ?? "",
    city: o.city ?? "",
    state: o.state ?? "",
    pincode: o.pincode ?? "",
    logoUrl: o.logoUrl ?? "",
  };
}

export default function Organisations() {
  const qc = useQueryClient();
  const { data: profile } = useGetMyProfile();
  const isAdmin = profile?.role === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrgForm>(EMPTY_FORM);

  const { data } = useListOrganisations({
    query: { queryKey: getListOrganisationsQueryKey() },
  });
  const create = useCreateOrganisation();
  const update = useUpdateOrganisation();

  const editing = data?.find((o) => o.id === editingId) ?? null;

  useEffect(() => {
    if (editing) setForm(toForm(editing));
  }, [editing]);

  const onClose = () => {
    setCreateOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const payload: Record<string, string> = {};
    (Object.keys(form) as (keyof OrgForm)[]).forEach((k) => {
      const v = form[k]?.trim();
      if (v) payload[k] = v;
    });
    if (editingId) {
      update.mutate(
        { organisationId: editingId, data: payload },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListOrganisationsQueryKey() });
            onClose();
          },
        },
      );
    } else {
      create.mutate(
        { data: payload as { name: string } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListOrganisationsQueryKey() });
            onClose();
          },
        },
      );
    }
  };

  const dialogOpen = createOpen || !!editingId;
  const setDialogOpen = (open: boolean) => { if (!open) onClose(); };
  const busy = create.isPending || update.isPending;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organisations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Companies and entities billing on this tenant. Admin-only access to legal details."
              : "Companies set up on this tenant."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setCreateOpen(true); }} data-testid="org-new-btn">
                <Plus className="h-4 w-4 mr-1" /> New Organisation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Organisation" : "New Organisation"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="org-input-name" /></div>
                <div className="col-span-2"><Label>Legal Name</Label><Input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} /></div>
                <div><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
                <div><Label>PAN</Label><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} /></div>
                <div className="col-span-2"><Label>Address</Label><Textarea rows={2} className="resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
                <div><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
                <div><Label>Logo URL</Label><Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
                <Button onClick={submit} disabled={busy || !form.name.trim()} data-testid="org-submit">
                  {busy ? "Saving…" : editingId ? "Save changes" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Organisations</CardTitle></CardHeader>
        <CardContent>
          {!data?.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No organisations yet.
              {isAdmin && <> Click <strong>New Organisation</strong> to add one.</>}
            </div>
          ) : isAdmin ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="org-table">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                    <th className="py-2 pr-3 font-semibold">Name</th>
                    <th className="py-2 pr-3 font-semibold">Legal name</th>
                    <th className="py-2 pr-3 font-semibold">GSTIN</th>
                    <th className="py-2 pr-3 font-semibold">PAN</th>
                    <th className="py-2 pr-3 font-semibold">Address</th>
                    <th className="py-2 pr-3 font-semibold">Logo</th>
                    <th className="py-2 pr-3 font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((o) => (
                    <tr key={o.id} data-testid={`org-row-${o.id}`}>
                      <td className="py-3 pr-3 font-semibold">{o.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{o.legalName || "—"}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{o.gstin || "—"}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{o.pan || "—"}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground max-w-xs">
                        {[o.address, [o.city, o.state, o.pincode].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="py-3 pr-3">
                        {o.logoUrl ? (
                          <img src={o.logoUrl} alt="" className="h-8 w-8 rounded object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <Building className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setCreateOpen(false); setEditingId(o.id); }}
                          data-testid={`org-edit-${o.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y">
              {data.map((o) => (
                <div key={o.id} className="flex items-center gap-4 py-3" data-testid={`org-name-row-${o.id}`}>
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="font-medium">{o.name}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
