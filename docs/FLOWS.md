# FLOWS.md — User Flows + Test Cases

## How To Use This File

Read this file when:
- Building a new flow
- Adding a feature that touches an existing flow
- Running regression before merging any change

Rule: never ship a new flow with a broken
existing flow. Run the regression checklist
at the bottom before every new feature.

---

## FLOW 1: Upload a Report

### Entry Points
- "Add Report" button on empty timeline
- "+" button in header (always visible)
- Drag and drop onto timeline page

### Steps

**Step 1 — File Selection**
- Click entry point → upload area activates
- Drag over page → upload area highlights
  (border-primary, bg-primary/5)
- User selects or drops file
- Validate immediately:
  - Not PDF → inline error below upload area
  - Over 10MB → inline error below upload area
  - Valid → proceed to Step 2
- Validation errors: inline only, not toast

**Step 2 — Upload to Storage**
- Show filename + file size
- Show progress bar (bg-primary, animated)
- Upload PDF to Supabase Storage bucket 'reports'
- On success → proceed to Step 3
- On failure → error banner, offer retry

**Step 3 — Extraction**
- Show state: "Reading your report..."
  with animate-pulse, not a spinner
- Send PDF file directly to Gemini File API
  (do not extract text first)
- Use prompt from /src/prompts/extraction.js
- Parse and validate returned JSON
- On success → proceed to Step 4
- On failure after 1 retry → Step 4 with
  extraction_failed = true

**Step 4 — Extraction Preview**
- Show ExtractionPreview component
- Always show before saving, no exceptions
- Confidence banner:
  HIGH → no banner
  MEDIUM → yellow: "Some values may need
    review before saving"
  LOW → orange: "We couldn't extract this
    reliably. Please check all fields."
  FAILED → red: "Extraction failed. Please
    enter details manually."
- All fields editable before saving
- User clicks "Save Report" → Step 5
- User clicks "Edit First" → inline edit mode
  then "Save Report" → Step 5

**Step 5 — Save**
- Write to Supabase reports table
- Derive report_type + report_date to DB columns
- On success:
  - Close upload modal
  - Report appears on timeline at correct
    chronological position
  - Timeline scrolls to new report
  - Toast: "Report saved"
- On failure:
  - Error banner in preview: "Couldn't save
    your report. Please try again."
  - Do not close modal
  - Do not lose extracted data

### Failure States

| Scenario | Behaviour |
|----------|-----------|
| Wrong file type | Inline error below upload area |
| File over 10MB | Inline error below upload area |
| Upload to storage fails | Error banner, retry button |
| Gemini API fails | Retry once automatically, then show FAILED banner, offer manual entry |
| JSON parse fails | Same as Gemini failure |
| Supabase save fails | Error in preview, keep modal open |
| Scanned PDF (sparse extraction) | LOW confidence banner, user can still save |

### Test Cases — Run Every Session

- [ ] Upload valid blood test PDF →
      extraction preview shows structured values
- [ ] Upload valid ultrasound PDF →
      impression and findings captured
- [ ] Upload a scanned image PDF →
      LOW confidence banner shown,
      user can proceed to save manually
- [ ] Upload non-PDF file →
      inline error, upload does not proceed
- [ ] Upload file over 10MB →
      inline error, upload does not proceed
- [ ] Edit a field in extraction preview →
      edited value saves correctly
- [ ] Upload same report twice →
      second upload proceeds without error
      (no duplicate detection in V1)
- [ ] Save fails (simulate) →
      modal stays open, data not lost

---

## FLOW 2: View and Filter Timeline

### Default State
- All reports, newest first
- Grouped by month/year if reports span
  multiple months
- 3 skeleton cards while loading
- Empty state if no reports

### Filter Interactions

**Report type pills:**
All / Blood Tests / Imaging / Consult Notes

Mappings:
- Blood Tests → report_type: blood_test
- Imaging → report_type: ultrasound, mri,
  hsg, laparoscopy
- Consult Notes → report_type: consult_note,
  discharge_summary

**Date range dropdown:**
Last 6 months / Last year / All time

Rules:
- Filtering is instant, client-side
- No reload, no loading state
- Multiple filters combine with AND logic
- Active filters shown as removable chips
  below filter bar
