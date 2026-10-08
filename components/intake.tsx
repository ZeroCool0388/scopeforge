'use client';
import {
  ArrowRight,
  Truck,
  FlaskConical,
  Pill,
  WalletCards,
  Check,
  Sparkles,
  ShieldCheck,
  PencilLine,
} from 'lucide-react';
import type { BriefInput, SampleBrief } from '@/lib/schema';
import { sectors } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
const icons = [Truck, FlaskConical, Pill, WalletCards];
export function Intake({
  samples,
  input,
  setInput,
  onForge,
  gated,
  ready,
}: {
  samples: SampleBrief[];
  input: BriefInput;
  setInput: (i: BriefInput) => void;
  onForge: () => void;
  gated: boolean;
  ready: boolean;
}) {
  return (
    <div className="intake-layout">
      <aside className="sample-rail">
        <h2>Sample briefs</h2>
        <p>Four sectors. Plenty of ambiguity.</p>
        <div className="sample-list">
          {samples.map((sample, i) => {
            const Icon = icons[i];
            const active = sample.id === input.sampleId;
            return (
              <article
                className={`sample-card ${active ? 'selected' : ''}`}
                key={sample.id}
              >
                <div className={`sector-icon sector-${i}`}>
                  <Icon />
                </div>
                <div className="sample-body">
                  <div className="sample-title">
                    <h3>{sample.customer.replace(' Ltd', '')}</h3>
                    <Badge
                      variant="secondary"
                      className={`sector-chip sector-${i}`}
                    >
                      {sample.sector}
                    </Badge>
                    {active && <Check aria-label="Selected" />}
                  </div>
                  <p>{sample.teaser}</p>
                  <Button
                    variant="link"
                    size="sm"
                    disabled={!ready}
                    onClick={() =>
                      setInput({
                        ...input,
                        brief: sample.brief,
                        sector: sample.sector,
                        sampleId: sample.id,
                      })
                    }
                  >
                    Use this brief
                    <ArrowRight />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="synthetic-note">
          <ShieldCheck />
          Every brief is fictional.
          <br />
          The scoping judgement is real.
        </p>
      </aside>
      <div className="intake-main">
        <div className="intro">
          <h1>
            <span>A vague brief.</span>
            <span>A clear way forward.</span>
          </h1>
          <p>Turn the what-ifs into a scope you can stand behind.</p>
        </div>
        <form
          className="intake-panel"
          onSubmit={(e) => {
            e.preventDefault();
            onForge();
          }}
        >
          <FieldGroup>
            <Field>
              <div className="brief-label">
                <FieldLabel htmlFor="brief">
                  Paste the customer brief
                </FieldLabel>
                <span>Start messy. We’ll bring the structure.</span>
              </div>
              <Textarea
                id="brief"
                className="brief-textarea"
                placeholder="We’re looking for AI to help with…"
                maxLength={12000}
                value={input.brief}
                onChange={(e) =>
                  setInput({
                    ...input,
                    brief: e.target.value,
                    sampleId: undefined,
                  })
                }
              />
              <div className="character-row">
                <span>
                  {input.brief.trim().length < 20
                    ? 'Add at least 20 characters to get started.'
                    : 'A first draft, not a commitment.'}
                </span>
                <span>
                  {input.brief.length.toLocaleString('en-GB')} / 12,000
                </span>
              </div>
            </Field>
            <FieldGroup className="deal-context">
              <Field>
                <FieldLabel htmlFor="sector">
                  Sector <span>optional</span>
                </FieldLabel>
                <select
                  id="sector"
                  value={input.sector || ''}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      sector: e.target.value
                        ? (e.target.value as BriefInput['sector'])
                        : undefined,
                    })
                  }
                >
                  <option value="">Let the brief guide us</option>
                  {sectors.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="budget">
                  Budget band <span>optional</span>
                </FieldLabel>
                <select
                  id="budget"
                  value={input.budget}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      budget: e.target.value as BriefInput['budget'],
                    })
                  }
                >
                  {[
                    'Unspecified',
                    'Lean pilot',
                    'Department initiative',
                    'Strategic programme',
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="timeline">
                  Timeline pressure <span>optional</span>
                </FieldLabel>
                <select
                  id="timeline"
                  value={input.timeline}
                  onChange={(e) =>
                    setInput({
                      ...input,
                      timeline: e.target.value as BriefInput['timeline'],
                    })
                  }
                >
                  {['Exploratory', 'This quarter', 'ASAP'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </FieldGroup>
            {gated && (
              <Field>
                <FieldLabel htmlFor="access">Live-access token</FieldLabel>
                <Input
                  id="access"
                  type="password"
                  autoComplete="off"
                  value={input.accessToken || ''}
                  onChange={(e) =>
                    setInput({ ...input, accessToken: e.target.value })
                  }
                />
              </Field>
            )}
            <Button
              className="forge-button"
              type="submit"
              size="lg"
              disabled={!ready || input.brief.trim().length < 20}
            >
              <Sparkles />
              Forge scope
              <ArrowRight />
            </Button>
          </FieldGroup>
          <div className="tip-row">
            <span>
              <Sparkles />
              Ambiguous briefs work best
            </span>
            <span>
              <ShieldCheck />
              We’ll surface assumptions & open questions
            </span>
            <span>
              <PencilLine />
              Editable before you export
            </span>
          </div>
        </form>
        <div className="intake-bottom">
          <span className="mini-rule" />
          <p>
            Good scoping starts with better questions.
            <br />
            <strong>Let’s find yours.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
