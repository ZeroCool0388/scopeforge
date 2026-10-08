import { renderToBuffer } from '@react-pdf/renderer';
import { ProposalPDF } from '@/components/proposal-pdf';
import { ScopeSchema } from '@/lib/schema';
import { filename } from '@/lib/proposal';
import { readBody, errorResponse } from '@/lib/api';
export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const scope = ScopeSchema.parse(await readBody(request));
    const buffer = await renderToBuffer(ProposalPDF({ scope }));
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename(scope, 'pdf')}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
