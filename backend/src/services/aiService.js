import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Build a structured prompt that forces the LLM to return JSON only
 */
export const buildPrompt = (assignment) => {
  const {
    title,
    subject,
    grade,
    questionTypes,
    numberOfQuestions,
    totalMarks,
    additionalInstructions,
  } = assignment;

  const marksPerQuestion = Math.floor(totalMarks / numberOfQuestions);

  const questionTypeInstructions = {
    'mcq': 'Multiple Choice Questions with 4 options labeled A, B, C, D. Include an "options" array with 4 strings.',
    'short-answer': 'Short answer questions requiring 2-3 sentence answers.',
    'long-answer': 'Long answer / essay questions requiring detailed explanations.',
    'true-false': 'True or False questions with clear statements.',
    'fill-in-the-blanks': 'Fill in the blank questions with a single missing word or phrase.',
  };

  const typeDescriptions = questionTypes
    .map((t) => questionTypeInstructions[t] || t)
    .join('\n- ');

  const totalSections = Math.min(questionTypes.length, 3);
  const questionsPerSection = Math.ceil(numberOfQuestions / totalSections);

  return `You are an expert educational question paper creator for school teachers.
Your task is to generate a structured question paper.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object. No markdown, no explanations, no code fences.
2. The JSON must strictly follow this schema.
3. Distribute ${numberOfQuestions} questions across sections based on question types.
4. Each question gets ${marksPerQuestion} marks (adjust last section to reach total of ${totalMarks} marks).
5. Assign difficulty: first 40% = easy, middle 40% = medium, last 20% = hard.

Assignment Details:
- Title: ${title}
- Subject: ${subject}
- Grade/Class: ${grade}
- Total Questions: ${numberOfQuestions}
- Total Marks: ${totalMarks}
- Question Types:
  - ${typeDescriptions}
${additionalInstructions ? `- Special Instructions: ${additionalInstructions}` : ''}

Required JSON Schema:
{
  "paperTitle": "${subject} Question Paper",
  "subject": "${subject}",
  "grade": "${grade}",
  "totalMarks": ${totalMarks},
  "timeAllowed": "3 Hours",
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries equal marks.",
      "questionType": "mcq",
      "questions": [
        {
          "question": "Full question text here",
          "difficulty": "easy",
          "marks": ${marksPerQuestion},
          "type": "mcq",
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }
      ]
    }
  ]
}

Generate the complete question paper now for ${subject} Grade ${grade} with exactly ${numberOfQuestions} questions totaling ${totalMarks} marks:`;
};

/**
 * Call Google Gemini API with a structured prompt
 */
export const callLLM = async (prompt) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

/**
 * Parse and validate the LLM response into structured JSON
 * Handles markdown code fences and malformed output
 */
export const parseResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or invalid response from LLM');
  }

  let cleanText = rawText.trim();

  // Remove markdown code fences if present
  cleanText = cleanText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  // Try to extract JSON object from anywhere in the text
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in LLM response');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Invalid JSON from LLM: ${e.message}`);
  }

  // Validate required structure
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Response missing "sections" array');
  }

  if (parsed.sections.length === 0) {
    throw new Error('Response has empty sections array');
  }

  // Sanitize and normalize each section
  const sanitized = {
    paperTitle: sanitizeString(parsed.paperTitle || 'Question Paper'),
    subject: sanitizeString(parsed.subject || ''),
    grade: sanitizeString(parsed.grade || ''),
    totalMarks: parseInt(parsed.totalMarks) || 0,
    timeAllowed: sanitizeString(parsed.timeAllowed || '3 Hours'),
    sections: parsed.sections.map((section, sIdx) => {
      if (!section.questions || !Array.isArray(section.questions)) {
        throw new Error(`Section ${sIdx + 1} missing questions array`);
      }
      return {
        title: sanitizeString(section.title || `Section ${String.fromCharCode(65 + sIdx)}`),
        instruction: sanitizeString(section.instruction || 'Attempt all questions.'),
        questionType: sanitizeString(section.questionType || 'short-answer'),
        questions: section.questions.map((q, qIdx) => {
          if (!q.question || typeof q.question !== 'string') {
            throw new Error(`Invalid question at section ${sIdx + 1}, index ${qIdx}`);
          }
          return {
            question: sanitizeString(q.question),
            difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
            marks: Math.max(1, parseInt(q.marks) || 1),
            type: sanitizeString(q.type || 'short-answer'),
            options: Array.isArray(q.options) ? q.options.map(sanitizeString) : [],
          };
        }),
      };
    }),
  };

  return sanitized;
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return String(str || '');
  return str.trim().replace(/<[^>]*>/g, ''); // Strip HTML tags
};
