import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  const { searchParams } = new URL(request.url);
  const lines = parseInt(searchParams.get('lines') || '100', 10);
  const type = searchParams.get('type') || 'syslog';

  try {
    let command = '';
    if (type === 'syslog') {
      command = `journalctl -n ${lines} --no-pager`;
    } else if (type === 'dmesg') {
      command = `dmesg | tail -n ${lines}`;
    } else {
      return NextResponse.json({ error: 'Invalid log type' }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(command);
    
    return NextResponse.json({ logs: stdout || stderr });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
