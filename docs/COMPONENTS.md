# COMPONENTS.md — Component Patterns

## How To Use This File

Read this file when building or modifying
any UI component. Every pattern here is
mandatory — do not invent alternatives.

All colors reference UI.md tokens.
All spacing references UI.md spacing system.
All states (loading/empty/error/default)
are required on every component.

---

## Component Index

1. ReportCard
2. Timeline
3. TimelineList + MonthDivider
4. FilterBar
5. UploadArea
6. ExtractionPreview
7. ReportDetailPanel
8. AIResponseCard
9. QuestionInput
10. Header
11. Shared Strings

---

## 1. ReportCard

File: /src/components/reports/ReportCard.jsx

Props:
- report: object (full Supabase reports row)
- onClick: function

Structure:
- Outer wrapper: flex bg-card rounded-xl
  shadow-sm border border-border
  overflow-hidden cursor-pointer
  hover:shadow-md transition-shadow
  duration-150
- Left accent bar: w-1 shrink-0
  backgroundColor from REPORT_TYPE_COLORS
  keyed by report.report_type
- Card body: flex-1 p-5 flex
  justify-between gap-3

Left column (date + lab):
- Date: text-sm font-medium text-gray-900
  Format: "15 Mar 2024"
- Lab name: text-xs text-text-muted mt-0.5

Center column (value chips):
- Max 3 chips from lab_values
- Priority: flagged values first
- Each chip: text-xs font-mono px-2 py-0.5
  rounded-full border
  Format: "AMH: 0.9 ng/mL"
- Abnormal chip: bg-red-50 text-danger
  border-red-200
- Normal chip: bg-green-50 text-success
  border-green-200
- Unknown chip: bg-muted text-text-muted
  border-border

Right column (badges):
- Type badge: text-xs px-2 py-0.5
  rounded-full bg-muted text-text-muted
- Confidence badge (medium/low only):
  Medium: bg-yellow-50 text-yellow-700
  Low: bg-orange-50 text-orange-700
  Both: text-xs px-2 py-0.5 rounded-full

Loading state:
- animate-pulse skeleton card
- Same outer dimensions as loaded card
- Gray blocks matching date, lab, chips

---

## 2. Timeline

File: /src/pages/Timeline.jsx

Structure:
- Page wrapper: px-6 py-8 (desktop)
  px-4 py-6 (mobile)
- Header (sticky)
- FilterBar
- Timeline body: space-y-2 mt-6

Timeline row (one per report):
- flex gap-4 items-start
- Left date column: w-20 shrink-0 text-right
  pt-3 text-xs font-medium uppercase
  tracking-wide text-text-muted
  Hidden on mobile (hidden md:block)
- Right column: flex-1 border-l-2
  border-border pl-4
  Contains ReportCard

Month grouping:
- Group reports by YYYY-MM of report_date
- Sort groups descending (newest first)
- Sort reports within group descending
- MonthDivider renders above each group

Loading state:
- 3 skeleton ReportCards with animate-pulse
- One MonthDivider skeleton above them

Empty state:
- mt-20 flex flex-col items-center
- Icon: FileText from lucide
  w-12 h-12 text-text-subtle mb-4
- Message: EMPTY_STATES.NO_REPORTS
  text-sm text-text-muted text-center
- Button: "Add Report" bg-primary text-white
  rounded-lg px-4 py-2 text-sm font-medium
  mt-4

Mobile (md breakpoint):
- Hide left date column
- Show date inside card below lab name
- Remove border-l-2 line

---

## 3. TimelineList + MonthDivider

File: /src/components/timeline/TimelineList.jsx
File: /src/components/timeline/MonthDivider.jsx

TimelineList props:
- reports: array
- onReportClick: function

MonthDivider props:
- label: string (e.g. "March 2024")

MonthDivider styling:
- w-full bg-muted rounded-lg px-4 py-2 mb-2
- text-xs font-semibold uppercase
  tracking-wider text-text-muted

---

## 4. FilterBar

File: /src/components/timeline/FilterBar.jsx

Props:
- activeType: string
- activeDateRange: string
- onTypeChange: function
- onDateRangeChange: function
- onClearAll: function

Type filter options:

  label: "All"         value: "all"
  label: "Blood Tests" value: "blood_test"
  label: "Imaging"     value: ["ultrasound",
                                "mri","hsg",
                                "laparoscopy"]
  label: "Consult"     value: ["consult_note",
                                "discharge_summary"]

