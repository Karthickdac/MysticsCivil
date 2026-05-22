import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, Link } from "wouter";
import {
  useCreateProject,
  useListOrganisations,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";

const milestoneSchema = z.object({
  name: z.string().min(1, "Required"),
  targetDate: z.string().min(1, "Required"),
  description: z.string().optional(),
});

const projectSchema = z.object({
  organisationId: z.string().min(1, "Organisation is required"),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  clientName: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  reraNumber: z.string().optional(),
  contractValue: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  milestones: z.array(milestoneSchema).default([]),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gpsBusy, setGpsBusy] = useState(false);

  const { data: orgs } = useListOrganisations();
  const createProject = useCreateProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      organisationId: "", code: "", name: "", clientName: "", description: "",
      location: "", latitude: "", longitude: "", reraNumber: "",
      contractValue: 0, startDate: "", targetEndDate: "", coverImageUrl: "",
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "milestones" });

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS unavailable", description: "Geolocation not supported by this browser.", variant: "destructive" });
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("latitude", pos.coords.latitude.toFixed(6));
        form.setValue("longitude", pos.coords.longitude.toFixed(6));
        setGpsBusy(false);
        toast({ title: "GPS captured", description: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
      },
      (err) => { setGpsBusy(false); toast({ title: "GPS failed", description: err.message, variant: "destructive" }); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  function onSubmit(data: ProjectFormValues) {
    const payload: any = { ...data };
    if (!payload.latitude) delete payload.latitude;
    if (!payload.longitude) delete payload.longitude;
    if (!payload.coverImageUrl) delete payload.coverImageUrl;
    createProject.mutate(
      { data: payload },
      {
        onSuccess: (project) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project created", description: `${project.name} is ready.` });
          setLocation(`/projects/${project.id}`);
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error?.message || "Failed to create project", variant: "destructive" });
        },
      },
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground mt-1">Set up the site, contract, location, compliance and contractual milestones.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Identity & Org Hierarchy</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="organisationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an organisation" /></SelectTrigger></FormControl>
                    <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">This project rolls up under the chosen company for billing & reporting.</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Project Code</FormLabel><FormControl><Input placeholder="e.g. DLF-OAK" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Project Name</FormLabel><FormControl><Input placeholder="Enter project name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="clientName" render={({ field }) => (
                <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input placeholder="e.g. DLF Home Developers" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contractValue" render={({ field }) => (
                <FormItem><FormLabel>Contract Value (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Location & GPS</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Site Address</FormLabel><FormControl><Input placeholder="Sector, City, State" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="latitude" render={({ field }) => (
                <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input placeholder="28.4089" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="longitude" render={({ field }) => (
                <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input placeholder="76.9854" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="md:col-span-2">
                <Button type="button" variant="outline" onClick={captureGps} disabled={gpsBusy}>
                  <MapPin className="h-4 w-4 mr-1" /> {gpsBusy ? "Locating…" : "Capture from device GPS"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Compliance</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="reraNumber" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>RERA Registration Number</FormLabel><FormControl><Input placeholder="e.g. RERA-DLF-OAK-2024" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Schedule</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="targetEndDate" render={({ field }) => (
                <FormItem><FormLabel>Target End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Contractual Milestones</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Optional — define key dates now or add them later.</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => append({ name: "", targetDate: "", description: "" })}>
                <Plus className="h-4 w-4 mr-1" /> Add milestone
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No milestones yet.</div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                      <FormField control={form.control} name={`milestones.${idx}.name`} render={({ field }) => (
                        <FormItem className="col-span-5"><FormControl><Input placeholder="Milestone name" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`milestones.${idx}.targetDate`} render={({ field }) => (
                        <FormItem className="col-span-3"><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`milestones.${idx}.description`} render={({ field }) => (
                        <FormItem className="col-span-3"><FormControl><Input placeholder="Notes" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <button type="button" onClick={() => remove(idx)} className="col-span-1 text-muted-foreground hover:text-rose-600 mt-2 justify-self-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Description & Cover</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coverImageUrl" render={({ field }) => (
                <FormItem><FormLabel>Cover Image URL</FormLabel><FormControl><Input placeholder="https://…" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setLocation("/projects")}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating…" : "Create Project"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
