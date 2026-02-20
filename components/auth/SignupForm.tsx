"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Loader2, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={ { opacity: 0, scale: 0.95 } }
        animate={ { opacity: 1, scale: 1 } }
        transition={ { duration: 0.3 } }
        className="w-full max-w-md"
      >
        <Card className="border-0 bg-white/10 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <motion.div
              initial={ { scale: 0 } }
              animate={ { scale: 1 } }
              transition={ { type: "spring", stiffness: 200 } }
              className="mx-auto w-16 h-16 rounded-full bg-[#51CF66]/20 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-[#51CF66]" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white">Check Your Inbox</h3>
            <p className="text-white/60 text-sm">
              We&apos;ve sent you a confirmation email. Click the link to verify your account and get started.
            </p>
            <Link href="/login">
              <Button
                variant="outline"
                className="mt-4 border-white/20 text-white hover:bg-white/10"
              >
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={ { opacity: 0, y: 20 } }
      animate={ { opacity: 1, y: 0 } }
      transition={ { duration: 0.5 } }
      className="w-full max-w-md"
    >
      <Card className="border-0 bg-white/10 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-white/60 mt-1">
              Join EcoTrace and start verifying content
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={ handleSubmit(onSubmit) } className="space-y-4">
            { error && (
              <motion.div
                initial={ { opacity: 0, height: 0 } }
                animate={ { opacity: 1, height: "auto" } }
                className="p-3 rounded-lg bg-[#FF6B6B]/20 border border-[#FF6B6B]/30 text-[#FF6B6B] text-sm"
              >
                { error }
              </motion.div>
            ) }

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#667EEA] focus:ring-[#667EEA]/20"
                  { ...register("email") }
                />
              </div>
              { errors.email && (
                <p className="text-[#FF6B6B] text-xs mt-1">{ errors.email.message }</p>
              ) }
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#667EEA] focus:ring-[#667EEA]/20"
                  { ...register("password") }
                />
              </div>
              { errors.password && (
                <p className="text-[#FF6B6B] text-xs mt-1">{ errors.password.message }</p>
              ) }
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white/80 text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#667EEA] focus:ring-[#667EEA]/20"
                  { ...register("confirmPassword") }
                />
              </div>
              { errors.confirmPassword && (
                <p className="text-[#FF6B6B] text-xs mt-1">{ errors.confirmPassword.message }</p>
              ) }
            </div>

            <Button
              type="submit"
              disabled={ isLoading }
              className="w-full bg-gradient-to-r from-[#667EEA] to-[#764BA2] hover:from-[#5a6fd6] hover:to-[#6a3f96] text-white font-medium py-2.5 shadow-lg shadow-[#667EEA]/25 transition-all duration-200"
            >
              { isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              ) }
              { isLoading ? "Creating account..." : "Create Account" }
            </Button>

            <p className="text-center text-white/50 text-sm">
              Already have an account?{ " " }
              <Link
                href="/login"
                className="text-[#667EEA] hover:text-[#5a6fd6] font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
