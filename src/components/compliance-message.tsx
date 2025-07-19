import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  CheckCircle, 
  Clock, 
  FileText,
  Eye,
  UserCheck,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAuthToken } from "@/lib/auth";
import { MessageClassification, UserRole } from "@shared/schema";

// Simple API request function for compliance message
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

interface ComplianceMessageProps {
  message: {
    id: number;
    content: string;
    classification?: string;
    priority?: string;
    requiresAcknowledgment?: boolean;
    contentHash?: string;
    sender: {
      id: number;
      username: string;
      role?: string;
      department?: string;
    };
    createdAt: string;
    metadata?: any;
  };
  currentUser: any;
  isOwn?: boolean;
}

export function ComplianceMessage({ message, currentUser, isOwn = false }: ComplianceMessageProps) {
  const [showAcknowledgments, setShowAcknowledgments] = useState(false);
  const queryClient = useQueryClient();

  // Fetch acknowledgments for this message
  const { data: acknowledgments } = useQuery({
    queryKey: ["/api/messages", message.id, "acknowledgments"],
    enabled: message.requiresAcknowledgment,
  });

  // Check if current user has already acknowledged
  const hasAcknowledged = acknowledgments?.some(
    (ack: any) => ack.userId === currentUser?.id
  );

  // Acknowledge message mutation
  const acknowledgeMutation = useMutation({
    mutationFn: () => apiRequest(`/api/messages/${message.id}/acknowledge`, {
      method: "POST",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages", message.id, "acknowledgments"] 
      });
    },
  });

  const getClassificationInfo = (classification: string) => {
    switch (classification) {
      case MessageClassification.POLICY_NOTIFICATION:
        return {
          icon: Shield,
          label: "Policy Notification",
          color: "text-blue-600 bg-blue-50 border-blue-200",
          description: "Official policy communication",
        };
      case MessageClassification.AUDIT_NOTICE:
        return {
          icon: AlertTriangle,
          label: "Audit Notice",
          color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          description: "Audit-related communication",
        };
      case MessageClassification.CORRECTIVE_ACTION:
        return {
          icon: AlertTriangle,
          label: "Corrective Action",
          color: "text-red-600 bg-red-50 border-red-200",
          description: "Corrective action required",
        };
      case MessageClassification.SECURITY_ALERT:
        return {
          icon: Shield,
          label: "Security Alert",
          color: "text-red-600 bg-red-50 border-red-200",
          description: "Security-related alert",
        };
      case MessageClassification.COMPLIANCE_REQUIREMENT:
        return {
          icon: Shield,
          label: "Compliance Requirement",
          color: "text-purple-600 bg-purple-50 border-purple-200",
          description: "Compliance-related requirement",
        };
      default:
        return {
          icon: Users,
          label: "General",
          color: "text-gray-600 bg-gray-50 border-gray-200",
          description: "General communication",
        };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case "urgent":
        return {
          color: "text-red-600 bg-red-50 border-red-200",
          icon: AlertTriangle,
        };
      case "high":
        return {
          color: "text-orange-600 bg-orange-50 border-orange-200",
          icon: AlertTriangle,
        };
      case "normal":
        return {
          color: "text-blue-600 bg-blue-50 border-blue-200",
          icon: Clock,
        };
      case "low":
        return {
          color: "text-gray-600 bg-gray-50 border-gray-200",
          icon: Clock,
        };
      default:
        return {
          color: "text-blue-600 bg-blue-50 border-blue-200",
          icon: Clock,
        };
    }
  };

  const classificationInfo = message.classification 
    ? getClassificationInfo(message.classification)
    : null;

  const priorityInfo = message.priority 
    ? getPriorityInfo(message.priority)
    : null;

  const handleAcknowledge = () => {
    if (!hasAcknowledged) {
      acknowledgeMutation.mutate();
    }
  };

  return (
    <Card className={`w-full ${isOwn ? 'ml-auto bg-blue-50' : 'mr-auto'} max-w-2xl`}>
      <CardContent className="p-4">
        {/* Header with sender info and timestamp */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {message.sender.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{message.sender.username}</span>
                {message.sender.role && message.sender.role !== UserRole.USER && (
                  <Badge variant="secondary" className="text-xs">
                    {message.sender.role.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                {message.sender.department && (
                  <span> • {message.sender.department}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Message integrity indicator */}
          {message.contentHash && (
            <div className="flex items-center gap-1 text-green-600">
              <Shield className="h-4 w-4" />
              <span className="text-xs">Verified</span>
            </div>
          )}
        </div>

        {/* Classification and Priority badges */}
        {(classificationInfo || priorityInfo || message.requiresAcknowledgment) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {classificationInfo && (
              <Badge 
                variant="outline" 
                className={`border ${classificationInfo.color}`}
              >
                <classificationInfo.icon className="h-3 w-3 mr-1" />
                {classificationInfo.label}
              </Badge>
            )}
            {priorityInfo && message.priority !== "normal" && (
              <Badge 
                variant="outline"
                className={`border ${priorityInfo.color}`}
              >
                <priorityInfo.icon className="h-3 w-3 mr-1" />
                {message.priority?.charAt(0).toUpperCase() + message.priority?.slice(1)} Priority
              </Badge>
            )}
            {message.requiresAcknowledgment && (
              <Badge 
                variant="outline"
                className={`border ${hasAcknowledged ? 'text-green-600 bg-green-50 border-green-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}
              >
                <UserCheck className="h-3 w-3 mr-1" />
                {hasAcknowledged ? "Acknowledged" : "Acknowledgment Required"}
              </Badge>
            )}
          </div>
        )}

        {/* Message content */}
        <div className="mb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Acknowledgment section */}
        {message.requiresAcknowledgment && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Acknowledgment Status</span>
                {acknowledgments && acknowledgments.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {acknowledgments.length} acknowledged
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {acknowledgments && acknowledgments.length > 0 && (
                  <Dialog open={showAcknowledgments} onOpenChange={setShowAcknowledgments}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View All
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Message Acknowledgments</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-96">
                        <div className="space-y-2">
                          {acknowledgments.map((ack: any) => (
                            <div key={ack.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                                  {ack.user.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm">{ack.user.username}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(ack.acknowledgedAt), { addSuffix: true })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                )}
                
                {!isOwn && !hasAcknowledged && (
                  <Button
                    onClick={handleAcknowledge}
                    disabled={acknowledgeMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {acknowledgeMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                        <span>Acknowledging...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Acknowledge</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Classification description */}
        {classificationInfo && (
          <div className={`mt-3 p-2 rounded border ${classificationInfo.color}`}>
            <p className="text-xs opacity-80">
              {classificationInfo.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}