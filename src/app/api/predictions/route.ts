import { NextResponse } from 'next/server';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { generatePredictions } from '@/lib/predictions';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!await isAuthenticated()) return unauthorized(true);

  try {
    const predictions = generatePredictions();
    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error generating predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
