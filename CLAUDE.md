# CLAUDE.md

Frontend design system & conventions for the church admin app.
Claude: follow these on every UI task unless I say otherwise.

## Product context
- Admin dashboard for church staff and ministry leaders (not the public site).
- Users are volunteers/staff, often non-technical. Prioritize clarity over density.
- Likely modules: members/congregation, events & services, groups/ministries,
  announcements, giving/donations records, volunteer scheduling, media/sermons.

## Stack
- Next.js (App Router), TypeScript strict mode.
- Styling: Tailwind CSS + shadcn/ui. No inline styles, no CSS-in-JS.
- Icons: lucide-react only.
- Server components by default; client components only when interactivity requires it.

## Visual direction
- Tone: warm, calm, trustworthy. Approachable but not childish.
- Dark mode + light mode, both first-class. All colors via CSS variables.
- Palette: neutral base (stone/slate) + ONE warm accent. No multi-color gradients.
- Typography: one clean sans (e.g. Inter) for UI. Generous size for readability;
  older/less-technical users should not squint. Hierarchy via size/weight/color.
- Spacing: 4px scale, comfortable padding. Roomy, not cramped.
- Corners: soft radius (8px). Borders for separation; shadows only for real elevation.

## Component conventions
- Compose from shadcn/ui primitives; don't hand-roll inputs/buttons/dialogs.
- Every interactive element: hover, focus-visible, active, disabled states.
- Buttons: clear primary action per screen. Destructive actions (delete member,
  cancel event) always confirm in a dialog.
- Loading: skeletons for content, spinner only for actions. Never a blank screen.
- Empty states: friendly one-line explanation + primary action
  (e.g. "No members yet — add your first one").
- Errors: inline, plain-language, actionable. No raw stack traces in the UI.
- Tables/lists: sticky header, search + filter for long lists, pagination.
  Right-align numeric/amount columns. Truncate long text with tooltip.
- Forms: label above input, helper/error text below, validate on blur.
  Keep multi-step flows (e.g. create event) short and clearly stepped.
- Dates/times: show timezone-aware, human-readable format.

## Accessibility (non-negotiable)
- Semantic HTML. Fully keyboard-navigable. Visible focus ring.
- Text contrast >= WCAG AA. aria-labels on icon-only buttons.
- Respect prefers-reduced-motion. Don't rely on color alone to convey meaning.

## Sensitive data
- Member data (names, contact, giving records) is private. Never expose it in
  public-facing components, logs, or client bundles unnecessarily.
- Don't invent member, giving, or event data — use clearly marked placeholders/TODOs.

## Do NOT
- No purple→blue gradients, glassmorphism, or emoji in the UI.
- No arbitrary Tailwind values (e.g. w-[473px]) — use the scale.
- No new dependencies without asking.

## Workflow
- For any non-trivial UI, use Plan mode first and let me review the plan.
- Show me a diff per file; keep changes scoped to what I asked.