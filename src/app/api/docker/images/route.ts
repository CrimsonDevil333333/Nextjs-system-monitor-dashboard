import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const { stdout } = await execAsync('docker images --format "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}"');
    
    const images = stdout.trim().split('\n').filter(line => line).map(line => {
      const [id, repository, tag, size, createdAt] = line.split('|');
      return {
        id,
        repository,
        tag,
        size,
        createdAt,
        fullName: `${repository}:${tag}`,
      };
    });

    return NextResponse.json({ images });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch Docker images: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const { action, image, force } = await request.json();

    if (!action || !image) {
      return NextResponse.json(
        { error: 'Action and image are required' },
        { status: 400 }
      );
    }

    // Sanitize image name
    if (!/^[a-zA-Z0-9_./:-]+$/.test(image)) {
      return NextResponse.json(
        { error: 'Invalid image name format' },
        { status: 400 }
      );
    }

    let command = '';
    
    switch (action) {
      case 'pull':
        command = `docker pull ${image}`;
        break;
      case 'remove':
        command = `docker rmi ${force ? '-f ' : ''}${image}`;
        break;
      case 'prune':
        command = 'docker image prune -f';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pull, remove, prune' },
          { status: 400 }
        );
    }

    const { stdout, stderr } = await execAsync(command, { timeout: 120000 });

    return NextResponse.json({
      success: true,
      action,
      output: stdout,
      error: stderr,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process Docker image: ` + error.message },
      { status: 500 }
    );
  }
}
