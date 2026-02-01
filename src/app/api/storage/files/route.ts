import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized();

  const { path: dirPath = '/' } = await request.json();

  try {
    // Basic path sanitization to prevent traversal above root (though root access is the point here)
    // const cleanPath = path.resolve(dirPath); 

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
        } catch (e) {
            return null; // Skip unreadable files
        }
    }));

    return NextResponse.json({ 
        path: dirPath,
        files: files.filter(Boolean).sort((a: any, b: any) => {
            // Sort directories first, then files
            if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
            return a.isDirectory ? -1 : 1;
        })
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
