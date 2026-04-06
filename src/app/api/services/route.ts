import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    // List all services
    const { stdout } = await execAsync('systemctl list-units --type=service --all --no-pager --no-legend');
    
    const services = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.trim().split(/\s+/);
        // systemctl output format: UNIT LOAD ACTIVE SUB DESCRIPTION
        return {
          id: parts[0],
          name: parts[0].replace('.service', ''),
          load: parts[1],
          active: parts[2],
          sub: parts[3],
          description: parts.slice(4).join(' ')
        };
      });

    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const { action, serviceId } = await request.json();
    
    if (!['start', 'stop', 'restart', 'enable', 'disable'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Using sudo for service management. This requires NOPASSWD in sudoers for the user running the app.
    const { stdout, stderr } = await execAsync(`sudo systemctl ${action} ${serviceId}`);
    
    return NextResponse.json({ output: stdout || stderr || 'Success' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
