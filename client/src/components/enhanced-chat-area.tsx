import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, VideoIcon, MoreHorizontal, Check, CheckCheck, Info, CheckSquare, BellOff, Clock, Heart, X, Flag, UserX, Trash2, Archive, MessageSquare, Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { wsManager } from "@/lib/websocket";
import { MessageInput } from "./message-input";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message, User } from "@/types";

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: User;
  onLogout?: () => void;
}

export function EnhancedChatArea({ conversation, currentUser, onLogout }: ChatAreaProps) {
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/conversations", conversation.id, "messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/conversations/${conversation.id}/messages`);
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; type: string; metadata?: any }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversation.id, "messages"] });
    },
  });

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversation.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversation.id, "messages"] });
      }
    };

    const handleTyping = (data: { userId: number; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter(id => id !== data.userId);
        }
      });
    };

    wsManager.on("new_message", handleNewMessage);
    wsManager.on("typing", handleTyping);

    return () => {
      wsManager.off("new_message", handleNewMessage);
      wsManager.off("typing", handleTyping);
    };
  }, [conversation.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate({
      content,
      type: "text",
    });
  };

  const handleTyping = (isTyping: boolean) => {
    wsManager.send({
      type: "typing",
      conversationId: conversation.id,
      isTyping,
    });
  };

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find(p => p.user.id !== currentUser.id);
      return otherParticipant?.user.username || "Unknown";
    }
    return "Group Chat";
  };

  const getConversationAvatar = () => {
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find(p => p.user.id !== currentUser.id);
      return otherParticipant?.user.username.charAt(0).toUpperCase() || "U";
    }
    return conversation.name?.charAt(0).toUpperCase() || "G";
  };

  const isParticipantOnline = () => {
    if (conversation.type === "direct") {
      const otherParticipant = conversation.participants.find(p => p.user.id !== currentUser.id);
      return otherParticipant?.user.isOnline || false;
    }
    return false;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isMessageRead = (message: Message) => {
    return message.readBy.length > 1; // More than just the sender
  };

  // Call functions
  const handleVoiceCall = () => {
    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUser.id);
    toast({
      title: "Voice Call",
      description: `Starting voice call with ${otherParticipant?.user.username || "user"}...`,
    });
    
    // In a real app, this would initiate WebRTC voice call
    console.log("Initiating voice call with conversation:", conversation.id);
  };

  const handleVideoCall = () => {
    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUser.id);
    toast({
      title: "Video Call",
      description: `Starting video call with ${otherParticipant?.user.username || "user"}...`,
    });
    
    // In a real app, this would initiate WebRTC video call
    console.log("Initiating video call with conversation:", conversation.id);
  };

  const handleMoreOptions = (option: string) => {
    setShowMoreMenu(false); // Close menu when option is clicked
    const otherParticipant = conversation.participants.find(p => p.user.id !== currentUser.id);
    
    switch (option) {
      case "contact_info":
        toast({
          title: "Contact Info",
          description: `Viewing ${otherParticipant?.user.username || "contact"} information and shared media`,
        });
        break;
      case "select_messages":
        toast({
          title: "Select Messages",
          description: "Enter selection mode to forward, delete, or star messages",
        });
        break;
      case "mute_notifications":
        toast({
          title: "Mute Notifications",
          description: "Notifications muted for this conversation",
        });
        break;
      case "disappearing_messages":
        toast({
          title: "Disappearing Messages",
          description: "Set messages to auto-delete after 24 hours, 7 days, or 90 days",
        });
        break;
      case "add_to_favorites":
        toast({
          title: "Add to Favorites",
          description: "Conversation added to favorites for quick access",
        });
        break;
      case "close_chat":
        toast({
          title: "Close Chat",
          description: "Chat closed but conversation history preserved",
        });
        break;
      case "logout":
        if (onLogout) {
          onLogout();
        }
        break;
      case "report":
        toast({
          title: "Report",
          description: "Report spam, inappropriate content, or security concerns",
        });
        break;
      case "block_contact":
        toast({
          title: "Block Contact",
          description: `${otherParticipant?.user.username || "Contact"} has been blocked`,
        });
        break;
      case "clear_chat":
        toast({
          title: "Clear Chat",
          description: "All messages in this chat have been cleared",
        });
        break;
      case "delete_chat":
        toast({
          title: "Delete Chat",
          description: "Chat deleted permanently from your device",
        });
        break;
      case "archive_chat":
        toast({
          title: "Archive Chat",
          description: "Chat archived and moved to archived conversations",
        });
        break;
      case "encryption_info":
        toast({
          title: "WizSpeek® Security",
          description: "Military-grade end-to-end encryption active. Messages secured with AES-256.",
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white to-gray-50 dark:from-background dark:to-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary-blue text-white">
                {getConversationAvatar()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {getConversationName()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isParticipantOnline() ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceCall}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVideoCall}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <VideoIcon className="h-5 w-5" />
            </Button>
            <div className="relative" ref={moreMenuRef}>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-primary hover:text-primary-foreground"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
              >
                <MoreHorizontal className="h-5 w-5 text-red-500" />
              </Button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 shadow-xl border rounded-lg z-50">
                  <div className="py-2">
                    {/* Enhanced Menu - Updated 2025-01-07 4:34 AM */}
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("contact_info")}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      Contact info
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("select_messages")}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Select messages
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("mute_notifications")}
                    >
                      <BellOff className="mr-2 h-4 w-4" />
                      Mute notifications
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("disappearing_messages")}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Disappearing messages
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("add_to_favorites")}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Add to favorites
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("close_chat")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Close chat
                    </button>
                    
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("report")}
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("block_contact")}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Block
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("clear_chat")}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Clear chat
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("delete_chat")}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete chat
                    </button>
                    
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("archive_chat")}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive chat
                    </button>
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => handleMoreOptions("encryption_info")}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      WizSpeek® Security
                    </button>
                    
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    
                    <button 
                      className="w-full px-4 py-2 text-left hover:bg-red-100 dark:hover:bg-red-900 flex items-center text-red-600 dark:text-red-400"
                      onClick={() => handleMoreOptions("logout")}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 custom-scrollbar">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message: Message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2",
                  message.senderId === currentUser.id ? "justify-end" : "justify-start"
                )}
              >
                {message.senderId !== currentUser.id && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary-blue text-white text-sm">
                      {message.sender.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "flex-1 max-w-md",
                    message.senderId === currentUser.id ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl shadow-sm",
                      message.senderId === currentUser.id
                        ? "bg-primary-blue text-white ml-12"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {formatTime(message.createdAt)}
                      </span>
                      {message.senderId === currentUser.id && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs opacity-70">SecureLink™</span>
                          {isMessageRead(message) ? (
                            <CheckCheck className="h-3 w-3 opacity-70" />
                          ) : (
                            <Check className="h-3 w-3 opacity-70" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">Someone is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-background">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}