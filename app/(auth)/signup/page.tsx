import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign Up — EcoTrace",
  description: "Create an EcoTrace account to start verifying AI-generated content",
};

export default function SignupPage() {
  return <SignupForm />;
}
