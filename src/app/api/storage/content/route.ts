import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

export async function GET(request: Request) {
  if (!await isAuthenticated()) return unauthorized();

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return NextResponse.json({ error: 'Not a file' }, { status: 400 });

    const fileBuffer = await fs.readFile(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'Content-Length': stats.size.toString()
        }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized();

  const body = await request.json();
  const { path: filePath, content } = body;

  if (!filePath || content === undefined) {
      return NextResponse.json({ error: 'Missing path or content' }, { status: 400 });
  }

  try {
      await fs.writeFile(filePath, content, 'utf-8');
      return NextResponse.json({ success: true });
  } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
