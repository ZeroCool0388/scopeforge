import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getMode } from './forge';
const buckets = new Map<string, { count: number; start: number }>();
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}
export async function readBody(request: Request) {
  // Bound the actual stream, not just the optional content-length header.
  if (!request.body)
    throw new ApiError('A brief is required.', 400, 'INVALID_REQUEST');
  const reader = request.body.getReader();
  let size = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 100000) {
      await reader.cancel();
      throw new ApiError('Request is too large.', 413, 'TOO_LARGE');
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    bytes.set(p, offset);
    offset += p.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError('Send a valid JSON request.', 400, 'INVALID_REQUEST');
  }
}
export function guardLive(
  request: Request,
  input: { forceDemo?: boolean; accessToken?: string },
) {
  if (getMode().mode !== 'live' || input.forceDemo) return;
  if (
    process.env.FORGE_ACCESS_TOKEN &&
    input.accessToken !== process.env.FORGE_ACCESS_TOKEN
  )
    throw new ApiError(
      'Enter the configured live-access token, or use demo output.',
      401,
      'ACCESS_REQUIRED',
    );
  const key = request.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
  const now = Date.now();
  for (const [id, b] of buckets) if (now - b.start > 60000) buckets.delete(id);
  const b = buckets.get(key) || { count: 0, start: now };
  b.count++;
  buckets.set(key, b);
  if (b.count > 5)
    throw new ApiError(
      'Too many live requests. Wait a minute or use demo output.',
      429,
      'RATE_LIMITED',
    );
}
export function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REQUEST',
          message: error.issues[0]?.message || 'Invalid request.',
        },
      },
      { status: 400 },
    );
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  // Provider messages may contain confidential request details; never return them.
  return NextResponse.json(
    {
      error: {
        code: 'GENERATION_FAILED',
        message:
          'The live provider could not generate a valid scope. Try again or use demo output.',
      },
    },
    { status: 502 },
  );
}
