import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { getAlerts, acknowledgeAlert } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const alerts = getAlerts(20);
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const { action, alertId } = await request.json();

    if (action === 'acknowledge' && alertId) {
      acknowledgeAlert(alertId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}
