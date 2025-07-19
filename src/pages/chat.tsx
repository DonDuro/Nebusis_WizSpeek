import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { EnhancedChatArea } from "@/components/enhanced-chat-area";
import { ComplianceDashboard } from "@/components/compliance-dashboard";
import { apiRequest } from "@/lib/queryClient";
import { authApi, removeAuthToken } from "@/lib/auth";
import { wsManager } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import type { User, Conversation } from "@/types";
import wizSpeakIcon from "@/assets/wizspeak-icon.svg";

interface ChatPageProps {
  onLogout: () => void;
}

export default function ChatPage({ onLogout }: ChatPageProps) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "compliance">("chat");
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/profile");
      return response.json();
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/conversations");
      return response.json();
    },
  });

  useEffect(() => {
    // Connect to WebSocket
    wsManager.connect();

    return () => {
      wsManager.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      removeAuthToken();
      wsManager.disconnect();
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      removeAuthToken();
      wsManager.disconnect();
      onLogout();
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src={wizSpeakIcon} alt="WizSpeek" className="w-16 h-16 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">WizSpeek®</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={user}
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={handleSelectConversation}
        onLogout={handleLogout}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      {activeView === "compliance" ? (
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6 overflow-y-auto">
            <ComplianceDashboard currentUser={user} />
          </div>
        </div>
      ) : activeConversation ? (
        <EnhancedChatArea
          conversation={activeConversation}
          currentUser={user}
          onLogout={handleLogout}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img src={wizSpeakIcon} alt="WizSpeek" className="w-20 h-20" />
            </div>
            <h2 className="text-4xl font-bold text-primary mb-6">WizSpeek®</h2>
            <p className="text-lg text-muted-foreground mb-8">Select a conversation to start chatting</p>
            <div className="flex items-center justify-center mb-8">
              <div className="flex-1 h-px bg-border max-w-24"></div>
              <p className="text-base text-muted-foreground mx-6">
                Talk Smart. Stay Secure.
              </p>
              <div className="flex-1 h-px bg-border max-w-24"></div>
            </div>
            <p className="text-sm text-primary">
              Powered by Nebusis®
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
