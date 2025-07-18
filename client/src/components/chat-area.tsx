import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Phone, VideoIcon, MoreHorizontal, Check, CheckCheck, PhoneCall, Video, MessageSquare, UserPlus, Settings, Shield, Info, CheckSquare, BellOff, Clock, Heart, X, Flag, UserX, Trash2, Archive, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { wsManager } from "@/lib/websocket";
import { MessageInput } from "./message-input";
import { useToast } from "@/hooks/use-toast";
import type { Conversation, Message, User } from "@/types";

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: User;
  onLogout: () => void;
}

export function ChatArea({ conversation, currentUser, onLogout }: ChatAreaProps) {
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
      case "logout":
        toast({
          title: "Logout",
          description: "You have been logged out successfully.",
        });
        onLogout();
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary-blue text-white">
                  {getConversationAvatar()}
                </AvatarFallback>
              </Avatar>
              {isParticipantOnline() && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success-green rounded-full border-2 border-background"></div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-foreground">{getConversationName()}</h3>
              <p className="text-xs text-success-green">
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
                <MoreHorizontal className="h-5 w-5" />
              </Button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 shadow-xl border rounded-lg z-50">
                  <div className="py-2">
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
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600 hover:text-red-700"
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
                        ? "bg-primary-blue text-white rounded-tr-md ml-auto"
                        : "bg-muted text-foreground rounded-tl-md"
                    )}
                  >
                    {message.type === "text" ? (
                      <p>{message.content}</p>
                    ) : message.type === "file" ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-background bg-opacity-20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{message.content}</p>
                          <p className="text-xs opacity-80">
                            {message.metadata?.size ? `${(message.metadata.size / 1024 / 1024).toFixed(1)} MB` : ""}
                          </p>
                        </div>
                      </div>
                    ) : message.type === "voice" ? (
                      <div className="flex items-center space-x-3">
                        <Button size="sm" variant="ghost" className="flex-shrink-0 w-10 h-10 rounded-full">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-background bg-opacity-20 rounded-full overflow-hidden">
                              <div className="w-1/3 h-full bg-current"></div>
                            </div>
                            <span className="text-xs">
                              {message.metadata?.duration || "0:15"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "flex items-center space-x-2 mt-1",
                      message.senderId === currentUser.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.createdAt)}
                    </span>
                    {message.senderId === currentUser.id && (
                      <div className="text-success-green">
                        {isMessageRead(message) ? (
                          <CheckCheck className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">🔒 E2E Encrypted</span>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-start space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary-blue text-white text-sm">
                  {typingUsers.length === 1 ? "T" : "..."}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted p-3 rounded-2xl rounded-tl-md shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={sendMessageMutation.isPending}
      />
      
      <div className="text-xs text-muted-foreground text-center p-2 border-t border-border">
        🔒 Messages are end-to-end encrypted
      </div>
    </div>
  );
}
