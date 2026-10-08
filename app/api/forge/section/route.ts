import { NextResponse } from 'next/server';
import { SectionRequestSchema } from '@/lib/schema';
import { forgeSection } from '@/lib/forge';
import { readBody, guardLive, errorResponse } from '@/lib/api';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const body = SectionRequestSchema.parse(await readBody(request));
    guardLive(request, body.input);
    return NextResponse.json(
      await forgeSection(body.input, body.scope, body.section, body.alternate),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
