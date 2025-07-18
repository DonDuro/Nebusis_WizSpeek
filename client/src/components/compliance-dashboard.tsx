import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Shield, FileText, History, Users, Clock, CheckCircle, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { getAuthToken } from "@/lib/auth";
import { MessageClassification, UserRole } from "@shared/schema";

// Simple API request function for compliance dashboard
const apiRequest = async (url: string, options: any = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const retentionPolicySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  messageClassification: z.string().optional(),
  retentionPeriodDays: z.number().min(1, "Retention period must be at least 1 day"),
});

const complianceReportSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  parameters: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    classification: z.string().optional(),
    department: z.string().optional(),
  }).optional(),
});

interface ComplianceDashboardProps {
  currentUser: any;
}

export function ComplianceDashboard({ currentUser }: ComplianceDashboardProps) {
  const queryClient = useQueryClient();
  const [selectedResource, setSelectedResource] = useState<{ id: number; type: string } | null>(null);

  const isAuthorized = currentUser?.role === UserRole.ADMIN || 
                      currentUser?.role === UserRole.COMPLIANCE_OFFICER || 
                      currentUser?.role === UserRole.AUDITOR;

  const canCreatePolicies = currentUser?.role === UserRole.ADMIN || 
                           currentUser?.role === UserRole.COMPLIANCE_OFFICER;

  // Fetch retention policies
  const { data: retentionPolicies } = useQuery({
    queryKey: ["/api/compliance/retention-policies"],
    enabled: isAuthorized,
  });

  // Fetch compliance reports
  const { data: complianceReports } = useQuery({
    queryKey: ["/api/compliance/reports"],
    enabled: isAuthorized,
  });

  // Fetch audit trail
  const { data: auditTrail } = useQuery({
    queryKey: ["/api/compliance/audit-trail"],
    enabled: isAuthorized,
  });

  // Fetch access logs for selected resource
  const { data: accessLogs } = useQuery({
    queryKey: ["/api/compliance/access-logs", selectedResource?.id, selectedResource?.type],
    enabled: isAuthorized && selectedResource?.id && selectedResource?.type,
    queryFn: () => apiRequest(`/api/compliance/access-logs?resourceId=${selectedResource?.id}&resourceType=${selectedResource?.type}`),
  });

  // Create retention policy mutation
  const createRetentionPolicyMutation = useMutation({
    mutationFn: (data: z.infer<typeof retentionPolicySchema>) =>
      apiRequest("/api/compliance/retention-policies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/retention-policies"] });
    },
  });

  // Create compliance report mutation
  const createComplianceReportMutation = useMutation({
    mutationFn: (data: z.infer<typeof complianceReportSchema>) =>
      apiRequest("/api/compliance/reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/reports"] });
    },
  });

  const retentionForm = useForm<z.infer<typeof retentionPolicySchema>>({
    resolver: zodResolver(retentionPolicySchema),
    defaultValues: {
      name: "",
      description: "",
      messageClassification: "",
      retentionPeriodDays: 365,
    },
  });

  const reportForm = useForm<z.infer<typeof complianceReportSchema>>({
    resolver: zodResolver(complianceReportSchema),
    defaultValues: {
      reportType: "retention_due",
      parameters: {
        dateFrom: "",
        dateTo: "",
        classification: "",
        department: "",
      },
    },
  });

  const onCreateRetentionPolicy = (data: z.infer<typeof retentionPolicySchema>) => {
    createRetentionPolicyMutation.mutate(data);
  };

  const onCreateComplianceReport = (data: z.infer<typeof complianceReportSchema>) => {
    createComplianceReportMutation.mutate(data);
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            You need administrator or compliance officer permissions to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
      </div>

      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">Retention Policies</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="access">Access Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Retention Policies</h3>
            {canCreatePolicies && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Policy</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create Retention Policy</DialogTitle>
                  </DialogHeader>
                  <Form {...retentionForm}>
                    <form onSubmit={retentionForm.handleSubmit(onCreateRetentionPolicy)} className="space-y-4">
                      <FormField
                        control={retentionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Policy Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Policy name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={retentionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Policy description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={retentionForm.control}
                        name="messageClassification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Classification</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select classification" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">All Classifications</SelectItem>
                                <SelectItem value={MessageClassification.POLICY_NOTIFICATION}>Policy Notification</SelectItem>
                                <SelectItem value={MessageClassification.AUDIT_NOTICE}>Audit Notice</SelectItem>
                                <SelectItem value={MessageClassification.CORRECTIVE_ACTION}>Corrective Action</SelectItem>
                                <SelectItem value={MessageClassification.SECURITY_ALERT}>Security Alert</SelectItem>
                                <SelectItem value={MessageClassification.COMPLIANCE_REQUIREMENT}>Compliance Requirement</SelectItem>
                                <SelectItem value={MessageClassification.GENERAL}>General</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={retentionForm.control}
                        name="retentionPeriodDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retention Period (Days)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="365" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createRetentionPolicyMutation.isPending}>
                        {createRetentionPolicyMutation.isPending ? "Creating..." : "Create Policy"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {retentionPolicies?.map((policy: any) => (
              <Card key={policy.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{policy.name}</span>
                    <Badge variant={policy.isActive ? "default" : "secondary"}>
                      {policy.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{policy.retentionPeriodDays} days</span>
                    </div>
                    {policy.messageClassification && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{policy.messageClassification}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <h3 className="text-lg font-semibold">Audit Trail</h3>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {auditTrail?.map((entry: any) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <History className="h-4 w-4" />
                        <span className="font-medium">{entry.eventType}</span>
                        <Badge variant="outline">{entry.resourceType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        by {entry.user.username} • {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </p>
                      {entry.newValues && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <pre>{JSON.stringify(entry.newValues, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">Access Logs</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Resource ID"
                value={selectedResource?.id || ""}
                onChange={(e) => setSelectedResource(prev => ({
                  ...prev,
                  id: parseInt(e.target.value) || 0,
                  type: prev?.type || "message"
                }))}
              />
              <Select 
                value={selectedResource?.type || "message"} 
                onValueChange={(value) => setSelectedResource(prev => ({
                  ...prev,
                  id: prev?.id || 0,
                  type: value
                }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="conversation">Conversation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {accessLogs?.map((log: any) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{log.user.username}</span>
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {log.resourceType} #{log.resourceId}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compliance Reports</h3>
            {canCreatePolicies && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Generate Report</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Generate Compliance Report</DialogTitle>
                  </DialogHeader>
                  <Form {...reportForm}>
                    <form onSubmit={reportForm.handleSubmit(onCreateComplianceReport)} className="space-y-4">
                      <FormField
                        control={reportForm.control}
                        name="reportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Report Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select report type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="retention_due">Retention Due</SelectItem>
                                <SelectItem value="access_summary">Access Summary</SelectItem>
                                <SelectItem value="audit_trail">Audit Trail</SelectItem>
                                <SelectItem value="message_classification">Message Classification</SelectItem>
                                <SelectItem value="acknowledgment_status">Acknowledgment Status</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={createComplianceReportMutation.isPending}>
                        {createComplianceReportMutation.isPending ? "Generating..." : "Generate Report"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {complianceReports?.map((report: any) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{report.reportType}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Generated by {report.generator.username} • {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
                  </p>
                  <div className="text-xs bg-muted p-2 rounded">
                    <pre>{JSON.stringify(report.reportData, null, 2)}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}