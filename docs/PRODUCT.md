# PRODUCT.md

## 1. What This Is

A patient-first medical records and AI reasoning tool
for individuals managing complex chronic conditions,
starting with endometriosis and fertility treatment.

Core function:
- Upload medical report PDFs
- Extract and store structured data via Gemini API
- Display a filterable chronological medical timeline
- (Phase 2) Answer natural language questions grounded
  in the patient's actual records

This is a thinking aid. It does not diagnose,
prescribe, or replace doctors.

---

## 2. The Problem

Patients with complex conditions accumulate reports
across WhatsApp, physical folders, and multiple labs.
In short consultations (5-15 min) they cannot
reconstruct their history clearly. Between
appointments, they face decisions alone with only
generic information available.

The gap: no tool combines persistent medical memory
with contextual reasoning for the patient.

---

## 3. Build Phases

### Phase 1 — Data Foundation
- PDF upload → Gemini extraction → Supabase storage
- Chronological timeline with filters
- Single hardcoded user, no auth

### Phase 2 — Reasoning Layer
- Natural language question input
- Reason across full patient history
- Cited responses + doctor discussion prompts
- Still single user

### Phase 3 — Multi-User MVP
- Supabase Auth (email/password)
- Per-user data isolation
- Account management

---

## 4. Non-Goals (Strict — Never Build in MVP)

- Diagnosis of any condition
- Treatment or medication recommendations
- Hospital or lab integrations
- Real-time monitoring
- Emergency decision support
- Handwritten prescription OCR
- Doctor-facing features
- Mobile app

---

## 5. Target User

Female patient, endometriosis + fertility treatment
journey. Has 10-30 reports over 2-3 years across
multiple specialists. Non-technical. Currently
stores reports on WhatsApp or in physical folders.

---

## 6. Report Types

### Tier 1 — Must work at launch
1. Blood tests (AMH, FSH, LH, TSH, CBC, HCG)
2. Ultrasound / sonography reports
3. MRI reports
4. Typed doctor consultation notes

### Tier 2 — Support if format is clean
5. HSG reports
6. Laparoscopy reports
7. Discharge summaries

### Tier 3 — Post-MVP
8. IVF cycle reports
9. Embryology reports

Note: Handwritten notes excluded from all tiers in V1.

---

## 7. Supabase Schema

### Table: reports

| Column               | Type          | Notes                          |
|----------------------|---------------|--------------------------------|
| id                   | uuid PK       |                                |
| user_id              | uuid nullable | null in Phase 1-2              |
| file_url             | text          | Supabase Storage URL           |
| file_name            | text          | Original filename              |
| report_type          | text          | Canonical — derived from extraction, then stored explicitly |
| report_date          | date          | Test date not upload date — derived from extraction |
| lab_name             | text nullable |                                |
| doctor_name          | text nullable |                                |
| uploaded_at          | timestamptz   |                                |
| extracted_values     | jsonb         | Full structured data, see Section 8 |
| raw_text             | text          | Full text extracted from PDF   |
| extraction_confidence| text          | high / medium / low            |
| confidence_reason    | text nullable | Required when not high         |
| extraction_failed    | boolean       | true if ingestion pipeline failed after retry |
| user_notes           | text nullable | User-editable field            |
| created_at           | timestamptz   | default now()                  |

### Schema Rule: Single Source of Truth
`report_type` and `report_date` exist both in the
DB row AND inside `extracted_values`. This is
intentional — DB columns are canonical and used
for all queries and filters. `extracted_values`
contains them for completeness and AI context.

The ingestion pipeline (Section 9) explicitly
writes both at save time. They must always match.
Never derive one from the other at query time.

---

## 8. extracted_values JSON Schema (Strict)

```json
{
  "report_type": "blood_test | ultrasound | mri |
    consult_note | hsg | laparoscopy |
    discharge_summary | ivf | embryology | unknown",

  "report_date": "YYYY-MM-DD or null",

  "patient_info": {
    "name": "string or null",
    "age": "number or null"
  },

  "lab_values": [
    {
      "name": "string",
      "value": "string",
      "unit": "string or null",
      "reference_range": "string or null",
      "flag": "low | high | normal | unknown"
    }
  ],

  "findings": ["string"],

  "impression": "string or null",

  "medications": [
    {
      "name": "string",
      "dose": "string or null",
      "frequency": "string or null",
      "duration": "string or null"
    }
  ],

  "procedures": ["string"],

  "tags": [
    "endometriosis | fertility | hormonal |
    surgery | unknown"
  ]
}
```

### Data Integrity Rules
- Missing field → return null, never omit the key
- Never hallucinate values
- Dates must be YYYY-MM-DD
- All arrays must always be present, even if empty
- Unknown report_type → "unknown"
- Float values must be strings: "0.9" not 0.9
- No inferred values unless explicitly stated
  in the report

---

## 9. Ingestion Pipeline

Every upload follows this exact sequence:

User selects PDF
PDF sent to Supabase Storage → file_url returned
PDF sent directly to Gemini File API
(do not extract text first — send file natively)
Gemini returns JSON using extraction prompt
Validate JSON structure:

Parse safely in try/catch
Check required keys exist
Check report_type is valid enum or "unknown"
Check dates are YYYY-MM-DD or null


If validation fails → retry once with same prompt
If retry fails → save record with:
extraction_failed = true
extraction_confidence = "low"
confidence_reason = "JSON validation failed"
raw_text = raw Gemini output for manual review
If validation passes → normalize:

Write report_type to DB column
Write report_date to DB column
Write lab_name and doctor_name to DB columns
if present in extracted_values


Save full extracted_values as jsonb
Show extraction preview to user before final save


### Partial Extraction Handling
If Gemini returns valid JSON but with sparse data
(fewer than 3 lab_values AND no impression AND
no findings):
- Save the record
- Set extraction_confidence = "low"
- Set confidence_reason = "Sparse extraction —
  fewer than 3 fields returned"
- Show warning to user in preview screen

### Scanned PDF Handling
Gemini reads PDFs natively including scanned images.
If Gemini returns fewer than 50 characters of
meaningful content across all fields:
- Treat as failed extraction
- Show user: "This looks like a scanned image we
  couldn't read clearly. You can add details
  manually."

---

## 10. AI Reasoning Rules (Phase 2)

### Non-Negotiables
The AI must:
- Use ONLY data present in the patient's records
- NEVER diagnose, recommend treatment, or give
  definitive conclusions
- ALWAYS cite using the defined citation format
  (see Section 11)
- ALWAYS separate facts (from records) from
  inferences (reasoning)
- ALWAYS state what information is missing
- ALWAYS end with specific doctor questions
- NEVER give a yes/no answer to a medical decision
- NEVER generalize beyond what the records show
- NEVER hallucinate values, dates, or reports

### Mandatory Response Structure
Every AI response must follow this exact order:

**1. Relevant History**
What the records show that relates to this question.
Must use citation format from Section 11.

**2. Reasoning**
Logical interpretation of the facts.
No advice, only analysis.
Use "this suggests" not "you should".

**3. Gaps**
What information is missing that would improve
the answer. Be specific — name the missing test
or value.

**4. Questions for Your Doctor**
3-5 specific, actionable questions.
Not "ask your doctor about your health."
Example: "Ask whether your Day 2 FSH and LH
tests can be done before [travel date]."

**5. Disclaimer**
Always last, exact text, never paraphrased:
"This reasoning is based on your uploaded records
and is not medical advice. Please discuss any
decisions with your doctor."

---

## 11. Citation Format (Mandatory)

Every reference to patient data must use
this exact format:
(Report: YYYY-MM-DD, Type: report_type)

Example:
"Your AMH was 0.9 ng/mL
(Report: 2024-03-15, Type: blood_test),
which is below the standard reference range."

Rules:
- No other citation format is permitted
- If date is null, use: (Report: date unknown,
  Type: report_type)
- Every factual claim about patient data
  must have a citation
- Inferences do not need citations but must
  be clearly flagged as inferences

---

## 12. Good vs Bad Response Example

**Question:** "I had a Luprodex injection 6 weeks
ago and no period yet. Can I plan a trip?"

**Patient records include:**
- AMH: 0.9 ng/mL (2024-03-15, blood_test)
- Endo confirmed (2024-01-10, mri)
- Past ectopic pregnancy (2023-06-01, consult_note)
- Laparoscopy deferred due to low AMH
  (2024-03-20, consult_note)
- Luprodex depot administered (2024-04-01,
  consult_note)

**BAD response:**
"Based on your medical history, you should consult
your doctor before making travel plans."

**GOOD response:**
"Your Luprodex depot injection on
(Report: 2024-04-01, Type: consult_note)
is a 3-month GnRH agonist. Suppression of the
cycle typically continues for 8-12 weeks
post-injection, though timing varies. Your AMH
of 0.9 ng/mL (Report: 2024-03-15, Type: blood_test)
was a factor in deferring laparoscopy, and your
team will need Day 2 tests as soon as your cycle
resumes to plan next steps.

The key uncertainty here is whether your period
will fall before, during, or after your travel
window — this cannot be determined from your
records alone.

Questions to ask your doctor:
1. Based on my Luprodex date, when do you expect
   my cycle to resume?
2. Can Day 2 tests be done at a lab in the city
   I'm travelling to?
3. Does my ectopic history affect any timing
   considerations here?

This reasoning is based on your uploaded records
and is not medical advice. Please discuss any
decisions with your doctor."

---

## 13. Failure Modes to Guard Against

- Hallucinated lab values or dates
- Generic responses not anchored to patient data
- Missing or incorrectly formatted citations
- Overconfident tone on uncertain or missing data
- Incorrect report_type classification
- Silent extraction failures (must always surface
  to user)
- report_type drift between DB column and
  extracted_values
