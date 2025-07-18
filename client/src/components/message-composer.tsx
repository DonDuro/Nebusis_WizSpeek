import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Send, Settings, AlertTriangle, Shield, Users, Clock } from "lucide-react";
import { MessageClassification, UserRole } from "@shared/schema";

interface MessageComposerProps {
  onSendMessage: (message: {
    content: string;
    classification?: string;
    priority?: string;
    requiresAcknowledgment?: boolean;
    metadata?: any;
  }) => void;
  currentUser: any;
  isLoading?: boolean;
  placeholder?: string;
}

export function MessageComposer({
  onSendMessage,
  currentUser,
  isLoading = false,
  placeholder = "Type your message...",
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [classification, setClassification] = useState<string>("");
  const [priority, setPriority] = useState<string>("normal");
  const [requiresAcknowledgment, setRequiresAcknowledgment] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canUseAdvancedFeatures = currentUser?.role === UserRole.ADMIN || 
                                currentUser?.role === UserRole.COMPLIANCE_OFFICER;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    const messageData = {
      content: content.trim(),
      classification: classification || undefined,
      priority,
      requiresAcknowledgment,
      metadata: {
        composedBy: currentUser?.username,
        timestamp: new Date().toISOString(),
        userRole: currentUser?.role,
        department: currentUser?.department,
      },
    };

    onSendMessage(messageData);
    setContent("");
    setClassification("");
    setPriority("normal");
    setRequiresAcknowledgment(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "normal":
        return "text-blue-600 bg-blue-50";
      case "low":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getClassificationInfo = (classification: string) => {
    switch (classification) {
      case MessageClassification.POLICY_NOTIFICATION:
        return {
          icon: Shield,
          description: "Official policy communications requiring acknowledgment",
          color: "text-blue-600 bg-blue-50",
        };
      case MessageClassification.AUDIT_NOTICE:
        return {
          icon: AlertTriangle,
          description: "Audit-related communications for compliance tracking",
          color: "text-yellow-600 bg-yellow-50",
        };
      case MessageClassification.CORRECTIVE_ACTION:
        return {
          icon: AlertTriangle,
          description: "Corrective action notifications requiring response",
          color: "text-red-600 bg-red-50",
        };
      case MessageClassification.SECURITY_ALERT:
        return {
          icon: Shield,
          description: "Security-related alerts requiring immediate attention",
          color: "text-red-600 bg-red-50",
        };
      case MessageClassification.COMPLIANCE_REQUIREMENT:
        return {
          icon: Shield,
          description: "Compliance-related requirements and notifications",
          color: "text-purple-600 bg-purple-50",
        };
      default:
        return {
          icon: Users,
          description: "General communication",
          color: "text-gray-600 bg-gray-50",
        };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Compose Message</CardTitle>
          {canUseAdvancedFeatures && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>
        
        {(classification || priority !== "normal" || requiresAcknowledgment) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {classification && (
              <Badge 
                variant="outline" 
                className={getClassificationInfo(classification).color}
              >
                {classification.replace(/_/g, " ")}
              </Badge>
            )}
            {priority !== "normal" && (
              <Badge variant="outline" className={getPriorityColor(priority)}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
              </Badge>
            )}
            {requiresAcknowledgment && (
              <Badge variant="outline" className="text-green-600 bg-green-50">
                Requires Acknowledgment
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {canUseAdvancedFeatures && (
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classification">Message Classification</Label>
                  <Select value={classification} onValueChange={setClassification}>
                    <SelectTrigger id="classification">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General</SelectItem>
                      <SelectItem value={MessageClassification.POLICY_NOTIFICATION}>
                        Policy Notification
                      </SelectItem>
                      <SelectItem value={MessageClassification.AUDIT_NOTICE}>
                        Audit Notice
                      </SelectItem>
                      <SelectItem value={MessageClassification.CORRECTIVE_ACTION}>
                        Corrective Action
                      </SelectItem>
                      <SelectItem value={MessageClassification.SECURITY_ALERT}>
                        Security Alert
                      </SelectItem>
                      <SelectItem value={MessageClassification.COMPLIANCE_REQUIREMENT}>
                        Compliance Requirement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="acknowledgment"
                  checked={requiresAcknowledgment}
                  onCheckedChange={setRequiresAcknowledgment}
                />
                <Label htmlFor="acknowledgment">Requires Acknowledgment</Label>
              </div>

              {classification && (
                <div className={`p-3 rounded-lg border ${getClassificationInfo(classification).color}`}>
                  <div className="flex items-start gap-2">
                    <getClassificationInfo(classification).icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">
                        {classification.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        {getClassificationInfo(classification).description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {content.length > 0 && (
                <span>{content.length} characters</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {priority === "urgent" && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Urgent</span>
                </div>
              )}
              {requiresAcknowledgment && (
                <div className="flex items-center gap-1 text-green-600">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Ack. Required</span>
                </div>
              )}
              <Button
                type="submit"
                disabled={!content.trim() || isLoading}
                className="min-w-[80px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}