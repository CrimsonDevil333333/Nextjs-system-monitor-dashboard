import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint just informs clients about WebSocket availability
// Actual WebSocket connections use /api/ws path handled by the server
export async function GET() {
  return NextResponse.json({
    websocket: {
      enabled: true,
      path: '/api/ws',
      protocol: 'ws',
    },
  });
}
