const aiProvider = require('../services/aiProviderService.cjs');

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000;

function cleanJsonResponse(text) {
  return String(text || '')
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

function getRetryAfter(error) {
  return error.retryAfter || error.upstreamBody?.retry_after || null;
}

function getAiErrorStatus(error) {
  return error.status === 429 || String(error.message || '').includes('429')
    ? 429
    : 500;
}

function sendAiError(res, error, fallbackMessage) {
  const retryAfter = getRetryAfter(error);
  if (retryAfter) res.set('Retry-After', String(retryAfter));

  return res.status(getAiErrorStatus(error)).json({
    success: false,
    error: fallbackMessage,
    details: error.message,
    retryAfter: retryAfter || null,
    upstreamBody: error.upstreamBody || null
  });
}

function createRequestId() {
  return Date.now() + Math.random().toString(36).slice(2, 11);
}

function buildMcqPrompt(topic, difficulty, count, sessionId) {
  const difficultySpecs = {
    easy: {
      instruction: 'Focus on basic concepts, fundamental terminology, and simple applications',
      questionTypes: 'definition questions, basic syntax, simple true/false concepts',
      complexity: 'straightforward with clear answers'
    },
    medium: {
      instruction: 'Include practical applications, scenario-based questions, and moderate problem-solving',
      questionTypes: 'code analysis, best practices, debugging scenarios, design patterns',
      complexity: 'requiring some analysis and understanding of intermediate concepts'
    },
    hard: {
      instruction: 'Advanced concepts, complex scenarios, optimization problems, and expert-level knowledge',
      questionTypes: 'system design decisions, performance optimization, security considerations, advanced algorithms',
      complexity: 'requiring deep understanding and critical thinking'
    }
  };

  const topicInstructions = {
    'Software Developer': 'software development principles, coding standards, development methodologies, and programming best practices',
    JavaScript: 'JavaScript language features, ES6+, async programming, DOM manipulation, and modern frameworks',
    Python: 'Python syntax, data structures, libraries, object-oriented programming, and Pythonic idioms',
    React: 'React components, hooks, state management, lifecycle methods, and modern React patterns',
    'Node.js': 'Node.js runtime, npm, Express.js, asynchronous programming, and backend development',
    Java: 'Java syntax, OOP concepts, collections framework, multithreading, and JVM internals',
    Algorithms: 'algorithm design, complexity analysis, sorting, searching, and optimization techniques',
    'System Design': 'scalability, distributed systems, databases, caching, and architectural patterns',
    'Cybersecurity Specialist': 'security principles, threat analysis, encryption, network security, and vulnerability assessment',
    'Data Scientist': 'statistical analysis, machine learning algorithms, data preprocessing, and model evaluation',
    'DevOps Engineer': 'CI/CD pipelines, containerization, infrastructure as code, monitoring, and deployment strategies'
  };

  const spec = difficultySpecs[difficulty] || difficultySpecs.medium;
  const topicInfo = topicInstructions[topic] || `${topic} concepts and applications`;

  return `Generate exactly ${count} COMPLETELY UNIQUE and FRESH multiple choice questions about ${topicInfo} at ${difficulty} difficulty level.

SESSION: ${sessionId} - GENERATE BRAND NEW QUESTIONS (NOT SEEN BEFORE)
TIMESTAMP: ${new Date().toISOString()}

ANTI-REPETITION REQUIREMENTS:
- Each question must be 100% different from any previously generated questions
- Use creative, varied question patterns and structures
- Cover different subtopics within ${topic}
- Include diverse question types: conceptual, practical, scenario-based, code-analysis
- Randomize question complexity within ${difficulty} level
- Use different vocabulary and phrasing styles

DIFFICULTY REQUIREMENTS (${difficulty.toUpperCase()}):
- ${spec.instruction}
- Question types: ${spec.questionTypes}
- Complexity: ${spec.complexity}

CONTENT VARIETY REQUIREMENTS:
- Mix theoretical knowledge with practical application
- Include current best practices and modern approaches
- Add real-world scenarios and problem-solving
- Test understanding from multiple angles
- Ensure questions are professionally relevant and educational

RANDOMIZATION SEEDS:
- Time: ${Date.now()}
- Random: ${Math.random()}
- Hash: ${sessionId}

Return ONLY a JSON array with exactly ${count} questions in this exact format:
[
  {
    "question": "Your unique question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the correct answer and why other options are incorrect"
  }
]

CRITICAL REQUIREMENTS:
- Array must contain exactly ${count} questions
- Questions must be unique and non-repetitive
- Appropriate ${difficulty} difficulty level
- Educational and interview-focused content
- No markdown formatting, just pure JSON array
- Each question should test different knowledge areas within ${topic}`;
}

function normalizeQuestionCount(questions, count) {
  const targetCount = parseInt(count, 10);
  if (!Array.isArray(questions)) {
    throw new Error('Response is not an array');
  }

  if (questions.length === 0) return questions;

  while (questions.length < targetCount) {
    const baseQuestion = questions[questions.length % questions.length];
    questions.push({
      ...baseQuestion,
      question: `${baseQuestion.question} (Variant ${questions.length + 1})`
    });
  }

  if (questions.length > targetCount) {
    questions.splice(targetCount);
  }

  return questions;
}

function buildCodingPrompt(topic, difficulty, language, sessionId) {
  const difficultySpecs = {
    easy: {
      instruction: 'Simple logic, basic algorithms, straightforward implementation',
      complexity: 'O(n) or O(n log n) solutions, simple data structures',
      testCases: '3-4 test cases with clear patterns'
    },
    medium: {
      instruction: 'Moderate algorithmic thinking, multiple approaches possible, some optimization required',
      complexity: 'may require dynamic programming, trees, or graphs, O(n^2) acceptable',
      testCases: '4-5 test cases including edge cases'
    },
    hard: {
      instruction: 'Complex algorithms, advanced data structures, optimal solutions required',
      complexity: 'advanced algorithms, complex optimization, handling of large inputs',
      testCases: '5-6 test cases with challenging edge cases and performance considerations'
    }
  };

  const topicSpecs = {
    sorting: 'sorting algorithms implementation, comparison-based sorting, stability analysis',
    searching: 'binary search variations, search in rotated arrays, finding elements with constraints',
    arrays: 'array manipulation, subarray problems, two pointers, sliding window techniques',
    'linked-lists': 'linked list operations, cycle detection, merging, reversing chains',
    trees: 'binary tree traversals, BST operations, tree construction and validation',
    graphs: 'graph traversal (BFS/DFS), shortest path, connectivity, cycle detection',
    'dynamic-programming': 'memoization, tabulation, optimization problems, overlapping subproblems',
    strings: 'string manipulation, pattern matching, substring problems, character frequency',
    'stacks-queues': 'stack/queue operations, expression evaluation, monotonic structures',
    heaps: 'heap operations, priority queues, k-largest/smallest problems',
    algorithms: 'general algorithmic problem solving with various data structures',
    javascript: 'JavaScript-specific programming challenges with modern ES6+ features',
    python: 'Python programming problems utilizing Python-specific libraries and idioms',
    'system-design': 'design scalable systems, API design, database schema problems'
  };

  const spec = difficultySpecs[difficulty] || difficultySpecs.medium;
  const topicSpec = topicSpecs[topic] || `${topic} related programming challenges`;

  return `Generate a unique, non-repetitive coding problem about ${topicSpec} at ${difficulty} difficulty level for ${language}.
Session ID: ${sessionId} (ensure uniqueness across requests)

DIFFICULTY REQUIREMENTS (${difficulty.toUpperCase()}):
- ${spec.instruction}
- Complexity: ${spec.complexity}
- Test cases: ${spec.testCases}

PROBLEM REQUIREMENTS:
- Must be interview-relevant and educational
- Include real-world application context
- Should test core ${topic} concepts
- Appropriate for ${language} programming language
- Include comprehensive examples and edge cases
- Problem should be fresh and not commonly repeated

Return ONLY a JSON object with this exact format:
{
  "title": "Descriptive Problem Title",
  "description": "Detailed problem description with context, examples, and what needs to be solved",
  "inputFormat": "Clear input format specification",
  "outputFormat": "Clear output format specification",
  "constraints": "Input size limits, value ranges, and performance expectations",
  "examples": "2-3 detailed input/output examples with step-by-step explanations",
  "testCases": [
    {"input": "test input 1", "output": "expected output 1"},
    {"input": "test input 2", "output": "expected output 2"},
    {"input": "test input 3", "output": "expected output 3"}
  ],
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "hints": "2-3 helpful hints for solving the problem"
}

CRITICAL REQUIREMENTS:
- Problem must be unique and engaging
- Appropriate ${difficulty} difficulty level
- Test ${topic} specific knowledge and skills
- Include comprehensive test cases covering edge cases
- No markdown formatting, just pure JSON object
- Must be solvable in ${language}`;
}

function buildAssessmentPrompt(payload) {
  const {
    interviewType,
    topic,
    difficulty,
    duration,
    interviewData,
    userResponses,
    interviewQuestions
  } = payload;

  return `Conduct a comprehensive interview assessment for a ${interviewType} interview on ${topic} at ${difficulty} level.

INTERVIEW DETAILS:
- Duration: ${duration} minutes
- Topic: ${topic}
- Difficulty: ${difficulty}
- Type: ${interviewType}

QUESTIONS ASKED:
${interviewQuestions?.map((q, i) => `${i + 1}. ${q}`).join('\n') || 'Questions not provided'}

USER RESPONSES:
${userResponses?.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'Responses not provided'}

ADDITIONAL CONTEXT:
${JSON.stringify(interviewData, null, 2)}

Please provide a detailed assessment in the following JSON format:
{
  "overallRating": 4.2,
  "detailedScores": {
    "technicalKnowledge": 4.0,
    "problemSolving": 4.5,
    "communication": 3.8,
    "codeQuality": 4.1,
    "systemDesign": 3.9
  },
  "strengths": [
    "Strong understanding of core concepts",
    "Good problem-solving approach",
    "Clear communication style"
  ],
  "improvements": [
    "Could improve on edge case handling",
    "Need more practice with system design concepts",
    "Consider discussing time complexity more"
  ],
  "recommendations": [
    "Practice more system design problems",
    "Focus on optimizing algorithm solutions",
    "Work on explaining thought process step by step"
  ],
  "performanceInsights": {
    "responseTime": "Good - answered most questions promptly",
    "depthOfKnowledge": "Solid understanding with room for advanced concepts",
    "practicalApplication": "Can apply concepts well to real-world scenarios"
  },
  "nextSteps": [
    "Practice advanced data structures",
    "Study system design patterns",
    "Mock interview practice recommended"
  ],
  "interviewReadiness": "75% - Good foundation, needs refinement in advanced areas"
}

ASSESSMENT CRITERIA:
- Technical accuracy and depth of knowledge
- Problem-solving methodology and approach
- Communication clarity and structure
- Code quality and best practices (if applicable)
- Ability to handle follow-up questions
- Overall interview presence and confidence

Provide constructive, actionable feedback that helps the candidate improve their interview performance.`;
}

function buildCodeAnalysisPrompt({ code, language, problem, errors }) {
  return `You are an expert code reviewer and debugging assistant. Analyze the following code and provide comprehensive feedback.

CODE TO ANALYZE:
\`\`\`${language}
${code}
\`\`\`

PROBLEM CONTEXT:
${problem || 'General code analysis'}

CURRENT ERRORS (if any):
${errors || 'No specific errors reported'}

Please provide a detailed analysis in the following JSON format:
{
  "syntaxErrors": [
    {
      "line": 5,
      "error": "Missing semicolon",
      "severity": "high",
      "fix": "Add semicolon at end of line"
    }
  ],
  "logicIssues": [
    {
      "issue": "Infinite loop detected",
      "location": "lines 10-15",
      "explanation": "Loop condition never becomes false",
      "suggestion": "Add proper exit condition"
    }
  ],
  "improvements": [
    {
      "type": "performance",
      "description": "Use more efficient algorithm",
      "current": "O(n^2) complexity",
      "suggested": "O(n log n) with sorting"
    },
    {
      "type": "readability",
      "description": "Add meaningful variable names",
      "example": "Change 'x' to 'userCount'"
    }
  ],
  "correctedCode": "// Provide the corrected version of the code here",
  "testCases": [
    {
      "input": "example input",
      "expectedOutput": "example output",
      "explanation": "Why this test case is important"
    }
  ],
  "bestPractices": [
    "Add input validation",
    "Include error handling",
    "Use consistent formatting"
  ],
  "codeQuality": {
    "score": 7.5,
    "strengths": ["Good algorithm choice", "Clear structure"],
    "weaknesses": ["Poor variable naming", "Missing comments"]
  }
}

ANALYSIS GUIDELINES:
- Focus on ${language} specific best practices
- Provide actionable, specific suggestions
- Include corrected code if major issues found
- Explain the reasoning behind each suggestion
- Consider performance, readability, and maintainability`;
}

async function generateMcqQuestions(req, res) {
  const { topic = 'JavaScript', difficulty = 'medium', count = 5 } = req.body;
  const sessionId = createRequestId();

  console.log('MCQ request:', { topic, difficulty, count, sessionId });

  try {
    const aiResult = await aiProvider.generateText(
      buildMcqPrompt(topic, difficulty, count, sessionId),
      {
        temperature: 0.7,
        maxTokens: 4000,
        format: 'json',
        timeout: REQUEST_TIMEOUT
      }
    );

    if (!aiResult.text) {
      throw new Error('No response from AI provider');
    }

    const questions = normalizeQuestionCount(
      JSON.parse(cleanJsonResponse(aiResult.text)),
      count
    );

    return res.json({
      success: true,
      questions,
      metadata: {
        topic,
        difficulty,
        count: questions.length,
        source: aiResult.source,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('MCQ generation failed:', error.message);
    return sendAiError(res, error, 'Failed to generate MCQ questions');
  }
}

async function generateCodingProblem(req, res) {
  const {
    topic = 'algorithms',
    difficulty = 'medium',
    language = 'javascript'
  } = req.body;
  const sessionId = Date.now();

  console.log('Coding problem request:', { topic, difficulty, language, sessionId });

  try {
    const aiResult = await aiProvider.generateText(
      buildCodingPrompt(topic, difficulty, language, sessionId),
      {
        temperature: 0.7,
        maxTokens: 4000,
        format: 'json',
        timeout: REQUEST_TIMEOUT
      }
    );

    if (!aiResult.text) {
      throw new Error('No response from AI provider');
    }

    const problem = JSON.parse(cleanJsonResponse(aiResult.text));

    return res.json({
      success: true,
      problem,
      metadata: {
        topic,
        difficulty,
        language,
        source: aiResult.source,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Coding problem generation failed:', error.message);
    return sendAiError(res, error, 'Failed to generate coding problem');
  }
}

async function assessInterview(req, res) {
  const {
    userId,
    interviewType,
    topic,
    difficulty,
    duration
  } = req.body;

  console.log('Interview assessment request:', { userId, interviewType, topic });

  try {
    const aiResult = await aiProvider.generateText(
      buildAssessmentPrompt(req.body),
      {
        temperature: 0.7,
        maxTokens: 4000,
        format: 'json',
        timeout: REQUEST_TIMEOUT
      }
    );

    if (!aiResult.text) {
      throw new Error('No assessment response from AI provider');
    }

    const assessment = JSON.parse(cleanJsonResponse(aiResult.text));
    const sessionData = {
      userId,
      type: 'interview',
      interviewType,
      topic,
      difficulty,
      duration,
      assessment,
      timestamp: new Date(),
      sessionId: Date.now()
    };

    return res.json({
      success: true,
      assessment,
      sessionData,
      message: 'Interview assessment completed successfully'
    });
  } catch (error) {
    console.error('Interview assessment failed:', error.message);
    return sendAiError(res, error, 'Failed to assess interview');
  }
}

async function analyzeCode(req, res) {
  const { language } = req.body;
  const sessionId = createRequestId();

  console.log('Code analysis request:', { language, sessionId });

  try {
    const aiResult = await aiProvider.generateText(
      buildCodeAnalysisPrompt(req.body),
      {
        temperature: 0.7,
        maxTokens: 4000,
        format: 'json',
        timeout: REQUEST_TIMEOUT
      }
    );

    if (!aiResult.text) {
      throw new Error('No analysis response from AI provider');
    }

    const analysis = JSON.parse(cleanJsonResponse(aiResult.text));

    return res.json({
      success: true,
      analysis,
      metadata: {
        language,
        sessionId,
        analyzedAt: new Date().toISOString(),
        source: aiResult.source
      }
    });
  } catch (error) {
    console.error('Code analysis failed:', error.message);
    return sendAiError(res, error, 'Failed to analyze code');
  }
}

module.exports = {
  analyzeCode,
  assessInterview,
  buildAssessmentPrompt,
  buildCodeAnalysisPrompt,
  buildCodingPrompt,
  buildMcqPrompt,
  cleanJsonResponse,
  generateCodingProblem,
  generateMcqQuestions,
  normalizeQuestionCount
};
