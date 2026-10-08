# ScopeForge verification

Verified locally on 8 October 2026. The project uses **127.0.0.1:3033** for development, production and browser tests to avoid the other concurrent projects. No unrelated listeners or projects were changed.

## Checks completed

| Check                         | Result                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| Clean dependency installation | `npm ci` succeeded                                                                                       |
| Production build              | `npm run build` succeeded; all routes compiled                                                           |
| Production server             | Home page returned HTTP 200 on port 3033                                                                 |
| Lint and strict types         | Both passed                                                                                              |
| Unit tests                    | 24 passed across 3 files                                                                                 |
| Production browser tests      | 4 passed in Chromium                                                                                     |
| Dependency audit              | 0 known vulnerabilities, including development dependencies                                              |
| Seed data                     | All 4 briefs and 8 full/alternate fixtures validated                                                     |
| PDF exports                   | All 4 seeded scopes rendered to one A4 page                                                              |
| PDF content                   | Author Steve Grady, synthetic footer, phase activities and exit criteria verified                        |
| Responsive checks             | 1440, 1024, 768 and 390px; no horizontal overflow                                                        |
| Automated accessibility       | No axe violations on intake and workspace, including dark workspace                                      |
| Public-data review            | Supplied private build brief and local concept excluded; environment files ignored except `.env.example` |

The browser flow covers selecting a sample, staged generation, editing a commercial question, live proposal updates, refreshing a section while preserving other edits, temporary invalid edits, effort recalculation, Markdown/PDF downloads and history persistence. Other checks cover all samples, pasted text, empty input, clearly labelled heuristic output, mobile proposal tabs and clearing history without old entries returning.

Unit checks cover validation boundaries, unique effort drivers, section preservation, safe API failures, both mocked provider adapters, explicit demo fallback, gated live access and the five-entry history limit. Secrets are omitted from stored history. The production output traces include all 8 scope fixtures for both forge routes.

Automated accessibility checks are useful evidence; they do not constitute a complete manual WCAG audit. Keyboard-labelled controls, visible focus, reduced-motion support and responsive document access were also reviewed.

## Visual evidence and fidelity ledger

The local design reference is `docs/design-concept.png` (kept locally, excluded from public Git). Latest implementation captures are [intake.jpg](intake.jpg), [workspace.jpg](workspace.jpg) and [mobile.jpg](mobile.jpg). They were captured with the Codex in-app browser screenshot API. The concept and latest desktop captures were opened with `view_image` in the same final review, at the reference's **1536 × 1024** dimensions. Mobile was checked at **390 × 844** and captured as a full page. The temporary viewport override was reset afterwards.

The written product brief controls content and functionality where the generated reference invents or compresses them. This is a design-system implementation of that brief, rather than a pixel-for-pixel reproduction of the two-screen concept board.

| Comparison               | Concept evidence                                                           | Render evidence                                                                         | Resolution                                                                                                |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Copy and navigation      | ScopeForge, Brief intake, History, Forge scope; invented sample prose      | Same product/navigation/CTA; required fictional briefs and sector labels                | Preserved allowed core copy; replaced invented facts and labels with brief requirements                   |
| Intake layout            | Four-card left rail and generous main form                                 | Four-card rail, preloaded textarea, context row and full-width CTA                      | Matched the structure; compacted cards to keep all four and CTA visible at a short desktop height         |
| Typography               | Crisp sans UI and editorial serif proposal                                 | Geist for controls and headings; Georgia for document                                   | Checked field labels, small toolbar text, hierarchy and mobile line breaks; fixed joined headline spacing |
| Palette and surfaces     | Light zinc canvas, white panels, indigo action, soft sector chips          | Same token family, fine borders and restrained shadows                                  | Darkened muted text and tab labels after contrast checks                                                  |
| Icons and selected state | Layered brand mark, truck/flask/capsule/finance metaphors, outlined arrows | Consistent Lucide outline icons, sector tints and selected FinTech check                | Matched metaphors, alignment and stroke treatment; no photographic assets needed                          |
| Workspace and document   | Two panels, serif proposal, per-section refresh; compressed fields         | Editable left sections, sticky scrollable proposal, Preview/Markdown and export actions | Full-height screen accommodates all nine sections and five phases; removed invented Share/Save controls   |
| Responsive behaviour     | Desktop concept only                                                       | Stacked intake and mobile Scope/Proposal tabs                                           | Implemented the brief's small-screen workflow; no overflow at four required widths                        |
| Progress and motion      | Concept does not specify transitional states                               | Six visible progress stages and skeleton layout                                         | Implemented the brief's 2–3 second demo progress; respects reduced motion                                 |

Above-the-fold copy review: product name, navigation, primary CTA and headline retain the reference wording. Sample names, sector chips, teasers, tips and synthetic notice follow the supplied brief. The fiction note, author footer and short intake helper text provide the required demo context. The headline sits above the intake panel and uses a larger full-screen scale; the reference compresses intake and workspace into one board. Workspace uses a readable vertical section flow instead of fitting all nine sections into the lower half of that board. These are intentional adaptations to the full product surface.

The final review found no remaining material visual defect against the written brief and extracted design system. Fixes included headline spacing, small-screen navigation, muted-text contrast, semantic heading order and PDF text spacing. The implemented workflow was verified through visible in-app-browser controls and the required automated browser tests.

## Remaining external verification

- **OpenAI and Anthropic live requests:** implemented and tested with mocked adapters, but authenticated requests have not run because neither provider key is available. Verify both providers with a sample and pasted brief, including section refresh.
- **Vercel deployment:** the Next.js app, server routes and traced data are ready for import with default settings. An authenticated preview deployment has not been created or verified here.
- **Public GitHub publication:** local Git history is authored as Steve Grady. The project has no remote; repository publication has not been performed.
- **Demo recording:** README retains the requested `docs/demo.gif` placeholder and includes a 60–90 second script.

These pending checks are not counted as passed acceptance criteria. Local demo mode is complete and works without environment files.
