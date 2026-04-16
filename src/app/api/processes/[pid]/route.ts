import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ pid: string }> }
) {
  if (!await isAuthenticated()) return unauthorized();

  const { pid } = await params;
  
  if (!/^\d+$/.test(pid)) {
      return NextResponse.json({ error: 'Invalid PID' }, { status: 400 });
  }

  try {
    process.kill(parseInt(pid), 'SIGKILL');
    return NextResponse.json({ success: true, message: `Process ${pid} killed` });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to kill process';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
