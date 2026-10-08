# ScopeForge implementation plan

1. Establish a coordinated intake/workspace design and tokens.
2. Scaffold Next.js, TypeScript, Tailwind, shadcn primitives and quality tooling.
3. Author four synthetic briefs, validated scope fixtures, alternates and an effort model.
4. Implement full/section APIs, deterministic demo and heuristic drafts, and server-only AI providers.
5. Build intake, progress, editable workspace, live proposal, Markdown/PDF exports and local history.
6. Verify schema, effort, routes, browser flow and responsive states; record evidence.
7. Finish README, licence, screenshots and deployment instructions.

## Design system

Reference: design-concept.png, generated with the built-in image tool. Light zinc canvas (#f7f8fa), white panels, ink (#20212c), indigo (#5146df); Geist UI and Georgia proposal typography. A quiet header, a narrow sample rail and a generous brief panel; workspace uses editable section rows and a sticky document. Soft sector colors, 8–12px radii, fine borders, 16/24/32px spacing. Lucide outline icons. Mobile stacks the sample rail and intake, then uses Scope/Preview tabs. Motion only communicates progress, with reduced-motion support.

Required brief copy and functionality override any imprecise generated concept copy (sector names, no share/save controls, five phases, all question groups, all nine editable sections). No photographic assets are needed for this tool.

## Verification limits

Live requests require separately configured provider credentials. Vercel preview requires authenticated deployment access. Do not claim either has passed without executing it.
