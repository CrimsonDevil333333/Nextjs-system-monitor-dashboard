import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'upgradable';

  try {
    let command = '';
    if (type === 'upgradable') {
      command = 'apt list --upgradable';
    } else if (type === 'installed') {
      command = 'dpkg-query -W -f=\'${Package}\t${Version}\t${Status}\n\'';
    } else if (type === 'updates') {
        // Just run update to refresh cache
        await execAsync('sudo apt-get update');
        return NextResponse.json({ success: true });
    }

    const { stdout } = await execAsync(command);
    
    let packages: any[] = [];
    if (type === 'upgradable') {
        packages = stdout.split('\n')
            .filter(line => line.includes('/') && !line.startsWith('Listing'))
            .map(line => {
                const parts = line.split(' ');
                const nameParts = parts[0].split('/');
                return {
                    name: nameParts[0],
                    version: parts[1],
                    arch: nameParts[1] || 'all'
                };
            });
    } else if (type === 'installed') {
        packages = stdout.split('\n')
            .filter(l => l.trim())
            .map(line => {
                const [name, version, status] = line.split('\t');
                return { name, version, status };
            });
    }

    return NextResponse.json({ packages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const { action, name } = await request.json();
    let command = '';

    if (action === 'install') {
      command = `sudo apt-get install -y ${name}`;
    } else if (action === 'remove') {
      command = `sudo apt-get remove -y ${name}`;
    } else if (action === 'upgrade-all') {
      command = 'sudo apt-get upgrade -y';
    }

    // This can take long, so we run it in background or with high timeout
    // For simplicity we just run it and return output
    const { stdout, stderr } = await execAsync(command, { timeout: 300000 });
    
    return NextResponse.json({ output: stdout || stderr });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
