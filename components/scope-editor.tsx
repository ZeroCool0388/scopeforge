'use client';
import type { ReactNode } from 'react';
import { RotateCcw, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { estimateEffort } from '@/lib/effort';
import {
  driverIds,
  questionGroups,
  type Scope,
  type Section,
} from '@/lib/schema';
// Incomplete text edits remain visible while the numerical range stays deterministic.
function editedEffort(input: Scope['effort']): Scope['effort'] {
  const computed = estimateEffort({
    ...input,
    drivers: input.drivers.map((d) => ({
      ...d,
      detail: d.detail.trim() || 'Pending detail',
    })),
  });
  return { ...computed, drivers: input.drivers };
}
export function EditText({
  value,
  onChange,
  label,
  large = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  large?: boolean;
}) {
  return (
    <Textarea
      aria-label={label}
      className={large ? 'edit-text edit-title' : 'edit-text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
    />
  );
}
function Block({
  id,
  n,
  title,
  children,
  onRegenerate,
  busy,
}: {
  id: Section;
  n: string;
  title: string;
  children: ReactNode;
  onRegenerate: (s: Section) => void;
  busy: Section | null;
}) {
  return (
    <section className="scope-section" id={id}>
      <div className="section-heading">
        <h2>
          <span>{n}</span>
          {title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Regenerate ${title}`}
          disabled={!!busy}
          onClick={() => onRegenerate(id)}
        >
          <RotateCcw className={busy === id ? 'spin' : ''} />
          {busy === id ? 'Refreshing…' : 'Regenerate'}
        </Button>
      </div>
      {children}
    </section>
  );
}
export function ScopeEditor({
  scope: s,
  onChange,
  onRegenerate,
  busy,
}: {
  scope: Scope;
  onChange: (s: Scope) => void;
  onRegenerate: (s: Section) => void;
  busy: Section | null;
}) {
  const set = <K extends keyof Scope>(key: K, value: Scope[K]) =>
    onChange({ ...s, [key]: value });
  const list = (key: 'goals' | 'inScope' | 'outOfScope') => (
    <div className="editable-list">
      {s[key].map((v, i) => (
        <div className="editable-row" key={i}>
          <span className="bullet" />
          <EditText
            value={v}
            label={`${key} ${i + 1}`}
            onChange={(v) =>
              set(
                key,
                s[key].map((old, j) => (j === i ? v : old)),
              )
            }
          />
        </div>
      ))}
    </div>
  );
  const block = { onRegenerate, busy };
  return (
    <div className="scope-editor">
      <Block {...block} id="overview" n="01" title="The engagement">
        <EditText
          large
          label="Engagement title"
          value={s.title}
          onChange={(v) => set('title', v)}
        />
        <EditText
          label="Engagement summary"
          value={s.summary}
          onChange={(v) => set('summary', v)}
        />
        <label className="inline-label">
          Prepared for{' '}
          <EditText
            label="Customer name"
            value={s.customer}
            onChange={(v) => set('customer', v)}
          />
        </label>
      </Block>
      <Block {...block} id="goals" n="02" title="Outcomes that matter">
        {list('goals')}
      </Block>
      <Block {...block} id="boundaries" n="03" title="Draw the boundaries">
        <div className="boundaries">
          <div>
            <h3>
              <span className="scope-dot" />
              In scope
            </h3>
            {list('inScope')}
          </div>
          <div>
            <h3>
              <span className="scope-dot out" />
              Out of scope <Badge variant="outline">Required</Badge>
            </h3>
            {list('outOfScope')}
          </div>
        </div>
      </Block>
      <Block {...block} id="assumptions" n="04" title="What we’re assuming">
        <p className="section-description">
          These are working assumptions, not confirmed customer facts.
        </p>
        {s.assumptions.map((a, i) => (
          <div className="assumption-row" key={i}>
            <EditText
              value={a.text}
              label={`Assumption ${i + 1}`}
              onChange={(text) =>
                set(
                  'assumptions',
                  s.assumptions.map((x, j) => (j === i ? { ...x, text } : x)),
                )
              }
            />
            <select
              aria-label={`Confidence ${i + 1}`}
              className={`confidence ${a.confidence.toLowerCase()}`}
              value={a.confidence}
              onChange={(e) =>
                set(
                  'assumptions',
                  s.assumptions.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          confidence: e.target.value as typeof a.confidence,
                        }
                      : x,
                  ),
                )
              }
            >
              {['High', 'Medium', 'Low'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        ))}
      </Block>
      <Block
        {...block}
        id="questions"
        n="05"
        title="Questions before commitments"
      >
        <div className="question-groups">
          {questionGroups.map((group) => (
            <div key={group}>
              <h3>{group}</h3>
              {s.questions.map((q, i) =>
                q.group === group ? (
                  <div className="question" key={i}>
                    <EditText
                      value={q.question}
                      label={`${group} question`}
                      onChange={(question) =>
                        set(
                          'questions',
                          s.questions.map((x, j) =>
                            j === i ? { ...x, question } : x,
                          ),
                        )
                      }
                    />
                    <div className="why">
                      <span>Why it matters</span>
                      <EditText
                        value={q.why}
                        label={`${group} why it matters`}
                        onChange={(why) =>
                          set(
                            'questions',
                            s.questions.map((x, j) =>
                              j === i ? { ...x, why } : x,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          ))}
        </div>
      </Block>
      <Block {...block} id="phases" n="06" title="A phased path forward">
        <div className="phase-list">
          {s.phases.map((p, i) => (
            <div className="phase" key={i}>
              <div className="phase-head">
                <span className="phase-number">{i + 1}</span>
                <EditText
                  value={p.name}
                  label={`Phase ${i + 1} name`}
                  onChange={(name) =>
                    set(
                      'phases',
                      s.phases.map((x, j) => (j === i ? { ...x, name } : x)),
                    )
                  }
                />
                <label className="duration">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    aria-label={`Phase ${i + 1} minimum weeks`}
                    value={p.duration.min}
                    onChange={(e) =>
                      set(
                        'phases',
                        s.phases.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                duration: {
                                  ...x.duration,
                                  min: Number(e.target.value),
                                },
                              }
                            : x,
                        ),
                      )
                    }
                  />
                  <span>–</span>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    aria-label={`Phase ${i + 1} maximum weeks`}
                    value={p.duration.max}
                    onChange={(e) =>
                      set(
                        'phases',
                        s.phases.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                duration: {
                                  ...x.duration,
                                  max: Number(e.target.value),
                                },
                              }
                            : x,
                        ),
                      )
                    }
                  />
                  <span>weeks</span>
                </label>
              </div>
              <EditText
                value={p.objective}
                label={`Phase ${i + 1} objective`}
                onChange={(objective) =>
                  set(
                    'phases',
                    s.phases.map((x, j) => (j === i ? { ...x, objective } : x)),
                  )
                }
              />
              <ul>
                {p.activities.map((a, k) => (
                  <li key={k}>
                    <EditText
                      value={a}
                      label={`Phase ${i + 1} activity ${k + 1}`}
                      onChange={(v) =>
                        set(
                          'phases',
                          s.phases.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  activities: x.activities.map((old, l) =>
                                    l === k ? v : old,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
              <div className="exit">
                <strong>Exit criteria</strong>
                <EditText
                  value={p.exitCriteria}
                  label={`Phase ${i + 1} exit criteria`}
                  onChange={(exitCriteria) =>
                    set(
                      'phases',
                      s.phases.map((x, j) =>
                        j === i ? { ...x, exitCriteria } : x,
                      ),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Block>
      <Block
        {...block}
        id="effort"
        n="07"
        title="Effort, with the uncertainty intact"
      >
        <div className="effort-band">
          <select
            aria-label="Engagement size"
            value={s.effort.size}
            onChange={(e) =>
              set(
                'effort',
                editedEffort({
                  ...s.effort,
                  size: e.target.value as Scope['effort']['size'],
                }),
              )
            }
          >
            {['Small', 'Medium', 'Large'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <strong>
            {s.effort.min}–{s.effort.max}
            <span>person-weeks</span>
          </strong>
          <p>
            A planning estimate.
            <br />
            Not a quote.
          </p>
        </div>
        <div className="driver-list">
          {s.effort.drivers.map((d, i) => (
            <div className="driver" key={d.id}>
              <Badge variant="outline">{d.id.replaceAll('-', ' ')}</Badge>
              <EditText
                value={d.detail}
                label={`Cost driver ${i + 1}`}
                onChange={(detail) =>
                  set(
                    'effort',
                    editedEffort({
                      ...s.effort,
                      drivers: s.effort.drivers.map((x, j) =>
                        j === i ? { ...x, detail } : x,
                      ),
                    }),
                  )
                }
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove ${d.id} driver`}
                onClick={() =>
                  set(
                    'effort',
                    editedEffort({
                      ...s.effort,
                      drivers: s.effort.drivers.filter((_, j) => j !== i),
                    }),
                  )
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <div className="add-drivers">
          {driverIds
            .filter((id) => !s.effort.drivers.some((d) => d.id === id))
            .map((id) => (
              <Button
                variant="outline"
                size="sm"
                key={id}
                onClick={() =>
                  set(
                    'effort',
                    editedEffort({
                      ...s.effort,
                      drivers: [
                        ...s.effort.drivers,
                        { id, detail: 'Confirm during discovery.' },
                      ],
                    }),
                  )
                }
              >
                <Plus />
                {id.replaceAll('-', ' ')}
              </Button>
            ))}
        </div>
        <details className="effort-explanation">
          <summary>How is effort estimated?</summary>
          <p>
            Base person-weeks: Small 3–5, Medium 6–10, Large 12–20. Each unique
            driver adds: integrations 2–4; data readiness 1–3; SSO 1–2;
            compliance 2–4; residency 1–2; human review 1–2. We add lower bounds
            and upper bounds separately. Person-weeks measure work, not elapsed
            calendar time.
          </p>
        </details>
      </Block>
      <Block {...block} id="risks" n="08" title="Risks worth naming">
        {s.risks.map((r, i) => (
          <div className="risk" key={i}>
            <EditText
              value={r.risk}
              label={`Risk ${i + 1}`}
              onChange={(risk) =>
                set(
                  'risks',
                  s.risks.map((x, j) => (j === i ? { ...x, risk } : x)),
                )
              }
            />
            <div className="why">
              <span>Mitigation</span>
              <EditText
                value={r.mitigation}
                label={`Mitigation ${i + 1}`}
                onChange={(mitigation) =>
                  set(
                    'risks',
                    s.risks.map((x, j) => (j === i ? { ...x, mitigation } : x)),
                  )
                }
              />
            </div>
          </div>
        ))}
      </Block>
      <Block {...block} id="metrics" n="09" title="Make success measurable">
        <p className="section-description">
          Proposed targets. Agree the baseline and thresholds in discovery.
        </p>
        {s.metrics.map((m, i) => (
          <div className="metric" key={i}>
            <EditText
              value={m.metric}
              label={`Success metric ${i + 1}`}
              onChange={(metric) =>
                set(
                  'metrics',
                  s.metrics.map((x, j) => (j === i ? { ...x, metric } : x)),
                )
              }
            />
            <EditText
              value={m.target}
              label={`Success target ${i + 1}`}
              onChange={(target) =>
                set(
                  'metrics',
                  s.metrics.map((x, j) => (j === i ? { ...x, target } : x)),
                )
              }
            />
          </div>
        ))}
      </Block>
    </div>
  );
}
