import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthenticated()) return unauthorized(true);

  const { id } = await params;

  try {
    // Get last 100 lines of logs for the service
    const { stdout, stderr } = await execAsync(`journalctl -u ${id} -n 100 --no-pager`);
    
    return NextResponse.json({ logs: stdout || stderr || 'No logs found.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
