import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [diskLayout, blockDevices, fsSize] = await Promise.all([
      si.diskLayout(),
      si.blockDevices(),
      si.fsSize()
    ]);

    return NextResponse.json({
      layout: diskLayout,
      blocks: blockDevices,
      fs: fsSize
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch storage info' }, { status: 500 });
  }
}
