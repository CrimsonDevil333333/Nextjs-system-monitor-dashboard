import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
  path: string;
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized();

  const { path: dirPath = '/' } = await request.json();

  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
        return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    const files = await Promise.all(entries.map(async (entry) => {
        try {
            const entryPath = path.join(dirPath, entry.name);
            const entryStats = await fs.stat(entryPath);
            return {
                name: entry.name,
                isDirectory: entry.isDirectory(),
                size: entryStats.size,
                mtime: entryStats.mtime,
                path: entryPath
            };
        } catch {
            return null;
        }
    }));

    const filteredFiles = files.filter((f): f is FileEntry => f !== null);

    return NextResponse.json({ 
        path: dirPath,
        files: filteredFiles.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
            return a.isDirectory ? -1 : 1;
        })
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list files';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
