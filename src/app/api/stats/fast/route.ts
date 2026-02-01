import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [currentLoad, mem, networkStats, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      si.time()
    ]);

    return NextResponse.json({
      load: currentLoad,
      mem,
      network: networkStats,
      uptime: time.uptime
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fast stats' }, { status: 500 });
  }
}
