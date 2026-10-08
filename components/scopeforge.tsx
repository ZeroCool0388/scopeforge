'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Layers3,
  ArrowLeft,
  ArrowRight,
  Moon,
  Sun,
  History,
  Trash2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Intake } from './intake';
import { Progress } from './progress';
import { ScopeEditor } from './scope-editor';
import { Proposal } from './proposal';
import {
  BriefSchema,
  ScopeSchema,
  type BriefInput,
  type ForgeResult,
  type SampleBrief,
  type Scope,
  type Section,
} from '@/lib/schema';
import {
  readHistory,
  saveHistory,
  clearHistory,
  historyEntry,
  type HistoryEntry,
} from '@/lib/history';
import { replaceSection } from '@/lib/sections';
const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
type View = 'intake' | 'loading' | 'workspace' | 'history';
export function ScopeForge({
  samples,
  initialMode,
  gated,
}: {
  samples: SampleBrief[];
  initialMode: 'demo' | 'live';
  gated: boolean;
}) {
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const [view, setView] = useState<View>('intake');
  const [input, setInput] = useState<BriefInput>({
    brief: samples[3].brief,
    sector: 'FinTech',
    sampleId: samples[3].id,
    budget: 'Unspecified',
    timeline: 'Exploratory',
  });
  const [result, setResult] = useState<ForgeResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [busySection, setBusySection] = useState<Section | null>(null);
  const [alternates, setAlternates] = useState<
    Partial<Record<Section, boolean>>
  >({});
  const [mobileTab, setMobileTab] = useState('scope');
  useEffect(() => {
    if (result && entryId && ScopeSchema.safeParse(result.scope).success) {
      try {
        saveHistory(
          readHistory().map((e) => (e.id === entryId ? { ...e, result } : e)),
        );
      } catch {
        /* Export remains available if browser storage is restricted. */
      }
    }
  }, [result, entryId]);
  const valid = result ? ScopeSchema.safeParse(result.scope) : null;
  const badgeMode = view === 'workspace' && result ? result.mode : initialMode;
  function openHistory() {
    window.scrollTo({ top: 0 });
    setHistory(readHistory());
    setError('');
    setView('history');
  }
  function store(next: ForgeResult, currentId = entryId) {
    try {
      const items = readHistory();
      if (currentId) {
        saveHistory(
          items.map((e) => (e.id === currentId ? { ...e, result: next } : e)),
        );
      } else {
        const entry = historyEntry(input, next);
        saveHistory([entry, ...items]);
        setEntryId(entry.id);
      }
    } catch {
      setError(
        'This browser cannot save local history. Your current scope and exports still work.',
      );
    }
  }
  async function generate(forceDemo = false) {
    const parsed = BriefSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError('');
    setView('loading');
    window.scrollTo({ top: 0 });
    const started = Date.now();
    try {
      const response = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, forceDemo }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || 'Could not forge the scope.');
      const next = {
        ...data,
        scope: ScopeSchema.parse(data.scope),
      } as ForgeResult;
      await new Promise((r) =>
        setTimeout(r, Math.max(0, 2700 - (Date.now() - started))),
      );
      setInput((i) => ({ ...i, forceDemo }));
      setResult(next);
      setAlternates({});
      setMobileTab('scope');
      setView('workspace');
      window.scrollTo({ top: 0 });
      try {
        const entry = historyEntry({ ...input, forceDemo }, next);
        saveHistory([entry, ...readHistory()]);
        setEntryId(entry.id);
      } catch {
        setError(
          'History could not be saved in this browser. The scope is ready to export.',
        );
      }
    } catch (e) {
      setView('intake');
      setError(
        e instanceof Error ? e.message : 'Generation failed. Please try again.',
      );
    }
  }
  function edit(scope: Scope) {
    if (!result) return;
    const next = { ...result, scope };
    setResult(next);
    if (ScopeSchema.safeParse(scope).success) store(next);
  }
  async function regenerate(section: Section) {
    if (!result) return;
    setBusySection(section);
    setError('');
    try {
      const alternate = !alternates[section];
      const response = await fetch('/api/forge/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            ...input,
            forceDemo: input.forceDemo || result.mode === 'demo',
          },
          scope: result.scope,
          section,
          alternate,
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || 'Section refresh failed.');
      const scope = ScopeSchema.parse(data.scope);
      setResult((current) =>
        current
          ? {
              ...current,
              scope: replaceSection(current.scope, scope, section),
              notice: data.notice,
              mode: data.mode,
            }
          : current,
      );
      setAlternates((a) => ({ ...a, [section]: alternate }));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not refresh the section.',
      );
    } finally {
      setBusySection(null);
    }
  }
  function restore(entry: HistoryEntry) {
    window.scrollTo({ top: 0 });
    setInput(entry.input);
    setResult(entry.result);
    setEntryId(entry.id);
    setMobileTab('scope');
    setAlternates({});
    setError('');
    setView('workspace');
  }
  function newBrief() {
    window.scrollTo({ top: 0 });
    if (result && valid?.success) store(result);
    setError('');
    setView('intake');
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="ScopeForge home">
            <Layers3 />
            <span>ScopeForge</span>
          </Link>
          <nav aria-label="Main navigation">
            <Button
              variant="ghost"
              className={view !== 'history' ? 'nav-active' : ''}
              disabled={view === 'loading' || !!busySection}
              onClick={newBrief}
            >
              Brief intake
            </Button>
            <Button
              variant="ghost"
              className={view === 'history' ? 'nav-active' : ''}
              disabled={view === 'loading' || !!busySection}
              onClick={() => {
                if (result && valid?.success) store(result);
                openHistory();
              }}
            >
              History
            </Button>
          </nav>
          <div className="header-right">
            <Badge
              variant="secondary"
              className={
                badgeMode === 'demo' ? 'mode-badge' : 'mode-badge live'
              }
            >
              <span />
              {badgeMode === 'demo' ? 'Demo mode' : 'Live AI'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => {
                document.documentElement.classList.toggle('dark', !dark);
                setDark(!dark);
              }}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
            <span className="author-avatar" title="Steve Grady">
              SG
            </span>
          </div>
        </div>
      </header>
      <main
        id="main"
        className={`main-container ${view === 'workspace' ? 'workspace-container' : ''}`}
      >
        {error && (
          <Alert variant="destructive" className="error-alert">
            <AlertCircle />
            <AlertTitle>Let’s get this back on track</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              {view === 'intake' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate(true)}
                >
                  Use demo mode output instead
                  <ArrowRight />
                </Button>
              )}
              {view === 'workspace' &&
                initialMode === 'live' &&
                !input.forceDemo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput((i) => ({ ...i, forceDemo: true }))}
                  >
                    Use demo for the next section refresh
                  </Button>
                )}
            </AlertDescription>
          </Alert>
        )}
        {view === 'intake' && (
          <Intake
            samples={samples}
            input={input}
            setInput={setInput}
            onForge={() => generate()}
            gated={gated}
            ready={ready}
          />
        )}{' '}
        {view === 'loading' && <Progress />}
        {view === 'workspace' && result && (
          <>
            <h1 className="sr-only">Scope workspace</h1>
            <div className="workspace-top">
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Back to brief"
                  disabled={!!busySection}
                  onClick={newBrief}
                >
                  <ArrowLeft />
                </Button>
                <span>{result.scope.customer}</span>
                <span className="breadcrumb-slash">/</span>
                <strong>Scope workspace</strong>
              </div>
              <Button
                variant="outline"
                disabled={!!busySection}
                onClick={newBrief}
              >
                New brief
                <ArrowRight />
              </Button>
            </div>
            <div className="workspace-notice">
              <ShieldCheck />
              <p>{result.notice}</p>
              <span>All sections editable</span>
            </div>
            {!valid?.success && (
              <Alert variant="destructive">
                <AlertTitle>
                  Complete the required content before export
                </AlertTitle>
                <AlertDescription>
                  {valid && !valid.success
                    ? `${valid.error.issues[0].path.join(' → ')}: ${valid.error.issues[0].message}`
                    : ''}
                </AlertDescription>
              </Alert>
            )}
            <Tabs
              value={mobileTab}
              onValueChange={setMobileTab}
              className="mobile-workspace-tabs"
            >
              <TabsList>
                <TabsTrigger value="scope">Edit scope</TabsTrigger>
                <TabsTrigger value="preview">Proposal preview</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className={`workspace-grid mobile-${mobileTab}`}>
              <ScopeEditor
                scope={result.scope}
                onChange={edit}
                onRegenerate={regenerate}
                busy={busySection}
              />
              <Proposal
                scope={result.scope}
                valid={!!valid?.success}
                onError={setError}
              />
            </div>
          </>
        )}
        {view === 'history' && (
          <div className="history-page">
            <div className="history-heading">
              <div>
                <h1>Your recent scopes</h1>
                <p>The last five drafts, saved in this browser.</p>
              </div>
              <Button
                variant="outline"
                disabled={!history.length}
                onClick={() => {
                  clearHistory();
                  setHistory([]);
                  setEntryId(null);
                  setResult(null);
                }}
              >
                <Trash2 />
                Clear history
              </Button>
            </div>
            {history.length ? (
              <div className="history-list">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    className="history-item"
                    onClick={() => restore(entry)}
                  >
                    <span className="history-icon">
                      <History />
                    </span>
                    <div>
                      <Badge variant="secondary">
                        {entry.result.scope.sector}
                      </Badge>
                      <h2>{entry.result.scope.title}</h2>
                      <p>
                        {entry.result.scope.customer} ·{' '}
                        {new Date(entry.createdAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                    <ArrowRight />
                  </button>
                ))}
              </div>
            ) : (
              <div className="history-empty">
                <History />
                <h2>A clean slate.</h2>
                <p>Your first forged scope will appear here.</p>
                <Button onClick={() => setView('intake')}>
                  Start with a brief
                  <ArrowRight />
                </Button>
              </div>
            )}
            <p className="history-note">
              No account. No database. Clearing history removes the saved drafts
              from this browser.
            </p>
          </div>
        )}
      </main>
      <footer className="app-footer">
        <span>Built for the questions before the build.</span>
        <span>ScopeForge · Steve Grady</span>
      </footer>
    </div>
  );
}
