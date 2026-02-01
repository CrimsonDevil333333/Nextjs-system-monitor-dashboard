import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns/promises';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized();

  const { tool, target } = await request.json();

  if (!target || !/^[a-zA-Z0-9.-]+$/.test(target)) {
      return NextResponse.json({ error: 'Invalid target format' }, { status: 400 });
  }

  try {
    let result = '';
    
    if (tool === 'ping') {
        const { stdout } = await execAsync(`ping -c 4 ${target}`);
        result = stdout;
    } else if (tool === 'dns') {
        const addresses = await dns.resolve4(target);
        result = `DNS Lookup for ${target}:\n${addresses.join('\n')}`;
    } else {
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }

    return NextResponse.json({ output: result });
  } catch (e: any) {
    return NextResponse.json({ output: e.message || 'Execution failed' });
  }
}
