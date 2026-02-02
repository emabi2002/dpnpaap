'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { Loader2 } from 'lucide-react';

// TEST MODE - matches auth-provider.tsx
const TEST_MODE = true;

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useSupabaseAuth();

  useEffect(() => {
    // In test mode, always redirect to dashboard
    if (TEST_MODE) {
      router.push('/dashboard');
      return;
    }

    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto mb-4" />
        <p className="text-slate-400">Loading DNPM Budget System...</p>
      </div>
    </div>
  );
}