- "Clear all" appears when any filter active
- Removing last chip resets to default view

### Report Detail Panel

Trigger: click anywhere on report card

Behaviour:
- Slides in from right (desktop)
- Full-screen drawer (mobile)
- Does not navigate away from timeline
- Timeline remains scrollable behind panel
- Close: X button or click outside panel

Panel sections (show only if data present):
1. Header: type badge + date + close button
2. Lab Values table (always shown if present)
   Abnormal rows: bg-red-50
3. Clinical Notes (if present)
4. Impression (if present)
5. Medications (if present)
6. Procedures (if present)
7. User Notes (always shown, editable)
8. Footer: "View Original PDF" → new tab

Edit mode:
- Edit button in header
- All extracted fields become editable inline
- Save button replaces Edit button
- On save: update Supabase, exit edit mode
- On cancel: discard changes, exit edit mode

### Test Cases — Run Every Session

- [ ] Timeline loads with 0 reports →
      correct empty state + upload CTA
- [ ] Timeline loads with 1 report →
      no month divider, no connecting line
- [ ] Timeline loads with 5+ reports →
      month dividers appear correctly
- [ ] Filter by Blood Tests →
      only blood_test reports shown
- [ ] Filter by Imaging →
      ultrasound + mri + hsg + laparoscopy shown
- [ ] Filter Last 6 months →
      older reports hidden
- [ ] Combine type + date filter →
      AND logic applies correctly
- [ ] Clear all filters →
      all reports visible again
- [ ] Click report card →
      detail panel opens, correct data shown
- [ ] Abnormal lab value →
      row has bg-red-50 in detail panel
- [ ] Edit a value in detail panel →
      updated value persists after panel close
- [ ] User notes save on blur →
      "Saved" confirmation appears inline
- [ ] View Original PDF →
      opens in new tab

---

## FLOW 3: Ask a Question (Phase 2)

### Entry Point
- "Ask" button in header
- Navigates to Ask page
- OR persistent input below timeline
  (decide one, implement consistently)

### Steps

**Step 1 — Input**
- User types question in natural language
- No reports uploaded → input disabled
  Tooltip: "Add some reports first — I need
  your history to reason well"
- Submit via button or Cmd/Ctrl + Enter

**Step 2 — Context Assembly**
On submit:
- Fetch all reports for this user from Supabase
- Build patientContext object:
{
reports: [ all reports with full
extracted_values ],
previousQA: [ prior questions and
answers this session ]
}
- Show state: "Reading your history..."
  animate-pulse on response area

**Step 3 — Reasoning**
- Send patientContext + question to Gemini
  using prompt from /src/prompts/reasoning.js
- Use streaming — render text as it arrives
- Do not wait for full response before
  showing content

**Step 4 — Response Display**
Render ResponseCard in this exact order
as content streams in:

1. Relevant History
   - Paragraphs with inline citation chips
   - Each chip format:
     (Report: YYYY-MM-DD, Type: report_type)
   - Chips are clickable → opens that report
     in detail panel

2. Reasoning
   - Plain paragraphs
   - Uses "this suggests" not "you should"

3. Gaps
   - Italic, text-text-muted
   - Prefixed: "What would help answer
     this better:"

4. Questions for Your Doctor
   - Distinct card: border-l-4 border-accent
     bg-white rounded-lg p-4
   - Numbered list, 3-5 items
   - Specific, not generic

5. Disclaimer
   - Always last, exact text:
     "This reasoning is based on your uploaded
     records and is not medical advice. Please
     discuss any decisions with your doctor."
   - text-xs text-text-subtle italic

**Step 5 — Follow-up**
- Prior Q&A stays visible above
- New question input ready at bottom
- Previous QA included in next context build
- Session history not persisted between
  page reloads (V1)

### What a Good Response Looks Like

Question: "I had a Luprodex injection 6 weeks
ago. Can I plan a trip next month?"

BAD — never produce this:
"Based on your medical history, you should
consult your doctor before making travel plans."

GOOD — must look like this:
"Your Luprodex depot injection on
(Report: 2024-04-01, Type: consult_note)
is a 3-month GnRH agonist. Suppression
typically continues for 8-12 weeks. Your AMH
of 0.9 ng/mL (Report: 2024-03-15,
Type: blood_test) was a factor in deferring
laparoscopy — your team will need Day 2 tests
as soon as your cycle resumes.

