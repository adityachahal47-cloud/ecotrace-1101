import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In — EcoTrace",
  description: "Sign in to EcoTrace to verify AI-generated content",
};

export default function LoginPage() {
  return <LoginForm />;
}
