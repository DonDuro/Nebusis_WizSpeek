import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SettingsModal } from "@/components/settings-modal";
import { Settings, Search, Moon, Sun, Phone, VideoIcon, MoreHorizontal, Users, QrCode, Plus, Shield, MessageCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { InstallButton } from "@/components/install-button";
import { cn } from "@/lib/utils";
import wizSpeakIcon from "@/assets/wizspeak-icon.svg";
import type { Conversation, User } from "@/types";

interface SidebarProps {
  user: User;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onLogout: () => void;
  activeView?: "chat" | "compliance";
  onViewChange?: (view: "chat" | "compliance") => void;
}

export function Sidebar({ 
  user, 
  conversations, 
  activeConversation, 
  onSelectConversation,
  onLogout,
  activeView = "chat",
  onViewChange = () => {}
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const filteredConversations = conversations.filter(conversation => {
    const searchTerm = searchQuery.toLowerCase();
    if (conversation.name) {
      return conversation.name.toLowerCase().includes(searchTerm);
    }
    // For direct messages, search by participant username
    const otherParticipant = conversation.participants.find(p => p.user.id !== user.id);
    return otherParticipant?.user.username.toLowerCase().includes(searchTerm) || false;
  });

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find(p => p.user.id !== user.id);
      return otherParticipant?.user.username || "Unknown";
    }
    return "Group Chat";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find(p => p.user.id !== user.id);
      return otherParticipant?.user.username.charAt(0).toUpperCase() || "U";
    }
    return conversation.name?.charAt(0).toUpperCase() || "G";
  };

  const isParticipantOnline = (conversation: Conversation) => {
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find(p => p.user.id !== user.id);
      return otherParticipant?.user.isOnline || false;
    }
    return false;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const handleCreateGroup = () => {
    setShowGroupModal(true);
  };

  const handleDeviceLinking = () => {
    setShowQRModal(true);
  };

  return (
    <div className="w-80 bg-card dark:bg-dark-navy border-r border-border flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-4 border-b border-border bg-primary-blue dark:bg-dark-navy">
        <div className="flex items-start space-x-1.5">
          <img src={wizSpeakIcon} alt="WizSpeek®" className="w-7 h-7 mt-0" />
          <div>
            <h1 className="text-lg font-bold text-white">WizSpeek®</h1>
            <p className="text-xs text-white/80">Talk Smart. Stay Secure.</p>
          </div>
        </div>
      </div>
      
      {/* User Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary-blue text-white">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">{user.username}</h3>
              <p className="text-xs text-success-green">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <InstallButton />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettingsModal(true)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* View Navigation */}
        <div className="flex gap-1 mt-3 mb-3 p-1 bg-muted rounded-lg">
          <Button
            onClick={() => onViewChange("chat")}
            variant={activeView === "chat" ? "default" : "ghost"}
            size="sm"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </Button>
          <Button
            onClick={() => onViewChange("compliance")}
            variant={activeView === "compliance" ? "default" : "ghost"}
            size="sm"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Compliance
          </Button>
        </div>

        {/* Action Buttons */}
        {activeView === "chat" && (
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleCreateGroup}
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4" />
              New Group
            </Button>
            <Button
              onClick={handleDeviceLinking}
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Link Device
            </Button>
          </div>
        )}
      </div>

      {/* Conversations */}
      {activeView === "chat" && (
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-0">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations found
              </div>
            ) : (
              filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={cn(
                  "p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors duration-200",
                  activeConversation?.id === conversation.id && "bg-muted"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary-blue text-white">
                        {getConversationAvatar(conversation)}
                      </AvatarFallback>
                    </Avatar>
                    {isParticipantOnline(conversation) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-green rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground truncate">
                        {getConversationName(conversation)}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.sender.id === user.id ? "You: " : ""}
                          {conversation.lastMessage.type === "text" 
                            ? conversation.lastMessage.content 
                            : conversation.lastMessage.type === "file" 
                              ? "📄 File" 
                              : conversation.lastMessage.type === "voice" 
                                ? "🎤 Voice message" 
                                : "Media"}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                  </div>
                  {conversation.lastMessage && !conversation.lastMessage.readBy.includes(user.id) && (
                    <div className="flex flex-col items-end">
                      <div className="w-2 h-2 bg-primary-blue rounded-full mb-1"></div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      )}

      {/* Group Creation Modal */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group conversation with multiple participants.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Group Description (Optional)</Label>
              <Input
                placeholder="Describe your group..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowGroupModal(false)}
              >
                Cancel
              </Button>
              <Button>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Device Linking Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Device Relay Setup</DialogTitle>
            <DialogDescription>
              Scan this Relay Code to sync WizSpeek® across your devices securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Relay Code</p>
                  <p className="text-xs text-gray-400 mt-1">SecureSync™</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-medium mb-2">How to sync your device:</h4>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>1. Install WizSpeek® on your mobile device</li>
                <li>2. Open Settings → Device Relay</li>
                <li>3. Tap "Add Device" and scan this Relay Code</li>
              </ol>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowQRModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
      />
    </div>
  );
}
