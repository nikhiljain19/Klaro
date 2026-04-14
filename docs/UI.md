# UI.md — Design System

## 1. Design Personality

Calm, intelligent, trustworthy. Not clinical,
not consumer-bubbly. Every screen should feel
considered, not generated.
Reference: Linear's clarity meets a premium
health product.

---

## 2. Tech Stack (Strict)

- React functional components only
- Tailwind CSS utility classes only
  No custom CSS files, no inline styles,
  no arbitrary values (e.g. p-[13px])
- Shadcn/ui permitted for:
  Dialog, Dropdown, Tabs, Toast, Popover only
- Lucide React for all icons
- No other libraries

---

## 3. Hosting

- Frontend: Firebase Hosting (React app only)
- Database + Storage: Supabase
- AI: Gemini API

---

## 4. Color Tokens

Add to tailwind.config.js under
theme.extend.colors:

```js
colors: {
  surface:  '#FAFAF8',
  card:     '#FFFFFF',
  muted:    '#F4F4F2',
  primary:  '#0D6E6E',
  accent:   '#F5A623',
  danger:   '#E53E3E',
  success:  '#38A169',
  text: {
    DEFAULT: '#1A1A1A',
    muted:   '#6B7280',
    subtle:  '#9CA3AF',
  },
  border: {
    DEFAULT: '#E5E5E5',
    focus:   '#0D6E6E',
  }
}
```

Usage:
- Page bg: bg-surface
- Cards: bg-card
- Secondary surfaces: bg-muted
- Primary actions: bg-primary text-white
- Danger only for abnormal results + errors
- Never Tailwind default blue
- Never gradients on backgrounds

---

## 5. Report Type Accent Colors

```js
const REPORT_TYPE_COLORS = {
  blood_test:        '#0D6E6E',
  ultrasound:        '#7C3AED',
  mri:               '#7C3AED',
  consult_note:      '#D97706',
  hsg:               '#0369A1',
  laparoscopy:       '#B45309',
  discharge_summary: '#374151',
  ivf:               '#BE185D',
  embryology:        '#BE185D',
  unknown:           '#6B7280',
}
```

---

## 6. Typography

Font: Inter (Google Fonts, import in index.html)

| Element | Classes |
|---------|---------|
| Page title | text-2xl font-semibold text-gray-900 |
| Section heading | text-lg font-medium text-gray-800 |
| Card heading | text-base font-medium text-gray-900 |
| Body | text-sm text-gray-700 |
| Secondary | text-sm text-text-muted |
| Label/date | text-xs font-medium uppercase tracking-wide text-text-muted |
| Medical values | font-mono text-sm (all numbers + clinical values) |
| Disclaimer | text-xs text-text-subtle italic |

---

## 7. Spacing (Use Only These)

| Context | Value |
|---------|-------|
| Page padding desktop | px-6 py-8 |
| Page padding mobile | px-4 py-6 |
| Card padding | p-5 |
| Section gaps | gap-6 or gap-8 |
| In-card element gaps | gap-3 |
| Inline gaps | gap-2 |
| Vertical stacks | space-y-4 or space-y-6 |

---

## 8. Interaction Rules

- All transitions: duration-150 ease-in-out
- No layout shifts on load
- Skeleton screens match exact content dimensions
- Panel slide: translate-x-full → translate-x-0
- Filter changes: instant, client-side
- User notes save on blur → inline "Saved"
  confirmation, fade out after 1.5s
- Toasts: async events only, bottom-right, 3s

---

## 9. States — Required on Every Component

Every component needs all four:

**Loading:** animate-pulse skeleton matching
content shape. Never spinners.

**Empty:** exact strings from COMPONENTS.md.
Never blank, always include an action.

**Error:** human language only. Always suggest
next step. Never show API errors or stack traces.

**Default:** realistic medical placeholder data.
Never lorem ipsum.

---

## 10. Responsive Rules

Desktop first at 1280px.
Mobile breakpoint: 768px (md).

Mobile changes:
- Timeline: date moves inside card
- Detail panel: full-screen drawer
- Filter bar: horizontal scroll, no wrap
- All touch targets: minimum h-11 (44px)
- All buttons: minimum px-4

---

## 11. Hard Rules (Never Violate)

- No gradients on backgrounds
- No modals for simple actions
- No red except abnormal results and errors
- No spinners — skeletons only
- No lorem ipsum
- No icons on primary actions without labels
- No Tailwind arbitrary values
- No custom CSS files
- No inline styles
- No default Tailwind blue