Date range options:

  label: "All time"      value: "all"
  label: "Last 6 months" value: "6m"
  label: "Last year"     value: "1y"

Pill styling:
- All pills: rounded-full px-3 py-1.5 text-sm
  font-medium transition-colors duration-150
  cursor-pointer
- Active: bg-primary text-white
  border border-primary
- Inactive: bg-card border border-border
  text-text-muted hover:border-primary
  hover:text-primary

Date range: Shadcn Dropdown, same pill styling
as inactive filter pills

Active filter chips (below pill row):
- Visible only when filter is not default
- Chip: bg-muted border border-border
  rounded-full px-3 py-1 text-xs
  text-text-muted
- Remove: X icon from lucide w-3 h-3 ml-1
- "Clear all": text-primary text-sm ml-2

Mobile:
- overflow-x-auto whitespace-nowrap
- Hide scrollbar with scrollbar-hide utility

---

## 5. UploadArea

File: /src/components/upload/UploadArea.jsx

Props:
- onFileSelected: function
- disabled: boolean

Default state:
- border-2 border-dashed border-border
  rounded-xl p-10 text-center cursor-pointer
- Icon: Upload from lucide
  w-10 h-10 text-text-subtle mb-3 mx-auto
- Text: "Drag a PDF here or click to browse"
  text-sm text-text-muted
- Subtext: "PDF only · Max 10MB"
  text-xs text-text-subtle mt-1

Drag-over state:
- border-primary bg-primary/5
- Text: "Drop it here"

File selected state:
- border-success bg-green-50
- Filename: truncated at 40 chars with "..."
- File size: formatted (e.g. "1.2 MB")
- Remove button: X icon text-text-muted
  hover:text-danger

Validation errors (inline below area):
- text-xs text-danger mt-2
- Wrong type: ERROR_STATES.WRONG_FILE_TYPE
- Too large: ERROR_STATES.FILE_TOO_LARGE

Disabled state:
- opacity-50 cursor-not-allowed
- All drag events ignored

---

## 6. ExtractionPreview

File: /src/components/upload/ExtractionPreview.jsx

Props:
- extraction: object (Gemini JSON output)
- confidence: string (high/medium/low/failed)
- confidenceReason: string
- onSave: function
- onCancel: function

Confidence banner (always first, above fields):

  HIGH:   no banner shown

  MEDIUM: bg-yellow-50 border border-yellow-200
          rounded-lg p-3 mb-4
          text-sm text-yellow-800
          "Some values may need review
          before saving"

  LOW:    bg-orange-50 border border-orange-200
          rounded-lg p-3 mb-4
          text-sm text-orange-800
          "We couldn't extract this reliably.
          Please check all fields carefully."

  FAILED: bg-red-50 border border-red-200
          rounded-lg p-3 mb-4
          text-sm text-danger
          "Extraction failed. Please enter
          details manually."

Detected Information section:
- Heading: "Detected Information"
  text-sm font-medium text-gray-900 mb-3
- Grid: grid-cols-2 gap-4 (desktop)
  grid-cols-1 (mobile)
- Fields: Report type (Shadcn Dropdown with
  all report_type enum values as human labels),
  Report date (date input),
  Lab name (text input),
  Doctor name (text input)
- All inputs: rounded-lg border border-border
  px-3 py-2 text-sm w-full
  focus:border-focus focus:ring-1
  focus:ring-primary

Report type human labels mapping:

  blood_test         → "Blood Test"
  ultrasound         → "Ultrasound"
  mri                → "MRI"
  consult_note       → "Consultation Note"
  hsg                → "HSG Report"
  laparoscopy        → "Laparoscopy"
  discharge_summary  → "Discharge Summary"
  ivf                → "IVF Report"
  embryology         → "Embryology Report"
  unknown            → "Other"

Extracted Values section:
- Heading: "Extracted Values"
  text-sm font-medium text-gray-900 mb-3
- Table: w-full text-sm
- Columns: Parameter | Value | Unit |
  Reference Range | Flag
- Flag cell: chip per ReportCard chip rules
- Row click: inline edit mode for that row
- If lab_values empty: text-sm text-text-muted
  "No structured values extracted.
  You can add them after saving."

