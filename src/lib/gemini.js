import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildExtractionPrompt } from '../prompts/extraction'
import { buildReasoningPrompt } from '../prompts/reasoning'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

export const extractionModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })
export const reasoningModel = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" })

export async function extractReportFromPDF(file) {
  console.log('API key present:', !!import.meta.env.VITE_GEMINI_API_KEY)
  
  try {
    const base64String = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    console.log('Starting extraction...')
    console.log('File size:', file.size)
    console.log('File type:', file.type)

    const prompt = buildExtractionPrompt();
    const result = await extractionModel.generateContent([
      prompt,
      {
        inlineData: {
          data: base64String,
          mimeType: "application/pdf"
        }
      }
    ]);

    const text = result.response.text();
    console.log('Raw Gemini response:', text)
    
    // Clean out markdown fences in case Gemini includes them
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error('Extraction error:', error.message)
    console.error('Full error:', error)
    
    return {
      extraction_confidence: "low",
      extraction_failed: true,
      confidence_reason: "JSON parse failed: " + error.message
    }
  }
}

export async function askQuestion(
  question,
  personId,
  allReports,
  allPeople,
  previousQA = []
) {
  const person = personId
    ? allPeople.find(p => p.id === personId)
    : null

  const relevantReports = personId
    ? allReports.filter(
        r => r.patient_id === personId)
    : allReports

  const sortedReports = [...relevantReports]
    .sort((a, b) =>
      new Date(b.report_date || 0) -
      new Date(a.report_date || 0)
    )

  const patientContext = {
    person: person || null,
    reports: sortedReports,
    previousQA: previousQA
  }

  const { systemPrompt, userMessage } =
    buildReasoningPrompt(
      patientContext,
      question,
      previousQA
    )

  const result = await reasoningModel
    .generateContentStream({
      systemInstruction: systemPrompt,
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }]
    })

  return result.stream
}

export async function askQuestionSimple(
  question,
  personId,
  allReports,
  allPeople,
  previousQA = []
) {
  const person = personId
    ? allPeople.find(p => p.id === personId)
    : null

  const relevantReports = personId
    ? allReports.filter(
        r => r.patient_id === personId)
    : allReports

  const sortedReports = [...relevantReports]
    .sort((a, b) =>
      new Date(b.report_date || 0) -
      new Date(a.report_date || 0)
    )

  const patientContext = {
    person: person || null,
    reports: sortedReports,
    previousQA: previousQA
  }

  const { systemPrompt, userMessage } =
    buildReasoningPrompt(
      patientContext,
      question,
      previousQA
    )

  const result = await reasoningModel
    .generateContent({
      systemInstruction: systemPrompt,
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }]
    })

  return result.response.text()
}
