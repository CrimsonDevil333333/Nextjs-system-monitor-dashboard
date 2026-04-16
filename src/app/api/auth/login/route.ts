import { NextResponse } from 'next/server';
import { signToken, getCookieOptions } from '@/lib/auth';
import { spawn } from 'child_process';
import fs from 'fs';

const DEV_AUTH = process.env.DEV_AUTH;

function getVerifyScriptPath(): string {
  return process.env.VERIFY_SCRIPT || './verify_su.sh';
}

const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 'unknown';
}

function verifyPassword(username: string, password: string): Promise<boolean> {
  // Development fallback auth
  if (DEV_AUTH) {
    const parts = DEV_AUTH.split(':');
    if (parts.length >= 2) {
      const expectedUser = parts[0];
      const expectedPass = parts.slice(1).join(':');
      return Promise.resolve(username === expectedUser && password === expectedPass);
    }
  }

  // Use su-based verification script
  const scriptPath = getVerifyScriptPath();
  if (!fs.existsSync(scriptPath)) {
    console.error('Verification script not found:', scriptPath);
    return Promise.resolve(false);
  }
  
  return new Promise((resolve) => {
    const user = username.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!user || user !== username) { resolve(false); return; }
    
    const child = spawn('sudo', [scriptPath, user], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { console.error('verify stderr:', d.toString()); });
    
    child.on('close', (code) => {
      console.log('verify exit code:', code, 'output:', stdout);
      resolve(stdout.trim() === 'OK');
    });
    
    child.on('error', (e) => {
      console.error('verify error:', e.message);
      resolve(false);
    });
    
    child.stdin!.write(password + '\n');
    child.stdin!.end();
    
    setTimeout(() => {
      child.kill();
      resolve(false);
    }, 5000);
  });
}

export async function POST(request: Request) {
  const clientIP = getClientIP(request);

  // Rate limiting
  const attempt = failedAttempts.get(clientIP);
  if (attempt) {
    const elapsed = Date.now() - attempt.lastAttempt;
    if (elapsed < LOCKOUT_MS && attempt.count >= MAX_ATTEMPTS) {
      const minsLeft = Math.ceil((LOCKOUT_MS - elapsed) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minsLeft} minutes.`, locked: true },
        { status: 429 }
      );
    }
    if (elapsed >= LOCKOUT_MS) failedAttempts.delete(clientIP);
  }

  const body = await request.json();
  const { username, password, remember } = body;

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }

  // System auth via shadow hash check
  try {
    const valid = await verifyPassword(username, password);
    if (valid) {
      const token = await signToken({ username });
      const response = NextResponse.json({ success: true, method: 'system' });
      response.cookies.set('auth_token', token, getCookieOptions(!!remember));
      failedAttempts.delete(clientIP);
      return response;
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('Auth error:', message);
  }

  // Failed
  const current = failedAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
  failedAttempts.set(clientIP, { count: current.count + 1, lastAttempt: Date.now() });
  const remaining = Math.max(0, MAX_ATTEMPTS - current.count - 1);

  return NextResponse.json(
    { error: 'Invalid username or password.', remainingAttempts: remaining },
    { status: 401 }
  );
}
