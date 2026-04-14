export const EMPTY_STATES = {
  NO_REPORTS: "No reports yet. Upload your first report to start building your medical timeline.",
  NO_FILTER_RESULTS: "No reports match this filter. Try changing the date range or report type.",
  NO_REPORTS_FOR_QUESTION: "Add a few reports first so I have your history to work with.",
  NO_USER_NOTES: "No notes yet. Add your own observations about this report."
};

export const ERROR_STATES = {
  UPLOAD_FAILED: "Upload failed. Please check your connection and try again.",
  EXTRACTION_FAILED: "We couldn't read this report. You can add details manually instead.",
  FILE_TOO_LARGE: "This file is too large (max 10MB). Try compressing it or uploading pages separately.",
  WRONG_FILE_TYPE: "Only PDF files are supported right now.",
  SAVE_FAILED: "Couldn't save your report. Please try again.",
  AI_FAILED: "Couldn't process your question right now. Try again in a moment."
};
