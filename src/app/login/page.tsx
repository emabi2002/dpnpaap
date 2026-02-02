'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, User, Shield, ClipboardCheck, Building2, Settings2 } from 'lucide-react';

const demoAccounts = [
  {
    email: 'budget@npc.gov.pg',
    label: 'Agency User (NPC)',
    description: 'Data entry for National Procurement Commission',
    icon: <User className="h-4 w-4" />,
    color: 'bg-sky-50 border-sky-200 hover:bg-sky-100',
  },
  {
    email: 'cfo@npc.gov.pg',
    label: 'Agency Approver (NPC)',
    description: 'Approves submissions for NPC',
    icon: <Building2 className="h-4 w-4" />,
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  },
  {
    email: 'analyst@dnpm.gov.pg',
    label: 'DNPM Reviewer',
    description: 'Reviews all agency submissions',
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  },
  {
    email: 'director@dnpm.gov.pg',
    label: 'DNPM Approver',
    description: 'Final approval authority',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  {
    email: 'admin@dnpm.gov.pg',
    label: 'System Admin',
    description: 'Full system access',
    icon: <Settings2 className="h-4 w-4" />,
    color: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
  },
];

// Default password for demo accounts
const DEMO_PASSWORD = 'DnpmDemo2026!';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingDemoUser, setIsCreatingDemoUser] = useState(false);

  // Try to create demo user if login fails (first-time setup)
  const createDemoUser = async (demoEmail: string) => {
    const supabase = getSupabaseClient();

    try {
      // Try to sign up the demo user
      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: DEMO_PASSWORD,
        options: {
          data: {
            name: demoAccounts.find(a => a.email === demoEmail)?.label || 'Demo User'
          }
        }
      });

      // If signup succeeds or user already exists, try to sign in
      if (!signUpError || signUpError.message.includes('already registered')) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setIsLoading(true);
    setError('');

    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      router.push('/dashboard');
    } else {
      // If demo account login fails, try to create the demo user
      if (demoAccounts.some(a => a.email === loginEmail)) {
        setIsCreatingDemoUser(true);
        const created = await createDemoUser(loginEmail);

        if (created) {
          // Try logging in again
          const retryResult = await login(loginEmail, loginPassword);
          if (retryResult.success) {
            router.push('/dashboard');
            setIsLoading(false);
            return;
          }
        }
        setIsCreatingDemoUser(false);
      }

      setError(result.error || 'Invalid email or password. Please try again.');
    }

    setIsLoading(false);
  };

  const handleDemoLogin = async (demoEmail: string) => {
    await handleLogin(demoEmail, DEMO_PASSWORD);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left lg:pt-12">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <svg viewBox="0 0 64 64" className="h-14 w-14" xmlns="http://www.w3.org/2000/svg">
                  {/* Stylized Bird of Paradise silhouette */}
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="2"/>
                  <path d="M32 12 L38 24 L32 20 L26 24 Z" fill="#fbbf24"/>
                  <path d="M24 28 Q32 32 40 28 Q36 40 32 48 Q28 40 24 28" fill="#10b981"/>
                  <circle cx="32" cy="22" r="4" fill="#ef4444"/>
                  <path d="M28 36 L24 52 M36 36 L40 52" stroke="#10b981" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  DNPM Budget System
                </h1>
                <p className="text-slate-400 text-sm">
                  Papua New Guinea Government
                </p>
              </div>
            </div>

            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Annual Budget & Cashflow<br />
              <span className="text-emerald-400">Submission System</span>
            </h2>

            <p className="text-slate-400 text-lg max-w-md mx-auto lg:mx-0">
              Digital platform for government departments and agencies to submit
              annual programme budgets and monthly cashflow projections.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm">Secure & Audited</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-sm">Real-time Validation</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <div className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-sm">Excel Export</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div>
            <Card className="border-0 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials or select a demo account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@agency.gov.pg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-50"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>

                {/* Demo Accounts */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">
                      Demo Accounts
                    </span>
                  </div>
                </div>

                {isCreatingDemoUser && (
                  <div className="text-center text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Setting up demo account...
                  </div>
                )}

                <div className="space-y-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleDemoLogin(account.email)}
                      disabled={isLoading}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${account.color} disabled:opacity-50`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
                        {account.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {account.label}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {account.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-center text-slate-500">
                  Department of National Planning & Monitoring<br />
                  Papua New Guinea
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
