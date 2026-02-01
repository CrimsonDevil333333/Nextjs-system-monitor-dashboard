import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [interfaces, connections] = await Promise.all([
      si.networkInterfaces(),
      si.networkConnections()
    ]);

    return NextResponse.json({
      interfaces,
      connections: connections.filter(c => c.state === 'ESTABLISHED' || c.state === 'LISTEN')
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch network info' }, { status: 500 });
  }
}
