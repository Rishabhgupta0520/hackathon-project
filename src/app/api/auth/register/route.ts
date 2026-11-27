import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const user = createUser(name, email, password);
    const token = createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
      { error: err.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
