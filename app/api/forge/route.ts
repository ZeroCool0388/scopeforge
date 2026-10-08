import { NextResponse } from 'next/server';
import { BriefSchema } from '@/lib/schema';
import { forge } from '@/lib/forge';
import { readBody, guardLive, errorResponse } from '@/lib/api';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const input = BriefSchema.parse(await readBody(request));
    guardLive(request, input);
    return NextResponse.json(await forge(input));
  } catch (error) {
    return errorResponse(error);
  }
}
