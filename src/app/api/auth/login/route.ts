import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Client } from 'ssh2';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password, remember } = body;

  if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  // Admin file-based auth (Backup)
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
      await setAuthCookie(username, remember);
      return NextResponse.json({ success: true, method: 'env' });
  }

  // SSH Auth
  try {
    await new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.end();
            resolve(true);
        }).on('error', (err) => {
            reject(err);
        }).connect({
            host: '127.0.0.1',
            port: 22,
            username: username,
            password: password,
            readyTimeout: 5000,
            tryKeyboard: true 
        });
    });

    await setAuthCookie(username, remember);
    return NextResponse.json({ success: true, method: 'ssh' });

  } catch (error) {
    console.error('Auth failed:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

async function setAuthCookie(username: string, remember: boolean) {
    const token = await signToken({ username });
    const cookieStore = await cookies();
    
    // 7 days if remember me, else 2 hours
    const maxAge = remember ? 60 * 60 * 24 * 7 : 7200;

    cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: false, // Localhost friendly
        sameSite: 'lax',
        maxAge: maxAge
    });
}
