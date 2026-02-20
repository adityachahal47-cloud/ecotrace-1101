"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
            <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
            <CardDescription className="text-white/60 mt-1">
              Sign in to continue verifying content
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

            <Button
              type="submit"
              disabled={ isLoading }
              className="w-full bg-gradient-to-r from-[#667EEA] to-[#764BA2] hover:from-[#5a6fd6] hover:to-[#6a3f96] text-white font-medium py-2.5 shadow-lg shadow-[#667EEA]/25 transition-all duration-200"
            >
              { isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              ) }
              { isLoading ? "Signing in..." : "Sign In" }
            </Button>

            <p className="text-center text-white/50 text-sm">
              Don&apos;t have an account?{ " " }
              <Link
                href="/signup"
                className="text-[#667EEA] hover:text-[#5a6fd6] font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
