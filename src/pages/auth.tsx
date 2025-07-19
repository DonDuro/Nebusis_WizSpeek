import { AuthModal } from "@/components/auth-modal";

interface AuthPageProps {
  onSuccess: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  return <AuthModal onSuccess={onSuccess} />;
}
