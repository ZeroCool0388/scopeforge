'use client';
import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
const stages = [
  'Reading brief',
  'Extracting goals',
  'Surfacing assumptions',
  'Building phases',
  'Estimating effort',
  'Drafting proposal',
];
export function Progress() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, 5)), 450);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="progress-view" aria-live="polite">
      <div className="progress-top">
        <span className="progress-icon">
          <Loader2 className="spin" />
        </span>
        <h1>A little structure goes a long way.</h1>
        <p>Turning your brief into a considered first draft.</p>
      </div>
      <ol className="progress-stages">
        {stages.map((s, i) => (
          <li
            key={s}
            className={i === stage ? 'current' : i < stage ? 'done' : ''}
          >
            {i < stage ? (
              <Check />
            ) : i === stage ? (
              <Loader2 className="spin" />
            ) : (
              <span className="stage-dot" />
            )}
            {s}
          </li>
        ))}
      </ol>
      <div className="loading-layout">
        <div>
          {[1, 2, 3].map((n) => (
            <div className="skeleton-section" key={n}>
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>
        <div className="skeleton-section">
          <Skeleton className="h-8 w-3/4" />
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton className="h-12 w-full" key={n} />
          ))}
        </div>
      </div>
    </div>
  );
}
