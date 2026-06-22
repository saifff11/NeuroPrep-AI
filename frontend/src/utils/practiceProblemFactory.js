export const toTitleCase = (value = '') => String(value)
  .replace(/[-_]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (char) => char.toUpperCase());

export const normalizeTopic = (topic) => {
  if (!topic) return '';
  if (typeof topic === 'string') return topic;
  return topic.name || topic.value || topic.label || '';
};

const slugify = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '') || 'practice-topic';

const topicIncludes = (topic, words) => {
  const normalized = String(topic || '').toLowerCase();
  return words.some((word) => normalized.includes(word));
};

const withMeta = (topic, difficulty, problem) => ({
  id: `practice-${slugify(topic)}-${slugify(problem.title)}`,
  difficulty,
  __meta: {
    source: 'neuroprep-practice',
    topic,
  },
  ...problem,
});

export const createPracticeProblem = (topic, difficulty = 'medium', context = {}) => {
  const label = toTitleCase(topic || 'Algorithms');
  const contextLine = context.trackTitle
    ? `This challenge is tuned for ${context.trackTitle}${context.roundLabel ? ` - ${context.roundLabel}` : ''}.`
    : 'This challenge is tuned for focused NeuroPrep practice.';

  if (topicIncludes(topic, ['dsa', 'algorithm', 'array', 'string', 'hashing', 'sorting'])) {
    return withMeta(topic, difficulty, {
      title: `${label} Pair Sum Challenge`,
      description: [
        contextLine,
        '',
        'Given an array of integers and a target value, find the first pair of positions whose values add up to the target.',
        '',
        'Input format:',
        'The first line contains n and target.',
        'The second line contains n space-separated integers.',
        '',
        'Output format:',
        'Print the 1-based positions of the first valid pair. If no pair exists, print -1.',
      ].join('\n'),
      constraints: '2 <= n <= 100000\n-100000 <= value,target <= 100000',
      testCases: [
        { input: '5 9\n2 7 11 15 1', output: '1 2', explanation: '2 + 7 = 9.' },
        { input: '6 10\n1 4 6 3 7 8', output: '2 3', explanation: '4 + 6 = 10 and appears before later valid pairs.' },
        { input: '4 50\n5 10 20 25', output: '-1', hidden: true },
      ],
    });
  }

  if (topicIncludes(topic, ['system design', 'api', 'rest', 'devops', 'cloud', 'scalability'])) {
    return withMeta(topic, difficulty, {
      title: `${label} Rate Limiter Simulation`,
      description: [
        contextLine,
        '',
        'Simulate a simple fixed-window rate limiter.',
        '',
        'For every request timestamp, allow it if no more than limit requests have already appeared in the same window.',
        '',
        'Input format:',
        'The first line contains n, windowSize, and limit.',
        'The second line contains n non-decreasing request timestamps.',
        '',
        'Output format:',
        'Print ALLOW or BLOCK for each request on one line separated by spaces.',
      ].join('\n'),
      constraints: '1 <= n <= 1000\n1 <= windowSize <= 1000\n1 <= limit <= 1000',
      testCases: [
        { input: '6 10 2\n1 2 3 11 12 13', output: 'ALLOW ALLOW BLOCK ALLOW ALLOW BLOCK', explanation: 'Each 10-second window allows only two requests.' },
        { input: '5 5 3\n1 2 3 4 8', output: 'ALLOW ALLOW ALLOW BLOCK ALLOW' },
        { input: '4 3 1\n10 11 13 14', output: 'ALLOW BLOCK ALLOW BLOCK', hidden: true },
      ],
    });
  }

  if (topicIncludes(topic, ['oop', 'object'])) {
    return withMeta(topic, difficulty, {
      title: `${label} Inventory Commands`,
      description: [
        contextLine,
        '',
        'Process inventory commands for a small library system.',
        '',
        'ADD x increases stock by x.',
        'REMOVE x decreases stock by x, but stock cannot go below 0.',
        'COUNT prints the current stock.',
        '',
        'Input format:',
        'The first line contains q.',
        'The next q lines contain one command.',
        '',
        'Output format:',
        'Print the result of every COUNT command on a new line.',
      ].join('\n'),
      constraints: '1 <= q <= 1000\n0 <= x <= 100000',
      testCases: [
        { input: '6\nADD 5\nCOUNT\nREMOVE 2\nCOUNT\nREMOVE 10\nCOUNT', output: '5\n3\n0' },
        { input: '4\nCOUNT\nADD 3\nADD 2\nCOUNT', output: '0\n5' },
        { input: '5\nADD 1\nREMOVE 1\nREMOVE 1\nADD 4\nCOUNT', output: '4', hidden: true },
      ],
    });
  }

  if (topicIncludes(topic, ['testing', 'qa', 'quality'])) {
    return withMeta(topic, difficulty, {
      title: `${label} Test Result Analyzer`,
      description: [
        contextLine,
        '',
        'Given expected and actual outputs for test cases, count how many pass and fail.',
        '',
        'Input format:',
        'The first line contains n.',
        'The next n lines each contain expected and actual values.',
        '',
        'Output format:',
        'Print passed failed.',
      ].join('\n'),
      constraints: '1 <= n <= 1000\nValues contain no spaces.',
      testCases: [
        { input: '4\nYES YES\nNO YES\n42 42\nA B', output: '2 2' },
        { input: '3\nok ok\npass pass\nx x', output: '3 0' },
        { input: '2\nleft right\nsame same', output: '1 1', hidden: true },
      ],
    });
  }

  if (topicIncludes(topic, ['database', 'sql', 'dbms'])) {
    return withMeta(topic, difficulty, {
      title: `${label} Duplicate Detector`,
      description: [
        contextLine,
        '',
        'Detect duplicate record keys in an imported dataset.',
        '',
        'Input format:',
        'The first line contains n.',
        'The second line contains n space-separated keys.',
        '',
        'Output format:',
        'Print the number of keys that appear more than once.',
      ].join('\n'),
      constraints: '1 <= n <= 100000\nKeys contain lowercase letters and digits only.',
      testCases: [
        { input: '7\na b c a d b e', output: '2', explanation: 'a and b are duplicate keys.' },
        { input: '5\nu1 u2 u3 u4 u5', output: '0' },
        { input: '6\nx x x y y z', output: '2', hidden: true },
      ],
    });
  }

  if (topicIncludes(topic, ['security', 'cryptography', 'authentication', 'threat'])) {
    return withMeta(topic, difficulty, {
      title: `${label} Password Policy Check`,
      description: [
        contextLine,
        '',
        'Count how many passwords satisfy a basic security policy.',
        '',
        'A valid password has length at least 8, at least one uppercase letter, at least one lowercase letter, and at least one digit.',
        '',
        'Input format:',
        'The first line contains n.',
        'The next n lines each contain one password.',
        '',
        'Output format:',
        'Print the count of valid passwords.',
      ].join('\n'),
      constraints: '1 <= n <= 1000\nPasswords contain visible ASCII characters and no spaces.',
      testCases: [
        { input: '4\nPassw0rd\nweak\nSTRONG123\nGood2026', output: '2', explanation: 'Passw0rd and Good2026 meet all rules.' },
        { input: '3\nabcDEF12\nabcdef12\nABCDEF12', output: '1' },
        { input: '2\nShort1\nValid999A', output: '1', hidden: true },
      ],
    });
  }

  return withMeta(topic, difficulty, {
    title: `${label} Coding Warm-up`,
    description: [
      contextLine,
      '',
      'Given a list of integers, return two values:',
      '1. the sum of all numbers',
      '2. the largest number in the list',
      '',
      'Input format:',
      'The first line contains n.',
      'The second line contains n space-separated integers.',
      '',
      'Output format:',
      'Print the sum and maximum value separated by a space.',
    ].join('\n'),
    constraints: '1 <= n <= 1000\n-100000 <= value <= 100000',
    testCases: [
      { input: '5\n1 2 3 4 5', output: '15 5', explanation: 'The sum is 15 and the largest value is 5.' },
      { input: '4\n-2 8 1 3', output: '10 8', explanation: 'The sum is 10 and the largest value is 8.' },
      { input: '3\n7 7 7', output: '21 7', hidden: true },
    ],
  });
};
