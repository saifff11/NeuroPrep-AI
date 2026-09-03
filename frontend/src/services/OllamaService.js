// OLLAMA SERVICE - Simple Frontend API for Ollama Backend
// Uses the Cloudflare tunnel endpoint configured in backend
// Md Saif Ali - 

const API_BASE_ROOT =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://neuroprepai-backend.onrender.com' : 'http://localhost:5000');
const API_BASE_URL = API_BASE_ROOT.endsWith('/api') ? API_BASE_ROOT : `${API_BASE_ROOT}/api`;

class OllamaService {
  static getHistoryKey(topic, difficulty) {
    return `neuroprep_recent_mcq_${String(topic || '').toLowerCase()}_${String(difficulty || '').toLowerCase()}`;
  }

  static getRecentQuestions(topic, difficulty) {
    try {
      const raw = localStorage.getItem(this.getHistoryKey(topic, difficulty));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(-25) : [];
    } catch (error) {
      return [];
    }
  }

  static rememberQuestions(topic, difficulty, questions = []) {
    try {
      const existing = this.getRecentQuestions(topic, difficulty);
      const next = [
        ...existing,
        ...questions.map(q => q.question).filter(Boolean)
      ].slice(-40);
      localStorage.setItem(this.getHistoryKey(topic, difficulty), JSON.stringify(next));
    } catch (error) {
      console.warn('Unable to store MCQ question history:', error.message);
    }
  }

  /**
   * Generate MCQ questions using Ollama backend
   * @param {string} topic - Topic for questions
   * @param {string} difficulty - 'easy', 'medium', 'hard'
   * @param {number} count - Number of questions
   * @param {Object} context - Optional practice route context
   * @returns {Promise<Object>} Generated questions
   */
  static async getMCQQuestions(topic, difficulty = 'medium', count = 5, context = {}) {
    console.log('🎯 OllamaService: Generating MCQ Questions');
    console.log(`📚 Topic: ${topic}, Difficulty: ${difficulty}, Count: ${count}`);
    console.log(`🌐 Endpoint: ${API_BASE_URL}/ollama/generate-mcq`);

    try {
      const variationSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const excludeQuestions = this.getRecentQuestions(topic, difficulty);

      const response = await fetch(`${API_BASE_URL}/ollama/generate-mcq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          count,
          variationSeed,
          excludeQuestions,
          context
        }),
        timeout: 60000
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || data.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && Array.isArray(data.questions)) {
        this.rememberQuestions(topic, difficulty, data.questions);
        console.log('✅ MCQ Questions Generated:', data.questions.length);
        return {
          success: true,
          questions: data.questions,
          source: data.source || data.metadata?.source || 'ai-backend'
        };
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('❌ MCQ Generation Error:', error.message);
      
      // Use fallback questions
      const fallbackQuestions = this.getFallbackMCQs(topic, count);
      this.rememberQuestions(topic, difficulty, fallbackQuestions);
      return {
        success: true,
        fallback: true,
        warning: error.message,
        questions: fallbackQuestions,
        source: 'offline-fallback'
      };
    }
  }

  /**
   * Health check for Ollama backend
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/ollama/health`);
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  /**
   * Simple fallback MCQ questions
   */
  static getFallbackMCQs(topic, count = 5) {
    const templates = [
      {
        question: `In a ${topic} interview, which answer best shows practical understanding?`,
        correct: 'Explaining the concept and tying it to a realistic use case',
        explanation: `Strong ${topic} answers connect theory with practical situations.`
      },
      {
        question: `When debugging a ${topic} issue, what should be checked first?`,
        correct: 'Reproduce the issue and identify the smallest failing case',
        explanation: `A small reproducible case makes ${topic} debugging more reliable.`
      },
      {
        question: `Which habit most improves long-term quality in ${topic} work?`,
        correct: 'Reviewing assumptions, tests, and edge cases before finalizing',
        explanation: `Quality in ${topic} comes from validating behavior, not only writing an answer.`
      },
      {
        question: `What makes a ${topic} solution interview-ready?`,
        correct: 'Clear reasoning, tradeoffs, correctness, and concise communication',
        explanation: `Interviewers look for reasoning and communication along with correctness.`
      },
      {
        question: `Which mistake should be avoided when answering ${topic} questions?`,
        correct: 'Giving memorized definitions without explaining when they apply',
        explanation: `Applied understanding is stronger than memorized wording.`
      },
      {
        question: `For a medium-level ${topic} problem, what is the best next step after proposing a solution?`,
        correct: 'Discuss complexity, edge cases, and possible improvements',
        explanation: `A complete answer covers correctness, limits, and refinement.`
      },
      {
        question: `Which signal suggests a candidate understands ${topic} deeply?`,
        correct: 'They can compare alternatives and justify a choice',
        explanation: `Comparing alternatives shows depth and decision-making skill.`
      }
    ];

    const distractors = [
      'Jumping directly to the final answer without reasoning',
      'Using the most complex approach by default',
      'Ignoring constraints and edge cases',
      'Repeating only a textbook definition',
      'Assuming every problem has the same solution pattern',
      'Skipping validation because the idea sounds correct',
      'Optimizing before confirming correctness',
      'Focusing only on syntax instead of behavior'
    ];

    const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffle(templates);
    const questions = [];

    for (let i = 0; i < count; i++) {
      const template = selectedTemplates[i % selectedTemplates.length];
      const options = shuffle([
        template.correct,
        ...shuffle(distractors.filter(option => option !== template.correct)).slice(0, 3)
      ]);

      questions.push({
        question: template.question,
        options,
        correctAnswer: options.indexOf(template.correct),
        explanation: template.explanation
      });
    }

    return questions;
  }

  /**
   * Store question answer in backend
   */
  static async storeQuestionAnswer(sessionId, userId, questionData, userAnswer, isCorrect) {
    try {
      const response = await fetch(`${API_BASE_URL}/interview/store-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          questionData,
          userAnswer,
          isCorrect
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to store Q&A:', error);
      return { success: false, error: error.message };
    }
  }
}

export default OllamaService;
