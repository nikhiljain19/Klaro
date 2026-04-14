export function buildExtractionPrompt() {
  return `Read the medical report provided.

Return ONLY valid JSON.
No explanation, no markdown fences, no preamble — raw JSON only.

Follow this exact schema:
{
  "report_type": "blood_test | ultrasound | mri | consult_note | hsg | laparoscopy | discharge_summary | ivf | embryology | unknown",
  "report_date": "YYYY-MM-DD or null",
  "patient_info": {
    "name": "string or null",
    "age": "number or null"
  },
  "referred_by": "string or null",
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
  "tags": ["string"],
  "extraction_confidence": "high | medium | low",
  "confidence_reason": "string or null"
}

report_type classification rules:
- blood_test includes: CBC, complete blood count, urinalysis, urine analysis, urine routine, hormone panels, thyroid profile, HbA1c, serology, biochemistry, AMH, CA-125, any lab test on blood or urine
- ultrasound includes: sonography, USG, ultrasound scan
- mri includes: MRI, magnetic resonance imaging
- consult_note includes: consultation, prescription, doctor notes, OPD notes
- hsg includes: hysterosalpingography
- laparoscopy includes: laparoscopic surgery, diagnostic laparoscopy
- discharge_summary includes: discharge summary, hospital discharge
- ivf includes: IVF cycle, embryo transfer, egg retrieval
- embryology includes: embryology report, semen analysis

When in doubt between blood_test and unknown, prefer blood_test if it contains lab values.

Extract the referring doctor name into "referred_by" from fields labelled: "Ref. by", "Referred by", "Referring doctor", "Ref Dr" or similar variations.

The tags field must contain plain English descriptions that a non-medical person can understand — not just parameter names or medical jargon.
Map extracted content to these human-readable tags:
Ovarian Reserve — if AMH, AFC, or antral follicle count present
Pregnancy Test — if HCG, beta-HCG present
Thyroid Health — if TSH, T3, T4 present
Blood Count — if CBC, hemoglobin, WBC, RBC, platelets present
Liver Health — if LFT, bilirubin, ALT, AST, SGPT present
Kidney Health — if creatinine, BUN, urea, GFR present
Blood Sugar — if glucose, HbA1c, random blood sugar present
Cancer Marker — if CA-125, CEA, AFP, PSA present
Hormone Panel — if FSH, LH, estradiol, progesterone, testosterone present
Fertility Treatment — if IVF, IUI, embryo, follicle monitoring present
Infection Screen — if HIV, HBsAg, VDRL, cultures present
Pelvic Health — if ultrasound, endometriosis, fibroids, ovarian cyst mentioned
Spine Health — if MRI spine, disc, vertebrae mentioned
Urine Test — if urinalysis, urine routine present

Rules for tags:
- Use only tags from the list above
- A report can have multiple tags
- Maximum 3 tags per report
- Never use parameter names as tags (not "AMH", not "CA-125")
- Never use "unknown" as a tag
- If nothing matches, return empty array

Enforce these rules inside the prompt:
- Never guess — return null if uncertain.
- Never omit a key — use null or [] if missing.
- All numeric values as strings: "0.9" not 0.9
- flag is high if value exceeds reference range upper bound.
- flag is low if value is below reference range lower bound.
- flag is unknown if no reference range is available.
- extraction_confidence is HIGH if ANY of these conditions are met:
  - report_date present AND report_type identified AND 3+ lab_values extracted
  - report_date present AND report_type is mri/ultrasound/hsg/laparoscopy AND findings or impression present
  - report_date present AND report_type identified AND lab_values has 1 or 2 items AND all items have name, value, unit and reference_range present (single high-value marker reports like AMH-only, CA-125 only, TSH only)
- extraction_confidence is MEDIUM if:
  - Core data present but date is missing OR report_type is uncertain OR lab values exist but are incomplete (missing units or reference ranges)
- extraction_confidence is LOW if:
  - Fewer than 3 meaningful fields total
  - Report appears unreadable or is a scan with no extractable text
- confidence_reason is required when confidence is not high.`;
}