Buttons (bottom, right-aligned, flex gap-3):
- "Cancel": text-sm text-text-muted
  hover:text-gray-900 cursor-pointer
- "Edit First": bg-card border border-border
  text-gray-700 rounded-lg px-4 py-2
  text-sm font-medium
- "Save Report": bg-primary text-white
  rounded-lg px-4 py-2 text-sm font-medium

Loading state (while Gemini is extracting):
- animate-pulse skeleton blocks
- Heights approximating field rows and table
- Above skeleton: "Reading your report..."
  text-sm text-text-muted

---

## 7. ReportDetailPanel

File: /src/components/reports/ReportDetailPanel.jsx

Props:
- report: object or null
- isOpen: boolean
- onClose: function
- onUpdate: function

Panel wrapper:
- Desktop: fixed right-0 top-0 h-full w-96
  bg-card shadow-xl z-50
  transition-transform duration-200 ease-in-out
  Open: translate-x-0
  Closed: translate-x-full
- Mobile: fixed inset-0 z-50 bg-card
  (full screen)
- Backdrop: fixed inset-0 bg-black/20 z-40
  mobile only, click closes panel

Header (sticky):
- sticky top-0 bg-card border-b border-border
  px-5 py-4
- flex justify-between items-center
- Left: type badge + date
  (same styling as ReportCard)
- Right: Edit button (Pencil icon from lucide
  w-4 h-4 text-text-muted hover:text-gray-900)
  + Close button (X icon same styling)
  gap-3

Scrollable body:
- overflow-y-auto px-5 py-4 space-y-6

Sections (render only if data present,
except User Notes which always renders):

Lab Values:
- Heading: "Lab Values"
  text-xs font-medium uppercase tracking-wide
  text-text-muted mb-2
- Table: w-full text-sm
  Columns: Parameter | Value | Unit |
  Reference Range | Flag
- Abnormal rows: bg-red-50
- Flag chip: same as ReportCard

Clinical Notes:
- Heading: "Clinical Notes" (same heading style)
- Content: bg-muted rounded-lg p-4
  text-sm text-gray-700 leading-relaxed
  whitespace-pre-wrap

Impression:
- Same heading + content style as
  Clinical Notes

Medications:
- Heading: "Medications"
- Each item: name in text-sm font-medium,
  dose + frequency + duration on second line
  text-xs text-text-muted
- Divider: border-b border-border pb-3

Procedures:
- Heading: "Procedures"
- Each item: text-sm text-gray-700
  with bullet (list-disc ml-4)

User Notes (always visible):
- Heading: "Your Notes"
  text-xs font-medium uppercase tracking-wide
  text-text-muted mb-2
- Textarea: w-full rounded-lg border
  border-border p-3 text-sm resize-none
  min-h-20 focus:border-focus
  focus:ring-1 focus:ring-primary
- Placeholder: "Add your own observations
  about this report..."
- Save on blur → PATCH user_notes in Supabase
- Inline confirmation: text-xs text-success
  "Saved" fades out after 1.5s

Footer (sticky bottom):
- sticky bottom-0 bg-card border-t
  border-border px-5 py-4
- "View Original PDF": w-full bg-muted
  border border-border rounded-lg py-2
  text-sm text-gray-700 text-center
  hover:border-primary hover:text-primary
  Opens file_url in new tab

Edit mode:
- Triggered by Edit button in header
- All extracted fields become inputs
  (same input styling as ExtractionPreview)
- Header buttons change to:
  "Save Changes" bg-primary text-white
  "Cancel" text-text-muted
- On save: PATCH Supabase row,
  update extracted_values + report_type
  + report_date + lab_name + doctor_name
- On cancel: revert all fields, exit edit mode

---

## 8. AIResponseCard

File: /src/components/reasoning/AIResponseCard.jsx

Props:
- content: string (streams in)
- isStreaming: boolean
- citedReports: array of report objects
- onCitationClick: function (receives report)

Wrapper:
- bg-muted rounded-xl p-5
- border-l-4 border-primary

Section 1 — Relevant History:
- Plain paragraphs, text-sm text-gray-700
- Citations detected by pattern:
  (Report: YYYY-MM-DD, Type: report_type)
- Render each citation as inline chip:
  bg-white border border-border rounded
  px-1.5 py-0.5 text-xs font-mono
  cursor-pointer hover:border-primary
  onClick fires onCitationClick with
  matching report object

