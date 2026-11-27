import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  const clearOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set({ name: 'gw_session', value: '', ...clearOpts });
  response.cookies.set({ name: 'ghostwire_session', value: '', ...clearOpts });
  return response;
}
