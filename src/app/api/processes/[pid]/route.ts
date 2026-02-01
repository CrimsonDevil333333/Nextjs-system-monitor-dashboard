import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';

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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
