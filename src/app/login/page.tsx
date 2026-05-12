"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HammerLoader } from "@/components/ui/HammerLoader";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error("Invalid credentials");
      } else {
        toast.success("Logged in successfully");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full relative overflow-hidden font-sans">

      {/* Left Side - Visuals (Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        {/* Abstract Construction Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-10 w-96 h-96 bg-orange-500 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 -right-10 w-96 h-96 bg-blue-600 rounded-full blur-[100px] animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
        </div>

        <div className="relative z-10 text-center text-white space-y-6 max-w-lg px-8">
          <div className="mb-8 inline-block p-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
            <HammerLoader className="w-24 h-24 text-orange-500 [&>svg]:text-orange-400 [&>div]:bg-white" />
          </div>
          <h2 className="text-5xl font-black tracking-tighter uppercase leading-tight">
            Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">Smarter</span>.<br />
            Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600">Better</span>.
          </h2>
          <p className="text-slate-400 text-lg">
            The centralized command center for your construction projects.
            Track progress, budgets, and crews in real-time.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background relative p-6">

        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="text-center lg:text-left">
            <div className="lg:hidden inline-flex mb-6">
              <HammerLoader className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 rounded-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <HammerLoader className="w-5 h-5 [&>svg]:text-white [&>div]:bg-white/50" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
