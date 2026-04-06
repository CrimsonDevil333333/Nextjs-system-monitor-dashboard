import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { getHistory } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1h';

  // Validate range
  if (!['1h', '6h', '24h', '7d'].includes(range)) {
    return NextResponse.json(
      { error: 'Invalid range. Use: 1h, 6h, 24h, 7d' },
      { status: 400 }
    );
  }

  try {
    const history = getHistory(range);
    return NextResponse.json({
      range,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
