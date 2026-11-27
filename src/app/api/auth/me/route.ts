import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserStats } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null, stats: null });
  }

  const stats = getUserStats(user.id);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
    },
    stats,
  });
}
