import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, verifyPassword } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

const LoginSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
  isDemo: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid login parameters' },
        { status: 400 }
      );
    }

    const { email, password, isDemo } = result.data;

    let targetUser: any = null;

    // 1-Click Instant Demo Login
    if (isDemo || email === 'analyst@ghostwire.io') {
      targetUser = getUserByEmail('analyst@ghostwire.io');
      if (!targetUser) {
        return NextResponse.json({ error: 'Demo user unavailable' }, { status: 500 });
      }
    } else {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const user = getUserByEmail(email);
      if (!user || !user.password_hash || !user.password_salt) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const isValid = verifyPassword(password, user.password_hash, user.password_salt);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      targetUser = user;
    }

    const token = createSessionToken(targetUser);

    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
      },
    });

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    response.cookies.set({ name: 'gw_session', value: token, ...cookieOpts });
    response.cookies.set({ name: 'ghostwire_session', value: token, ...cookieOpts });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