The key uncertainty is whether your period
falls before, during, or after your travel
window.

What would help answer this better: exact
date of injection, expected cycle length
from your doctor's notes.

Questions for Your Doctor:
1. Based on my injection date, when do you
   expect my cycle to resume?
2. Can Day 2 tests be done at a lab in the
   city I'm travelling to?
3. Does my ectopic history affect any timing
   considerations here?

This reasoning is based on your uploaded
records and is not medical advice. Please
discuss any decisions with your doctor."

### Failure States

| Scenario | Behaviour |
|----------|-----------|
| No reports uploaded | Input disabled, tooltip shown |
| Gemini API fails | "Couldn't process your question right now. Try again in a moment." |
| Empty question submitted | Prevent submit, no error shown |
| Response contains no citations | Prompt is failing — flag for debugging, do not show to user |

### Test Cases — Run Every Session

- [ ] Ask question with 0 reports →
      input disabled, tooltip visible
- [ ] Ask question with 5+ reports →
      response cites specific report dates
      and types, not generic text
- [ ] Citation chip clicked →
      correct report opens in detail panel
- [ ] Response streams in →
      text appears progressively,
      not all at once
- [ ] Ask follow-up question →
      prior Q&A visible above,
      context carries forward
- [ ] Response structure →
      all 5 sections present in correct order
- [ ] Disclaimer →
      always present, exact wording,
      always last
- [ ] Gemini fails (simulate) →
      correct error message shown

---

## FLOW 4: Authentication (Phase 3)

### Entry Points
- Any page load when not authenticated →
  redirect to /login
- "Sign up" link on login page

### Sign Up
- Fields: email, password, confirm password
- Validation: email format, password min 8 chars,
  passwords match
- On success: auto sign in, redirect to timeline
- On failure: inline field errors

### Sign In
- Fields: email, password
- "Forgot password" link → password reset flow
- On success: redirect to timeline
- On failure: "Incorrect email or password"
  (do not specify which is wrong)

### Password Reset
- Enter email → Supabase sends reset link
- Success message: "Check your email for
  a reset link"
- Do not confirm whether email exists

### Data Isolation
- All Supabase queries must filter by
  auth.uid()
- Add user_id column to reports table
- Enable Row Level Security (RLS) on
  reports table:
  Policy: users can only read and write
  their own rows

### Test Cases — Run Every Session

- [ ] Sign up with new email →
      redirects to timeline
- [ ] Sign in with correct credentials →
      redirects to timeline
- [ ] Sign in with wrong password →
      error shown, no redirect
- [ ] Access timeline without auth →
      redirects to login
- [ ] User A cannot see User B's reports →
      RLS working correctly
- [ ] Password reset email sends →
      success message shown

---

## Regression Checklist

Run this before every new feature.
Do not proceed if any item fails.

### Flow 1 — Upload
- [ ] PDF uploads end to end
- [ ] Extraction preview always shown
- [ ] Confidence banners show correctly
- [ ] Edited fields save correctly
- [ ] Report appears on timeline after save
- [ ] Failed extraction handled gracefully

### Flow 2 — Timeline
- [ ] Timeline renders in correct order
- [ ] Month dividers appear correctly
- [ ] All filter combinations work
- [ ] Report detail panel opens + closes
- [ ] Abnormal values highlighted
- [ ] User notes save on blur
- [ ] Edit mode saves correctly

### Flow 3 — Reasoning
- [ ] Disabled state when no reports
- [ ] Response cites specific records
- [ ] All 5 sections present in response
- [ ] Citation chips open correct report
- [ ] Follow-up carries prior context
- [ ] Disclaimer always present

### Flow 4 — Auth (Phase 3 only)
- [ ] Sign up works
- [ ] Sign in works
- [ ] Unauthenticated redirect works
- [ ] RLS isolates user data

### Global
- [ ] No console errors on any flow
- [ ] Mobile layout not broken at 768px
- [ ] All empty states show correct copy
- [ ] All error states show human language
- [ ] No spinners — skeletons only
- [ ] No lorem ipsum in any state
