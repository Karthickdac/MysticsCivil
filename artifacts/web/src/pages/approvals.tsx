import { useListApprovals, useResolveApproval, getListApprovalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Check, X, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Approvals() {
  const { data: approvals, isLoading } = useListApprovals();
  const resolveApproval = useResolveApproval();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleResolve = (id: string, decision: "approved" | "rejected") => {
    resolveApproval.mutate(
      { id, data: { decision } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApprovalsQueryKey() });
          toast({
            title: `Item ${decision}`,
            description: `The approval item has been ${decision}.`,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to process the approval.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and action items requiring your approval.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : approvals?.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
              <p className="mt-2 text-sm text-muted-foreground">You have no pending approvals.</p>
            </div>
          ) : (
            <div className="divide-y">
              {approvals?.map(item => (
                <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">{item.title}</h4>
                      <Badge variant="outline" className="capitalize">{item.entityType}</Badge>
                      {item.ageDays > 3 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Overdue
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>Project: <span className="font-medium text-foreground">{item.projectName}</span></span>
                      <span>•</span>
                      <span>Requested by: {item.requestedByName}</span>
                      <span>•</span>
                      <span>{item.ageDays} days ago</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleResolve(item.id, "rejected")}
                      disabled={resolveApproval.isPending}
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleResolve(item.id, "approved")}
                      disabled={resolveApproval.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
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
