import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized();

  const { command } = await request.json();
  
  // Basic sanity check, though authenticated users are trusted
  if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 5000, maxBuffer: 1024 * 1024 });
    return NextResponse.json({ output: stdout, error: stderr });
  } catch (e: any) {
    return NextResponse.json({ output: e.stdout, error: e.message });
  }
}
