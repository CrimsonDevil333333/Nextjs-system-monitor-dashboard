import { NextResponse } from 'next/server';
import si from 'systeminformation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const processes = await si.processes();
    return NextResponse.json(processes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch processes: ' + error }, { status: 500 });
  }
}
