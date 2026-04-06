import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const execAsync = promisify(exec);
const rateLimiter = new RateLimiterMemory({ points: 12, duration: 60 });

const HOME_DIR = process.env.DEFAULT_HOME || process.env.HOME || os.homedir();

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  const clientId = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  try { await rateLimiter.consume(clientId); }
  catch { return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }); }

  const { command, cwd } = await request.json();
  if (!command || typeof command !== 'string') return NextResponse.json({ error: 'Invalid command' }, { status: 400 });

  const dangerousPatterns = [/\brm\s+-rf\s+\//i, /\bmkfs\b/i, /\bdd\s+if=/i, /:\(\)\{\s*:\|:\s*&\s*\};:/i, /\bwget\s+.*\|\s*bash/i, /\bcurl\s+.*\|\s*bash/i];
  for (const p of dangerousPatterns) { if (p.test(command)) return NextResponse.json({ error: 'Blocked' }, { status: 403 }); }

  const safePaths = [HOME_DIR, '/home', '/var/www', '/tmp', '/'];
  try {
    let dir = HOME_DIR;
    if (cwd && cwd !== '~') {
      const resolved = path.resolve(cwd);
      if (safePaths.some(p => resolved.startsWith(p))) {
        dir = resolved;
      }
    }
    const { stdout, stderr } = await execAsync(command, { timeout: 30000, maxBuffer: 1024 * 1024 * 5, cwd: dir });
    return NextResponse.json({ output: stdout, error: stderr });
  } catch (e: any) {
    return NextResponse.json({ output: e.stdout || '', error: e.message || e.stderr || 'Execution failed' }, { status: 500 });
  }
}
