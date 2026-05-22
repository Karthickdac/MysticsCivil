import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjectPhotos,
  useCreateSitePhoto,
  getListProjectPhotosQueryKey,
  getGetProjectDashboardQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MapPin } from "lucide-react";
import { formatDate } from "@/lib/ocms-format";

export function PhotosTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ url: "", caption: "", tag: "progress" });

  const { data } = useListProjectPhotos(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectPhotosQueryKey(projectId) },
  });
  const create = useCreateSitePhoto();

  const submit = () => {
    if (!form.url) return;
    create.mutate(
      { projectId, data: { url: form.url, caption: form.caption, tag: form.tag } },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ url: "", caption: "", tag: "progress" });
          qc.invalidateQueries({ queryKey: getListProjectPhotosQueryKey(projectId) });
          qc.invalidateQueries({ queryKey: getGetProjectDashboardQueryKey(projectId) });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Site Photos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Photo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Site Photo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Image URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
              <div><Label>Caption</Label><Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></div>
              <div>
                <Label>Tag</Label>
                <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
                  <option value="progress">progress</option>
                  <option value="qc">qc</option>
                  <option value="safety">safety</option>
                  <option value="milestone">milestone</option>
                  <option value="defect">defect</option>
                </select>
              </div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={create.isPending}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!data?.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No photos uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((p) => (
              <div key={p.id} className="group rounded-lg overflow-hidden border bg-card">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-1">{p.caption || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>{formatDate(p.capturedAt)}</span>
                    {p.tag && <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase tracking-wide">{p.tag}</span>}
                    {p.latitude !== null && p.longitude !== null && (
                      <span className="flex items-center gap-0.5" title={`${p.latitude}, ${p.longitude}`}>
                        <MapPin className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
