import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Mic, Send, Square, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, onTyping, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicator
    if (e.target.value.length > 0) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    } else {
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleFileUpload = () => {
    // Create file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "*/*";
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Implement file upload
        console.log("File selected:", file);
      }
    };
    fileInput.click();
  };

  const startRecording = async () => {
    console.log('Starting recording...');
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted, creating MediaRecorder...');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, creating blob...');
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        console.log('Audio blob created:', audioBlob.size, 'bytes');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      console.log('Recording started successfully');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Recording voice message... Tap again to stop.",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMessage = "Unable to access microphone. Please check permissions.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Microphone access denied. Please allow microphone access and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        }
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast({
        title: "Recording Stopped",
        description: `Voice message recorded (${recordingTime}s). Click play to review.`,
      });
    }
  };

  const handleVoiceRecord = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Microphone button clicked, isRecording:', isRecording);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      // In a real app, you would upload the audio blob to the server
      onSendMessage(`🎤 Voice message (${recordingTime}s)`);
      setAudioBlob(null);
      setRecordingTime(0);
      
      toast({
        title: "Voice Message Sent",
        description: "Your voice message has been sent successfully.",
      });
    }
  };

  const discardVoiceMessage = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    toast({
      title: "Recording Discarded",
      description: "Voice message has been deleted.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show voice message interface if we have a recorded audio
  if (audioBlob) {
    return (
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center justify-between bg-muted rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-blue rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Voice Message</span>
            <span className="text-xs text-muted-foreground">{formatTime(recordingTime)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={discardVoiceMessage}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
            <Button
              size="sm"
              onClick={sendVoiceMessage}
              className="bg-primary-blue hover:bg-primary-blue/90"
            >
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center bg-destructive/10 rounded-lg p-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-destructive">Recording...</span>
            <span className="text-sm text-destructive/80">{formatTime(recordingTime)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={stopRecording}
              className="text-destructive hover:text-destructive"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <div className="flex items-center space-x-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFileUpload}
              className="h-8 w-8"
              disabled={isRecording}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleVoiceRecord}
              className={cn(
                "h-8 w-8",
                isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Recording voice message..." : "Type your message..."}
            className="min-h-[2.5rem] max-h-32 resize-none"
            disabled={disabled || isRecording}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled || isRecording}
          className="bg-primary-blue hover:bg-primary-blue/90 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
