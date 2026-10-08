'use client';
import { useState } from 'react';
import { Copy, Download, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  buildMarkdown,
  filename,
  footer,
  proposalSections,
} from '@/lib/proposal';
import type { Scope } from '@/lib/schema';
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Proposal({
  scope,
  valid,
  onError,
}: {
  scope: Scope;
  valid: boolean;
  onError: (message: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const markdown = buildMarkdown(scope);
  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onError(
        'Clipboard access is unavailable. Download the Markdown file instead.',
      );
    }
  }
  async function exportPDF() {
    setBusy(true);
    try {
      const response = await fetch('/api/proposal/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scope),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error('PDF generation failed');
      download(await response.blob(), filename(scope, 'pdf'));
    } catch {
      onError('PDF export failed. Try again, or download Markdown.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="proposal-pane">
      <Tabs defaultValue="preview">
        <div className="proposal-toolbar">
          <h2>Proposal</h2>
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>
        </div>
        <div className="export-actions">
          <Button variant="ghost" size="sm" disabled={!valid} onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy Markdown'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!valid}
            onClick={() =>
              download(
                new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
                filename(scope, 'md'),
              )
            }
          >
            <Download />
            Markdown
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={!valid || busy}
            onClick={exportPDF}
          >
            <FileText />
            {busy ? 'Preparing…' : 'Download PDF'}
          </Button>
        </div>
        <TabsContent value="preview">
          <article
            className="proposal-paper"
            aria-label="Live proposal preview"
          >
            <div className="paper-top">
              <strong>ScopeForge</strong>
              <span>ENGAGEMENT PROPOSAL</span>
            </div>
            <h2 className="paper-title">{scope.title}</h2>
            <p className="paper-customer">Prepared for {scope.customer}</p>
            <p className="paper-summary">{scope.summary}</p>
            {proposalSections(scope).map((section) => (
              <section key={section.heading}>
                <h3>{section.heading}</h3>
                <ul>
                  {section.lines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
            <footer>
              <strong>Steve Grady</strong>
              <span>{footer}</span>
            </footer>
          </article>
        </TabsContent>
        <TabsContent value="markdown">
          <pre className="markdown-source">{markdown}</pre>
        </TabsContent>
      </Tabs>
      <p className="proposal-note">
        A concise proposal, ready for a human review. Long edits may extend the
        PDF beyond one page.
      </p>
    </aside>
  );
}
