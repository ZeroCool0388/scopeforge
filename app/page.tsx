import { ScopeForge } from '@/components/scopeforge';
import { getSamples } from '@/lib/samples';
import { getMode } from '@/lib/forge';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const { mode, gated } = getMode();
  return (
    <ScopeForge samples={await getSamples()} initialMode={mode} gated={gated} />
  );
}