Section 2 — Reasoning:
- Plain paragraphs, text-sm text-gray-700

Section 3 — Gaps:
- Label: "What would help answer this better:"
  text-xs font-medium uppercase tracking-wide
  text-text-muted mb-1
- Content: text-sm text-text-muted italic

Section 4 — Questions for Your Doctor:
- Wrapper: border-l-4 border-accent
  bg-white rounded-lg p-4 mt-4
- Heading: "Questions for Your Doctor"
  text-sm font-semibold text-gray-900 mb-2
- Items: ol with list-decimal ml-4
  text-sm text-gray-700 space-y-2

Section 5 — Disclaimer (always last):
- mt-4 text-xs text-text-subtle italic
- Exact text (never change):
  "This reasoning is based on your uploaded
  records and is not medical advice. Please
  discuss any decisions with your doctor."

Streaming cursor (while isStreaming is true):
- After last character: inline-block w-0.5
  h-4 bg-primary ml-0.5 align-middle
  animate-pulse

Loading state (before stream starts):
- Text above: "Reading your history..."
  text-sm text-text-muted mb-4
- 4 skeleton blocks animate-pulse
  Heights: h-4 h-4 h-4 h-20
  Widths: full, 3/4, full, full

---

## 9. QuestionInput

File: /src/components/reasoning/QuestionInput.jsx

Props:
- onSubmit: function
- disabled: boolean
- disabledReason: string

Wrapper: relative w-full

Textarea:
- w-full rounded-xl border border-border
  p-4 pr-20 pb-10 text-sm resize-none
  min-h-24 focus:border-focus
  focus:ring-1 focus:ring-primary
  focus:outline-none
- Placeholder: "Ask anything about your
  medical history or help thinking
  through a decision..."
- Submit on Cmd+Enter or Ctrl+Enter

Character count:
- absolute bottom-3 right-16
- text-xs text-text-subtle

Submit button:
- absolute bottom-3 right-3
- bg-primary text-white rounded-lg
  px-4 py-1.5 text-sm font-medium
- Label: "Ask"

Disabled state:
- Textarea: opacity-50 cursor-not-allowed
  pointer-events-none
- Button: opacity-50 cursor-not-allowed
- Shadcn Popover on wrapper hover:
  shows disabledReason text
  text-xs text-text-muted p-2

---

## 10. Header

File: /src/components/layout/Header.jsx

Wrapper:
- sticky top-0 z-30 bg-card
  border-b border-border px-6 py-4
- flex justify-between items-center

Left:
- App name: text-base font-semibold
  text-gray-900
- Placeholder name: "Medi"

Right (button group, flex gap-3):

Ask button:
- bg-muted border border-border
  text-gray-700 rounded-lg px-4 py-2
  text-sm font-medium
- Icon: MessageCircle from lucide
  w-4 h-4 mr-2 inline
- Navigates to /ask

Add Report button:
- bg-primary text-white rounded-lg
  px-4 py-2 text-sm font-medium
- Icon: Plus from lucide
  w-4 h-4 mr-1 inline
- Opens upload modal

Mobile (below md breakpoint):
- Both buttons icon-only
- w-9 h-9 rounded-lg flex items-center
  justify-center
- No label text

---

## 11. Shared Strings

File: /src/lib/strings.js

Export these constants exactly.
Import and use everywhere — never
hardcode strings inline in components.

EMPTY_STATES:

  NO_REPORTS:
    "No reports yet. Upload your first
    report to start building your
    medical timeline."

  NO_FILTER_RESULTS:
    "No reports match this filter.
    Try changing the date range or
    report type."

  NO_REPORTS_FOR_QUESTION:
    "Add a few reports first so I have
    your history to work with."

  NO_USER_NOTES:
    "No notes yet. Add your own
    observations about this report."

ERROR_STATES:

  UPLOAD_FAILED:
    "Upload failed. Please check your
    connection and try again."

  EXTRACTION_FAILED:
    "We couldn't read this report.
    You can add details manually instead."

  FILE_TOO_LARGE:
    "This file is too large (max 10MB).
    Try compressing it or uploading
    pages separately."

  WRONG_FILE_TYPE:
    "Only PDF files are supported
    right now."

  SAVE_FAILED:
    "Couldn't save your report.
    Please try again."

  AI_FAILED:
    "Couldn't process your question
    right now. Try again in a moment."
