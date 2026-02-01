import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Sanitization: ensure ID is alphanumeric to prevent injection
    if (!/^[a-zA-Z0-9]+$/.test(resolvedParams.id)) {
        return NextResponse.json({ error: 'Invalid Container ID' }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(`docker logs --tail 200 ${resolvedParams.id}`);
    return NextResponse.json({ logs: stdout + (stderr ? '\n' + stderr : '') });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch logs: ' + error.message }, { status: 500 });
  }
}
