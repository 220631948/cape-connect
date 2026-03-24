import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeRole } from '@/lib/auth/roles';
import DashboardScreen from '@/components/DashboardScreen';
import GuestDashboard from '@/components/dashboard/GuestDashboard';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If no session, go to login
  if (!session) {
    redirect('/login');
  }

  // Fetch role directly in RSC
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = normalizeRole(profile?.role);

  // Bug 1.5 Fix: Restrict Guests to GuestDashboard
  if (role === 'GUEST') {
    return <GuestDashboard />;
  }

  return <DashboardScreen />;
}
