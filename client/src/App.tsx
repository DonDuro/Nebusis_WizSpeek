import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { InstallBanner } from "@/components/install-button";
import { isAuthenticated, setAuthToken } from "@/lib/auth";
import AuthPage from "@/pages/auth";
import ChatPage from "@/pages/chat";

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const autoLogin = async () => {
      // Check if already authenticated
      if (isAuthenticated()) {
        setIsAuth(true);
        setIsLoading(false);
        return;
      }

      // Auto-login as testuser
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setAuthToken(data.token);
          setIsAuth(true);
        } else {
          // If auto-login fails, show auth page
          setIsAuth(false);
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    autoLogin();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuth(true);
  };

  const handleLogout = () => {
    setIsAuth(false);
  };

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading WizSpeek...</p>
            </div>
          </div>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          {isAuth ? (
            <ChatPage onLogout={handleLogout} />
          ) : (
            <AuthPage onSuccess={handleAuthSuccess} />
          )}
        </div>
        <InstallBanner />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
