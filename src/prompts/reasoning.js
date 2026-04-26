export function buildReasoningPrompt(patientContext, question, previousQA) {
  const getRelevantReports = (reports, question) => {
    const q = question.toLowerCase()

    const TOPIC_KEYWORDS = {
      fertility: ['amh', 'fsh', 'lh', 'ivf', 'embryo', 'follicle', 'ovarian', 'fertility', 'conception', 'pregnancy', 'ectopic', 'hcg'],
      endometriosis: ['endometriosis', 'endo', 'ca-125', 'ca125', 'laparoscopy', 'luprodex', 'gnrh', 'pelvic', 'mri'],
      thyroid: ['thyroid', 'tsh', 't3', 't4', 'hypothyroid', 'hyperthyroid'],
      infection: ['uti', 'infection', 'pus', 'bacteria', 'urine', 'urinary'],
      blood: ['anemia', 'hemoglobin', 'rbc', 'cbc', 'blood count', 'iron'],
      general: ['appointment', 'doctor', 'visit', 'history', 'summary', 'overview', 'all', 'everything']
    }

    const matchedTopics = Object.entries(TOPIC_KEYWORDS)
      .filter(([topic, keywords]) =>
        keywords.some(kw =>
          q.includes(kw) ||
          reports.some(r =>
            JSON.stringify(r.extracted_values).toLowerCase().includes(kw)
          )
        )
      )
      .map(([topic]) => topic)

    if (matchedTopics.includes('general') || matchedTopics.length === 0) {
      return reports
    }

    const relevant = reports.filter(r => {
      const reportText = JSON.stringify(r.extracted_values).toLowerCase()
      return matchedTopics.some(topic =>
        TOPIC_KEYWORDS[topic].some(kw =>
          reportText.includes(kw)
        )
      )
    })

    return relevant.length > 0 ? relevant : reports
  }

  const systemPrompt = `You are Klaro, a medical reasoning assistant. You help patients think through their health situation using their own medical records as context.

YOUR ROLE
You are a knowledgeable, warm thinking partner — like a well-informed friend who takes medical questions seriously. You are NOT a doctor. You do not diagnose, prescribe, or make medical decisions.

YOUR JOB
Help the user reason through their situation using only the records provided. Always anchor to their specific data — never give generic health information.

RESPONSE STRUCTURE
Always respond in this exact order:

1. RELEVANT HISTORY
What their records show that relates to this question.
Cite every fact using this format: (Report: YYYY-MM-DD, Type: report_type)
Never state a medical fact without a citation.

2. REASONING
Your logical interpretation of the facts. Use "this suggests" not "you should". No advice — only analysis.

3. GAPS
What information is missing that would help answer this better. Name the specific test or report that would help. Be honest when records are insufficient.

4. QUESTIONS FOR YOUR DOCTOR
3-5 specific, actionable questions they can bring to their next appointment. Not generic — grounded in their specific situation.

5. DISCLAIMER
Always last, exact text, never change:
"This reasoning is based on your uploaded records and is not medical advice. Please discuss any decisions with your doctor."

RULES
- Cite every factual claim with format: (Report: YYYY-MM-DD, Type: report_type)
- Never say "you should" or "you must"
- Never give a yes/no answer to a medical decision question
- If records are insufficient say so explicitly and name what is missing
- Never hallucinate values or dates
- Distinguish clearly between what records show vs what you are inferring
- Always be specific to this person's history — never give generic advice

TONE
Warm, clear, specific. Like a knowledgeable friend who takes your question seriously, not a liability-dodging chatbot.

FORMATTING RULES
- Never use markdown formatting
- No asterisks for bold (**text**)
- No asterisks for italic (*text*)
- No bullet points with asterisks (*)
- Use plain numbered lists only
- Use plain hyphens for lists (-)
- Section headings are already handled by the UI — write the content only, not the heading text

CLARIFICATION PROTOCOL
Before giving a full response, assess whether the question has enough context to reason well.

If the question is ambiguous about:
- Which condition is being asked about
- The intent (monitoring vs diagnosis vs treatment planning)
- A recent event not in the records

Then ask ONE focused clarifying question first, before the full response structure.

Format the clarifying question as:

CLARIFICATION NEEDED:
[Your single focused question]

Example:
User asks about CA-125 results.
Records show both endometriosis history and general checkup context.

Klaro asks:
"CLARIFICATION NEEDED:
Is this CA-125 being monitored in the context of endometriosis, or was it flagged for another reason? This will help me focus the reasoning."

Rules for clarification:
- Ask maximum ONE question
- Only ask when genuinely ambiguous
- Do not ask for information already in the records
- After user responds, give the full structured response

MEMORY PROTOCOL
If the user mentions a significant medical event not in their records (surgery, diagnosis, treatment, pregnancy outcome), end your response with:

MEMORY NOTE:
"You mentioned [event]. Would you like me to remember this for future questions? If yes, please confirm and I'll note it in our conversation."`;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const timeContext = (patientContext?.reports || [])
    .filter(r => r.report_date)
    .map(r => {
      const reportDate = new Date(r.report_date);
      const daysAgo = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));
      const weeksAgo = Math.floor(daysAgo / 7);
      const monthsAgo = Math.floor(daysAgo / 30);

      let timeLabel;
      if (daysAgo < 14) {
         timeLabel = `${daysAgo} days ago`;
      } else if (weeksAgo < 8) {
         timeLabel = `${weeksAgo} weeks ago`;
      } else {
         timeLabel = `${monthsAgo} months ago`;
      }

      return `${r.report_date} — ${timeLabel}`;
    })
    .join('\n');

  let userMessage = `TODAY'S DATE: ${todayStr}\n\n`;

  if (timeContext) {
    userMessage += `REPORT TIMELINE — time from today:\n`;
    userMessage += `${timeContext}\n\n`;
    userMessage += `Use these time references when reasoning about recency, sequences, treatment timing, or follow-up gaps. Always calculate durations explicitly using TODAY'S DATE as the anchor.\n\n`;
  }

  userMessage += "PATIENT CONTEXT:\n";
  
  if (patientContext?.person) {
    const p = patientContext.person;
    const age = p.date_of_birth ? 
      Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) 
      : null;
      
    let personLine = `Person: ${p.name || 'Unknown'}`;
    if (age !== null) personLine += `, ${age}`;
    if (p.gender && p.gender !== 'Prefer not to say') personLine += `, ${p.gender}`;
    
    userMessage += personLine + "\n";
    if (p.relationship) userMessage += `Relationship: ${p.relationship}\n`;
  } else {
    userMessage += "Person: Unknown\n";
  }

  userMessage += "\nMEDICAL HISTORY:\n";
  
  const sortedReports = [...(patientContext?.reports || [])].sort((a,b) => {
    return new Date(b.report_date || 0) - new Date(a.report_date || 0);
  });

  const relevantReports = getRelevantReports(sortedReports, question);

  if (relevantReports.length > 0 && relevantReports.length < sortedReports.length) {
    userMessage += `Note: Showing ${relevantReports.length} of ${sortedReports.length} reports most relevant to this question.\n\n`;
  }

  if (relevantReports.length > 0) {
    relevantReports.forEach(r => {
      const dateStr = r.report_date ? new Date(r.report_date).toISOString().split('T')[0] : 'Unknown Date';
      userMessage += `Report: ${dateStr}, Type: ${r.report_type || 'Unknown'}\n`;
      if (r.lab_name) userMessage += `Lab: ${r.lab_name}\n`;
      
      const ext = r.extracted_values || {};
      
      if (ext.lab_values && ext.lab_values.length > 0) {
        ext.lab_values.forEach(lvl => {
          userMessage += `- ${lvl.name || 'Unknown'}: ${lvl.value || ''} ${lvl.unit || ''} `;
          userMessage += `(Reference: ${lvl.reference_range || 'N/A'}) — ${lvl.flag || 'normal'}\n`;
        });
      }
      
      if (ext.findings && ext.findings.length > 0) {
        userMessage += "Findings:\n";
        ext.findings.forEach(f => userMessage += `- ${f}\n`);
      }
      
      if (ext.impression) {
        userMessage += `Impression: ${ext.impression}\n`;
      }
      
      if (ext.medications && ext.medications.length > 0) {
         userMessage += "Medications:\n";
         ext.medications.forEach(m => {
           const parts = [m.name, m.dose, m.frequency].filter(Boolean);
           userMessage += `- ${parts.join(' ')}\n`;
         });
      }
      userMessage += "\n";
    });
  } else {
    userMessage += "No medical reports available.\n\n";
  }

  if (previousQA && previousQA.length > 0) {
    userMessage += "PREVIOUS QUESTIONS IN THIS SESSION:\n";
    previousQA.forEach(qa => {
       userMessage += `Q: ${qa.question}\n`;
       userMessage += `A: ${qa.answer.substring(0, 200)}...\n\n`;
    });
  }

  userMessage += `CURRENT QUESTION:\n${question}\n`;

  return {
    systemPrompt,
    userMessage
  };
}
