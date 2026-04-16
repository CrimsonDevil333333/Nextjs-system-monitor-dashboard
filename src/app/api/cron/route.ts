import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    // List crontab for current user
    const { stdout, stderr } = await execAsync('crontab -l').catch(e => ({ stdout: '', stderr: e.message }));
    
    if (stderr && !stderr.includes('no crontab for')) {
      return NextResponse.json({ error: stderr }, { status: 500 });
    }

    const lines = stdout.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const jobs = lines.map((line, index) => {
      const parts = line.split(/\s+/);
      return {
        id: index,
        schedule: parts.slice(0, 5).join(' '),
        command: parts.slice(5).join(' '),
        raw: line
      };
    });

    return NextResponse.json({ jobs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const { action, schedule, command, id } = await request.json();

    // Get current crontab
    const { stdout } = await execAsync('crontab -l').catch(() => ({ stdout: '' }));
    let lines = stdout.split('\n').filter(l => l.trim());

    if (action === 'add') {
      lines.push(`${schedule} ${command}`);
    } else if (action === 'delete') {
      const jobToDelete = lines.filter(l => !l.startsWith('#'))[id];
      lines = lines.filter(l => l !== jobToDelete);
    } else if (action === 'edit') {
        const jobsOnly = lines.filter(l => !l.startsWith('#'));
        const oldJob = jobsOnly[id];
        const newJob = `${schedule} ${command}`;
        lines = lines.map(l => l === oldJob ? newJob : l);
    }

    // Write back to crontab - use secure tmp file
    const tmpFile = path.join('/tmp', `cron_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(tmpFile, lines.join('\n') + '\n', { mode: 0o600 });
    
    await execAsync(`crontab ${tmpFile}`);
    fs.unlinkSync(tmpFile);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
