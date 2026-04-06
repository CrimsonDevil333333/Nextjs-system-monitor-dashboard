import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import { insertDockerEvent } from '@/lib/database';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const [dockerContainers, dockerStats] = await Promise.all([
      si.dockerContainers().catch(() => []),
      si.dockerContainerStats('*').catch(() => []),
    ]);

    const containersWithStats = (dockerContainers || []).map(container => {
      const rawStats = (dockerStats || []).find(s =>
        s && (s.id === container.id || container.id.startsWith(s.id) || s.id.startsWith(container.id))
      ) as any;

      const stats = rawStats ? {
        cpu: rawStats.cpuPercent || rawStats.cpu_percent || 0,
        mem: rawStats.memUsage || rawStats.mem_usage || 0,
        memLimit: rawStats.memLimit || rawStats.mem_limit || 0,
        netIO: {
          rx: rawStats.netIO?.rx || 0,
          tx: rawStats.netIO?.tx || rawStats.netIO?.wx || 0,
        },
        blockIO: {
          r: rawStats.blockIO?.r || 0,
          w: rawStats.blockIO?.w || 0,
        },
      } : {
        cpu: 0,
        mem: 0,
        memLimit: 0,
        netIO: { rx: 0, tx: 0 },
        blockIO: { r: 0, w: 0 },
      };

      return {
        ...container,
        stats,
      };
    });

    return NextResponse.json({ containers: containersWithStats });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch Docker containers: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const { action, containerId } = await request.json();

    if (!action || !containerId) {
      return NextResponse.json(
        { error: 'Action and containerId are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['start', 'stop', 'restart', 'pause', 'unpause'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Use: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Sanitize container ID
    if (!/^[a-zA-Z0-9_-]+$/.test(containerId)) {
      return NextResponse.json(
        { error: 'Invalid container ID format' },
        { status: 400 }
      );
    }

    const { stdout, stderr } = await execAsync(`docker ${action} ${containerId}`);

    // Log the event
    const containerInfo = await getContainerInfo(containerId);
    insertDockerEvent({
      container_id: containerId,
      container_name: containerInfo?.name || containerId,
      event_type: action,
      details: stderr || 'Success',
    });

    return NextResponse.json({
      success: true,
      action,
      containerId,
      output: stdout,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process Docker container action: ` + error.message },
      { status: 500 }
    );
  }
}

async function getContainerInfo(containerId: string) {
  try {
    const { stdout } = await execAsync(`docker inspect ${containerId}`);
    const info = JSON.parse(stdout);
    return info[0];
  } catch {
    return null;
  }
}
