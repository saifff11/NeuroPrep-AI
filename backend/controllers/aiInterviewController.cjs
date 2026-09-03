// Md Saif Ali - AI Interview Controller with Ollama Support
const aiProvider = require('../services/aiProviderService.cjs');
const { saveAiInterviewReport } = require('../services/historyService.cjs');

/**
 * Generate text using the configured AI service (Ollama or Gemini)
 */
async function generateAIResponse(prompt, options = {}) {
  const result = await aiProvider.generateText(prompt, options);
  console.log(`AI generation completed via ${result.source}${result.fallbackUsed ? ' (fallback)' : ''}`);
  return result;
}

// Generate interview questions based on role and difficulty
exports.generateInterviewQuestions = async (req, res) => {
  try {
    const { role, difficulty, count = 10 } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    const prompt = `Generate ${count} interview questions for a ${role} position at ${difficulty} difficulty level.

For each question, provide:
1. The question text
2. Category (e.g., Technical, Behavioral, Problem-Solving, etc.)
3. Expected key points in the answer (3-5 points)

Format as JSON array:
[
  {
    "question": "Question text here",
    "category": "Category name",
    "expectedPoints": ["point1", "point2", "point3"]
  }
]

Make questions:
- Relevant to ${role} role
- Appropriate for ${difficulty} level (easy = basic concepts, medium = practical experience, hard = advanced scenarios)
- Mix of technical and behavioral questions
- Progressive difficulty
- Professional and clear

Return ONLY the JSON array, no markdown formatting.`;

    const aiResult = await generateAIResponse(prompt, {
      temperature: 0.8,
      maxTokens: 3000
    });
    const responseText = aiResult.text;

    // Parse the response
    const questions = aiProvider.parseJsonResponse(responseText);

    return res.json({
      success: true,
      questions: questions,
      count: questions.length,
      source: aiResult.source
    });

  } catch (error) {
    console.error('Error generating interview questions:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate questions',
      message: error.message
    });
  }
};

// Evaluate user's answer to a question
exports.evaluateAnswer = async (req, res) => {
  try {
    const { question, answer, expectedPoints = [] } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, error: 'Question and answer are required' });
    }

    const prompt = `You are an experienced HR interviewer. Evaluate this interview answer:

Question: ${question}

Candidate's Answer: ${answer}

Expected Key Points: ${expectedPoints.join(', ')}

Provide:
1. Score (0-10)
2. Strengths (what was good)
3. Areas for improvement
4. Brief feedback (2-3 sentences)

Format as JSON:
{
  "score": 7,
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"],
  "feedback": "Brief feedback text"
}

Return ONLY the JSON object, no markdown formatting.`;

    const aiResult = await generateAIResponse(prompt, {
      temperature: 0.5,
      maxTokens: 1500
    });
    const responseText = aiResult.text;

    const evaluation = aiProvider.parseJsonResponse(responseText);

    return res.json({
      success: true,
      feedback: evaluation,
      source: aiResult.source
    });

  } catch (error) {
    console.error('Error evaluating answer:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to evaluate answer',
      message: error.message
    });
  }
};

// Generate final interview report
exports.generateInterviewReport = async (req, res) => {
  try {
    const { userId, role, difficulty, answers, duration, sessionId } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'Answers array is required' });
    }

    const prompt = `Generate a comprehensive interview performance report for a ${role} interview.

Interview Duration: ${duration} minutes
Number of Questions: ${answers.length}

Answers:
${answers.map((a, i) => `
Q${i + 1} (${a.category}): ${a.question}
Answer: ${a.answer}
`).join('\n')}

Provide:
1. Overall Score (0-10)
2. Category-wise breakdown with scores
3. Strengths (3-5 points)
4. Areas for improvement (3-5 points)
5. Recommendations for growth
6. Overall feedback summary

Format as JSON:
{
  "overallScore": 7.5,
  "breakdown": [
    {"category": "Technical", "score": 8},
    {"category": "Behavioral", "score": 7}
  ],
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"],
  "recommendations": ["rec1", "rec2"],
  "summary": "Overall feedback summary"
}

Return ONLY the JSON object, no markdown formatting.`;

    const aiResult = await generateAIResponse(prompt, {
      temperature: 0.6,
      maxTokens: 3000
    });
    const responseText = aiResult.text;

    const report = aiProvider.parseJsonResponse(responseText);

    let savedSession = null;
    try {
      savedSession = await saveAiInterviewReport({
        userId,
        role,
        difficulty,
        answers,
        duration,
        report,
        source: aiResult.source,
        sessionId
      });
      console.log('AI interview report saved to analytics history:', savedSession.sessionId);
    } catch (saveError) {
      console.error('Failed to save AI interview report (non-blocking):', saveError.message);
    }

    return res.json({
      success: true,
      report: report,
      sessionId: savedSession?.sessionId || sessionId || null,
      persisted: Boolean(savedSession),
      source: aiResult.source
    });

  } catch (error) {
    console.error('Error generating report:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
};

// Health check endpoint for Ollama integration
exports.checkOllamaHealth = async (req, res) => {
  try {
    const health = await aiProvider.checkHealth();
    
    return res.json({
      success: true,
      ollama: health.providers.ollama,
      config: {
        primaryProvider: health.primaryProvider,
        providerSequence: health.providerSequence,
        geminiConfigured: health.providers.gemini.configured,
        groqConfigured: health.providers.groq.configured
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
