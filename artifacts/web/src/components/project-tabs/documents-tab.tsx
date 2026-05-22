import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjectDocuments,
  useCreateDocument,
  getListProjectDocumentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/ocms-format";

export function DocumentsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", category: "Drawing", version: 1 });

  const { data } = useListProjectDocuments(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectDocumentsQueryKey(projectId) },
  });
  const create = useCreateDocument();

  const submit = () => {
    if (!form.name || !form.url) return;
    create.mutate(
      { projectId, data: form },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ name: "", url: "", category: "Drawing", version: 1 });
          qc.invalidateQueries({ queryKey: getListProjectDocumentsQueryKey(projectId) });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Document Register</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                  <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {["Drawing", "BoQ", "EHS", "QA/QC", "Contract", "Method Statement", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Version</Label><Input type="number" value={form.version} onChange={(e) => setForm({ ...form, version: parseInt(e.target.value) || 1 })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={create.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!data?.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No documents uploaded yet.</div>
        ) : (
          <div className="divide-y">
            {data.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.category} · v{d.version} · {formatDate(d.createdAt)}</div>
                </div>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
