"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LayoutDashboard, PlusCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavbarProps {
  email?: string | null;
}

export function Navbar({ email }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analyze", label: "Analyze", icon: PlusCircle },
  ];

  return (
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */ }
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
              EcoTrace
            </span>
          </Link>

          {/* Nav Links */ }
          <div className="flex items-center gap-1">
            { navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={ item.href }
                  href={ item.href }
                  className={ `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                    }` }
                >
                  <item.icon className="w-4 h-4" />
                  { item.label }
                </Link>
              );
            }) }
          </div>

          {/* User */ }
          <div className="flex items-center gap-4">
            { email && (
              <span className="text-white/40 text-sm hidden sm:block">
                { email }
              </span>
            ) }
            <button
              onClick={ handleLogout }
              className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
