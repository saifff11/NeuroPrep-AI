// PROFESSIONAL CODING COMPILER - ENTERPRISE-GRADE DEVELOPMENT ENVIRONMENT
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Editor, loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import judge0Client from '../../services/judge0Client';
import { createSubmission } from '../../services/SubmissionsService.mongodb';

import { markRoundComplete } from '../../config/roundsConfig';
import RoundBreakScreen from './RoundBreakScreen';
import SubmissionsPanel from './SubmissionsPanel';

loader.config({ monaco });

const getProblemText = (problem = {}) => [
  problem.title,
  problem.description,
  problem.constraints
].filter(Boolean).join(' ').toLowerCase();

const inferProblemKind = (problem = {}) => {
  const text = getProblemText(problem);
  if (text.includes('pair') && text.includes('target')) return 'pair-sum';
  if (text.includes('rate limiter')) return 'rate-limiter';
  if (text.includes('inventory') && text.includes('command')) return 'inventory';
  if (text.includes('expected') && text.includes('actual') && text.includes('pass')) return 'test-analyzer';
  if (text.includes('duplicate')) return 'duplicate-detector';
  if (text.includes('password') && text.includes('policy')) return 'password-policy';
  if (text.includes('sum') && (text.includes('largest') || text.includes('maximum'))) return 'sum-max';
  return 'generic';
};

const getStarterCode = (language, problem) => {
  if (!language) return '';

  const starter = problem?.starterCode;
  if (typeof starter === 'string') return starter;
  if (starter && typeof starter === 'object') {
    const direct = starter[language.name] || starter[String(language.id)] || starter[language.label];
    if (direct) return direct;
  }

  const title = problem?.title || 'NeuroPrep Coding Challenge';
  const kind = inferProblemKind(problem);
  const header = `${title}\nRead from standard input and print the required output.`;

  if (language.name === 'python') {
    const snippets = {
      'sum-max': `# ${header}\nimport sys\n\n\ndef solve():\n    data = sys.stdin.read().strip().split()\n    if not data:\n        return\n    n = int(data[0])\n    nums = list(map(int, data[1:1 + n]))\n    # TODO: calculate the sum and maximum value.\n    # print(total, maximum)\n\n\nif __name__ == '__main__':\n    solve()\n`,
      'pair-sum': `# ${header}\nimport sys\n\n\ndef solve():\n    data = list(map(int, sys.stdin.read().strip().split()))\n    if not data:\n        return\n    n, target = data[0], data[1]\n    nums = data[2:2 + n]\n    # TODO: print 1-based indices of the first pair, or -1.\n\n\nif __name__ == '__main__':\n    solve()\n`,
      generic: `# ${header}\nimport sys\n\n\ndef solve():\n    data = sys.stdin.read().strip().split()\n    # TODO: implement the solution from the problem statement.\n\n\nif __name__ == '__main__':\n    solve()\n`
    };
    return snippets[kind] || snippets.generic;
  }

  if (language.name === 'javascript') {
    const snippets = {
      'sum-max': `// ${header}\nconst fs = require('fs');\nconst tokens = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\n\nif (tokens.length > 0) {\n  const n = Number(tokens[0]);\n  const nums = tokens.slice(1, 1 + n).map(Number);\n  // TODO: calculate the sum and maximum value.\n  // console.log(total + ' ' + maximum);\n}\n`,
      'pair-sum': `// ${header}\nconst fs = require('fs');\nconst tokens = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n\nif (tokens.length > 0) {\n  const n = tokens[0];\n  const target = tokens[1];\n  const nums = tokens.slice(2, 2 + n);\n  // TODO: print 1-based indices of the first pair, or -1.\n}\n`,
      generic: `// ${header}\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n\n// TODO: implement the solution from the problem statement.\n`
    };
    return snippets[kind] || snippets.generic;
  }

  if (language.name === 'java') {
    const snippets = {
      'sum-max': `// ${header}\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.hasNextInt() ? sc.nextInt() : 0;\n    long sum = 0;\n    int maxValue = Integer.MIN_VALUE;\n\n    for (int i = 0; i < n && sc.hasNextInt(); i++) {\n      int value = sc.nextInt();\n      // TODO: update sum and maxValue.\n    }\n\n    // TODO: print sum and maxValue separated by a space.\n  }\n}\n`,
      'pair-sum': `// ${header}\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.hasNextInt() ? sc.nextInt() : 0;\n    int target = sc.hasNextInt() ? sc.nextInt() : 0;\n    int[] nums = new int[n];\n    for (int i = 0; i < n && sc.hasNextInt(); i++) nums[i] = sc.nextInt();\n\n    // TODO: print 1-based indices of the first pair, or -1.\n  }\n}\n`,
      generic: `// ${header}\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    // TODO: implement the solution from the problem statement.\n  }\n}\n`
    };
    return snippets[kind] || snippets.generic;
  }

  if (language.name === 'cpp') {
    const snippets = {
      'sum-max': `// ${header}\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  int n;\n  if (!(cin >> n)) return 0;\n  long long sum = 0;\n  int maxValue = INT_MIN;\n\n  for (int i = 0; i < n; i++) {\n    int value;\n    cin >> value;\n    // TODO: update sum and maxValue.\n  }\n\n  // TODO: print sum and maxValue separated by a space.\n  return 0;\n}\n`,
      generic: `// ${header}\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  // TODO: implement the solution from the problem statement.\n  return 0;\n}\n`
    };
    return snippets[kind] || snippets.generic;
  }

  if (language.name === 'c') {
    return `/* ${header} */\n#include <stdio.h>\n\nint main(void) {\n  /* TODO: implement the solution from the problem statement. */\n  return 0;\n}\n`;
  }

  return language.template || '';
};

const normalizeDisplayValue = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return typeof value === 'string' ? value : JSON.stringify(value);
};

const getMongoObjectId = (value) => {
  const id = String(value || '');
  return /^[a-f\d]{24}$/i.test(id) ? id : null;
};

const calculateSubmissionPoints = (batch = {}) => {
  const total = Number(batch.total || 0);
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(batch.passed || 0) / total) * 100)));
};

function CompilerPage(props) {
  const {
    user,
    trackKey,
    isFullInterview,
    currentRoundIndex = 0,
    allRounds = [],
    totalRounds = 0,
    selectedTopic,
    timer,
    problemData // New prop for reusable problem data
  } = props;

  const location = useLocation();
  const navigate = useNavigate();
  
  // Ensure all props and state are safely initialized
  // Provide a sensible default language list if host doesn't pass one in props
  const defaultLanguages = [
    { id: 71, name: 'python', label: 'Python 3', template: `# Python 3 starter\nif __name__ == '__main__':\n    pass\n` },
    { id: 63, name: 'javascript', label: 'JavaScript (Node)', template: `// JavaScript (Node) starter\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n\n// TODO: implement the solution from the problem statement.\n` },
    { id: 62, name: 'java', label: 'Java', template: `// Java starter\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    // TODO: implement the solution from the problem statement.\n  }\n}\n` },
    { id: 54, name: 'cpp', label: 'C++ (GCC)', template: `// C++ starter\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  ios::sync_with_stdio(false); cin.tie(nullptr);\n  return 0;\n}\n` },
    { id: 50, name: 'c', label: 'C (GCC)', template: `/* C starter */\n#include <stdio.h>\nint main(){\n  return 0;\n}\n` }
  ];

  const languages = Array.isArray(props.languages) && props.languages.length ? props.languages : defaultLanguages;
  const defaultLanguage = languages.find(l => l.name === 'python') || languages[0] || null;
  const [language, setLanguage] = useState(defaultLanguage);
  const [fontSize, setFontSize] = useState(16);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [output, setOutput] = useState('');
  const [code, setCode] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [problemConfig, setProblemConfig] = useState({
    topic: 'algorithms',
    difficulty: 'easy',
    language: defaultLanguage ? defaultLanguage.name : ''
  });
  const [problemDetails, setProblemDetails] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProblemPanel, setShowProblemPanel] = useState(true);
  const [showSubTopics, setShowSubTopics] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [editorHeight, setEditorHeight] = useState(60);
  const [dragging, setDragging] = useState(false);
  const [vDragging, setVDragging] = useState(false);
  const [judge0Status, setJudge0Status] = useState({ connected: null, testing: false });
  const [messageIndex, setMessageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  const [monacoReady, setMonacoReady] = useState(false);
  const [usePlainTextEditor, setUsePlainTextEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('Description');
  const [activeOutputTab, setActiveOutputTab] = useState('custom'); // Output tab: 'custom' or 'tests'
  const [selectedMainTopic, setSelectedMainTopic] = useState('algorithms');
  const [configuredTopic, setConfiguredTopic] = useState(problemConfig.topic);
  const [customInput, setCustomInput] = useState(''); // Custom input for Execute Code
  const [inputHeight, setInputHeight] = useState(35); // Percentage height for custom input section
  const [isDragging, setIsDragging] = useState(false);
  const loadingMessages = [
    'Initializing UI...',
    'Preparing test harness...',
    'Wiring runner...',
    'Finalizing challenge...'
  ];
  const PREF_KEY = 'acemi_prefs_v1';
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [darkMode, setDarkMode] = useState(editorTheme === 'vs-dark' || prefersDark);

  // RAF ref used to throttle drag updates and avoid jank
  const rafRef = useRef(null);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const editorRef = useRef(null);
  const splitRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const verticalSplitRef = useRef(null);
  const activeProblem = useMemo(() => problemData || problemDetails, [problemData, problemDetails]);
  const interviewRounds = useMemo(() => (Array.isArray(allRounds) ? allRounds : []), [allRounds]);

  useEffect(() => { setDarkMode(editorTheme === 'vs-dark'); }, [editorTheme]);

  useEffect(() => {
    setUsePlainTextEditor(false);
    const timeout = setTimeout(() => {
      if (!editorRef.current) {
        setUsePlainTextEditor(true);
      }
    }, 4500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let mounted = true;

    setJudge0Status({
      connected: null,
      testing: true,
      message: 'Checking compiler runner...'
    });

    judge0Client.health().then((config) => {
      if (!mounted) return;
      const runnerLabel = config.provider === 'local' ? 'Local code runner' : 'Judge0 backend runner';
      setJudge0Status({
        connected: Boolean(config.configured),
        testing: false,
        message: config.configured
          ? `${runnerLabel} is ready.`
          : (config.error || 'No backend code runner is configured.'),
        config
      });
    });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (judge0Status.connected === true) {
      toast.success('Compiler runner connected.', { autoClose: 2500 });
    } else if (judge0Status.connected === false) {
      toast.warn(judge0Status.message || 'Compiler runner is not configured.', { autoClose: 5000 });
    }
  }, [judge0Status.connected, judge0Status.message]);

  useEffect(() => {
    if (selectedTopic) {
      setProblemConfig((prev) => ({ ...prev, topic: selectedTopic }));
    }
  }, [selectedTopic]);

  useEffect(() => {
    if (selectedTopic && selectedTopic !== 'algorithms') {
      const topicToMainCategoryMap = {
        'Software Developer': 'algorithms',
        'DSA': 'data-structures',
        'OOPS': 'algorithms',
        'System Design': 'system-design',
        'Cybersecurity': 'algorithms',
        'Network Security': 'algorithms',
        'Ethical Hacking': 'algorithms',
        'Cryptography': 'algorithms',
        'Data Analyst': 'mathematics',
        'Product Manager': 'system-design',
        'HR Interview': 'algorithms',
        'Project Coordinator': 'system-design',
        'System Admin': 'algorithms'
      };
      const mainCategory = topicToMainCategoryMap[selectedTopic];
      if (mainCategory) {
        setSelectedMainTopic(mainCategory);
        setShowSubTopics(true);
        const defaultSubtopic = getCodingDefaultSubtopic(selectedTopic);
        if (defaultSubtopic) { setProblemConfig({ ...problemConfig, topic: defaultSubtopic }); setConfiguredTopic(defaultSubtopic); }
      }
    }
  }, [selectedTopic]);

  const getCodingDefaultSubtopic = (topic) => {
    const defaultMap = {
      'Software Developer': 'sorting',
      'Network Security': 'searching',
      'Ethical Hacking': 'backtracking',
      'Cryptography': 'bit-manipulation',
      'Data Analyst': 'number-theory',
      'Product Manager': 'api-design',
      'HR Interview': 'sorting',
      'Project Coordinator': 'microservices',
      'System Admin': 'greedy'
    };
    return defaultMap[topic] || null;
  };

  useEffect(() => { if (problemDetails && !loadingProblem) toast.dismiss(); }, [problemDetails, loadingProblem]);

  useEffect(() => { if (problemData) { setProblemDetails(problemData); setLoadingProblem(false); } }, [problemData]);

  const normalizeTestCases = (raw) => { if (!Array.isArray(raw)) return []; return raw.map(tc => ({ input: tc.input ?? tc.stdin ?? tc.in ?? '', output: tc.output ?? tc.expected ?? tc.out ?? '', explanation: tc.explanation ?? tc.hint ?? null, hidden: !!tc.hidden })); };

  const currentTestCasesNormalized = normalizeTestCases(activeProblem?.testCases);
  const isHiddenTestResult = (result, index) => Boolean(
    result?.hidden || result?.isHidden || currentTestCasesNormalized?.[index]?.hidden
  );

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (e.shiftKey) { e.preventDefault(); handleCodeSubmit(); }
        else { e.preventDefault(); runCode(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [code, language, problemDetails, problemData]);

  useEffect(() => {
    const nextStarterCode = getStarterCode(language, activeProblem);
    const firstVisibleTestCase = normalizeTestCases(activeProblem?.testCases).find((testCase) => !testCase.hidden);

    setCode(nextStarterCode);
    setOutput('');
    setTestResults(null);
    setLastSubmission(null);
    setProblemConfig((prev) => ({ ...prev, language: language ? language.name : '' }));
    setCustomInput((prev) => {
      if (prev && prev.trim()) return prev;
      return firstVisibleTestCase ? normalizeDisplayValue(firstVisibleTestCase.input, '') : '';
    });
  }, [language, activeProblem]);

  // Handle drag for resizing custom input/output sections
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const container = document.getElementById('custom-output-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
          // Constrain between 2% and 95% - allows nearly full collapse or expansion
          if (newHeight >= 2 && newHeight <= 95) {
            setInputHeight(newHeight);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handler for language select change
  const handleLanguageChange = (lang) => {
    if (!lang) return;
    setLanguage(lang);
  };

  const validateJudge0Setup = () => {
    if (!language?.id) {
      return { valid: false, message: 'Please choose a programming language.' };
    }
    if (judge0Status.testing) {
      return { valid: false, message: 'Compiler runner is still checking. Please try again in a moment.' };
    }
    if (judge0Status.connected === false) {
      return { valid: false, message: judge0Status.message || 'Code runner is not configured on the backend.' };
    }
    return { valid: true };
  };

  const runCode = async () => {
    if (!code.trim()) { toast.error('Please write some code first!'); return; }
    const setup = validateJudge0Setup();
    if (!setup.valid) {
      toast.error(setup.message);
      setOutput(setup.message);
      return;
    }
    setIsRunning(true); setOutput('Running code...');
    try {
      const res = await judge0Client.runOnce({ code, languageId: language.id, stdin: customInput });
      if (res.compile_output) setOutput(res.compile_output);
      else if (res.stderr) setOutput(res.stderr);
      else setOutput(res.stdout || 'No output');
    } catch (e) { setOutput('Error: ' + e.message); toast.error('Failed to execute code'); }
    finally { setIsRunning(false); }
  };

  const resetCode = () => { setCode(getStarterCode(language, activeProblem)); setOutput(''); setTestResults(null); };

  // Run only sample (visible) test cases
  const runSampleTests = async () => {
    if (!code.trim()) { toast.error('Please write some code first!'); return; }
    const rawTestCases = activeProblem?.testCases;
    if (!rawTestCases) { toast.error('No test cases available for this problem!'); return; }
    
    const allTestCases = normalizeTestCases(rawTestCases);
    // Filter only visible (non-hidden) test cases
    const sampleTestCases = allTestCases.filter(tc => !tc.hidden);
    
    if (sampleTestCases.length === 0) {
      toast.error('No sample test cases available!');
      return;
    }
    
    const setup = validateJudge0Setup();
    if (!setup.valid) { 
      toast.error(setup.message); 
      setTestResults({ passed:0,total:0,details:[{input:'',expected:'',actual:setup.message,passed:false,error:'Configuration'}]}); 
      return; 
    }
    
    setIsSubmitting(true); 
    setTestResults({ passed:0,total:0,details:[] });
    
    try {
      toast.info('Running sample test cases...', { autoClose:1500 });
      const batch = await judge0Client.runBatch({ code, languageId: language.id, testCases: sampleTestCases });
      setTestResults(batch);
      setActiveOutputTab('tests'); // Auto-switch to Test Results tab
      
      if (batch.passed === batch.total) {
        toast.success(`All ${batch.passed}/${batch.total} sample test cases passed!`);
      } else { 
        toast.error(`${batch.passed}/${batch.total} sample test cases passed. Keep trying!`); 
      }
    } catch (e) { 
      toast.error('Failed to run sample tests: ' + e.message); 
      setTestResults({ passed:0,total:0,details:[],error:e.message }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) { toast.error('Please write some code first!'); return; }
    const rawTestCases = activeProblem?.testCases;
    if (!rawTestCases) { toast.error('No test cases available for this problem!'); return; }
    const userId = user?.uid || user?.id || null;
    if (!userId) {
      toast.error('Please sign in before submitting so your points can be saved.');
      return;
    }
    const testCases = normalizeTestCases(rawTestCases);
    const setup = validateJudge0Setup();
    if (!setup.valid) { toast.error(setup.message); setTestResults({ passed:0,total:0,details:[{input:'',expected:'',actual:setup.message,passed:false,error:'Configuration'}]}); return; }
    setIsSubmitting(true); setTestResults({ passed:0,total:0,details:[] });
    try {
      setLastSubmission(null);
      toast.info('Submitting solution...', { autoClose:1500 });
      const batch = await judge0Client.runBatch({ code, languageId: language.id, testCases });
      const points = calculateSubmissionPoints(batch);
      setTestResults(batch);
      setActiveOutputTab('tests'); // Auto-switch to Test Results tab
      const solvedAllTests = batch.passed === batch.total;
      const verdict = solvedAllTests ? 'Accepted' : (batch.passed > 0 ? 'Partial' : 'Failed');

      if (solvedAllTests) {
        const roundId = location.state?.roundId; if (roundId) try { markRoundComplete(user?.uid || 'anonymous', roundId); } catch {}
        if (isFullInterview && currentRoundIndex < interviewRounds.length - 1) setTimeout(() => setShowBreakScreen(true), 3000);
      }

      const contestId = location.state?.contestId || props.contestId || null;
      const problemId = getMongoObjectId(activeProblem?._id || activeProblem?.id);
      const problemKey = activeProblem?.id || activeProblem?._id || activeProblem?.title || 'coding-practice';
      try {
        const saved = await createSubmission({
          contestId,
          problemId,
          problemKey,
          problemTitle: activeProblem?.title || 'Coding practice',
          topic: selectedTopic || activeProblem?.__meta?.topic || problemConfig.topic,
          difficulty: activeProblem?.difficulty || problemConfig.difficulty || location.state?.difficulty || 'medium',
          source: contestId ? 'contest' : 'practice',
          problemIndex: props.problemIndex ?? 0,
          userId,
          username: user?.displayName || user?.name || user?.email || 'anonymous',
          languageId: language?.id || null,
          language: language?.name || 'python',
          code: code || '',
          verdict,
          status: verdict,
          time: batch.metrics?.avgTime ?? null,
          memory: batch.metrics?.maxMemory ?? null,
          code_length: code ? code.length : 0,
          testResults: batch.details || [],
          result: batch
        }, user);
        setLastSubmission({
          points: saved?.pointsAwarded ?? saved?.score ?? saved?.marksObtained ?? points,
          verdict,
          passed: batch.passed,
          total: batch.total,
          saved: true,
          savedAt: new Date().toISOString()
        });
        if (solvedAllTests) {
          toast.success(`Submitted: ${points}/100 points. Dashboard updated.`);
        } else {
          toast.warn(`Submitted: ${points}/100 points (${batch.passed}/${batch.total} tests passed). Dashboard updated.`);
        }
      } catch (saveError) {
        setLastSubmission({
          points,
          verdict,
          passed: batch.passed,
          total: batch.total,
          saved: false,
          savedAt: new Date().toISOString()
        });
        const saveMessage = saveError?.message || 'Unknown save error';
        toast.error(`Tests completed, but points could not be saved: ${saveMessage}`);
        console.debug('createSubmission failed (handleCodeSubmit):', saveError?.message || saveError);
      }
    } catch (e) { toast.error('Failed to submit solution: ' + e.message); setTestResults({ passed:0,total:0,details:[],error:e.message }); }
    finally { setIsSubmitting(false); }
  };

  const routeForRoundMode = (mode) => {
    if (mode === 'MCQ') return '/mcq-interview';
    if (mode === 'CODING' || mode === 'Coding Compiler') return '/compiler';
    if (mode === 'PERSON' || mode === 'Person-to-Person') return '/face-to-face-interview';
    return '/face-to-face-interview';
  };

  const handleContinueToNextRound = () => {
    const nextRoundIndex = currentRoundIndex + 1;
    const nextRound = interviewRounds[nextRoundIndex];

    if (!nextRound) {
      navigate('/interview-preparation');
      return;
    }

    navigate(routeForRoundMode(nextRound.mode), {
      state: {
        ...location.state,
        roundId: nextRound.id,
        roundLabel: nextRound.label,
        roundStage: nextRound.stage,
        mode: nextRound.mode,
        subject: location.state?.subject || selectedTopic,
        topic: location.state?.topic || selectedTopic,
        jobRole: location.state?.jobRole || location.state?.trackTitle || selectedTopic,
        allRounds: interviewRounds,
        currentRoundIndex: nextRoundIndex,
        isFullInterview: true,
        totalRounds: interviewRounds.length || totalRounds
      }
    });
  };

  const startDrag = (e) => { e.preventDefault(); setDragging(true); };
  const startVerticalDrag = (e) => { e.preventDefault(); setVDragging(true); };

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging || !splitRef.current) return; if (isMobile) return;
      const rect = splitRef.current.getBoundingClientRect(); const x = e.clientX || (e.touches && e.touches[0].clientX); if (!x) return;
      const compute = () => { let pct = ((x - rect.left) / rect.width) * 100; pct = Math.max(25, Math.min(85, pct)); setLeftWidth(pct); rafRef.current = null; };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(compute);
    };
    const stop = () => { setDragging(false); if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', stop); window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', stop);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', stop); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', stop); if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  }, [dragging, isMobile]);

  useEffect(() => {
    const handleVMove = (e) => {
      if (!vDragging || !verticalSplitRef.current) return; if (isMobile) return;
      const container = verticalSplitRef.current.getBoundingClientRect(); const y = e.clientY || (e.touches && e.touches[0].clientY); if (!y) return;
      const compute = () => { const top = container.top; const height = container.height; let pct = ((y - top) / height) * 100; pct = Math.max(45, Math.min(85, pct)); setEditorHeight(pct); rafRef.current = null; };
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(compute);
    };
    const stop = () => { setVDragging(false); if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    window.addEventListener('mousemove', handleVMove); window.addEventListener('mouseup', stop); window.addEventListener('touchmove', handleVMove); window.addEventListener('touchend', stop);
    return () => { window.removeEventListener('mousemove', handleVMove); window.removeEventListener('mouseup', stop); window.removeEventListener('touchmove', handleVMove); window.removeEventListener('touchend', stop); if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  }, [vDragging, isMobile]);

  const ProblemPanel = (
    <div className={`${!isMobile ? 'h-full overflow-hidden flex flex-col border border-slate-200 bg-white rounded-lg' : 'w-full bg-white border-b border-slate-200 flex flex-col'} ${!showProblemPanel && isMobile ? 'hidden' : ''}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-md p-1 text-gray-600 hover:text-gray-900">Back</button>
          <div className="text-sm font-semibold text-slate-800">AI coding challenge</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600">{selectedTopic || problemConfig.topic}</div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
        <ul className="flex items-center gap-4">
          <li><button onClick={() => setActiveTab('Description')} className={`text-sm font-medium pb-1 ${activeTab === 'Description' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600'}`}>Description</button></li>
          {/* Editorial and Solutions tabs hidden as requested */}
          {/* <li><button onClick={() => setActiveTab('Editorial')} className={`text-sm pb-1 ${activeTab === 'Editorial' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600'}`}>Editorial</button></li> */}
          {/* <li><button onClick={() => setActiveTab('Solutions')} className={`text-sm pb-1 ${activeTab === 'Solutions' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600'}`}>Solutions</button></li> */}
          <li><button onClick={() => setActiveTab('Submissions')} className={`text-sm pb-1 ${activeTab === 'Submissions' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600'}`}>Submissions</button></li>
        </ul>
        <div className="flex items-center gap-2">
          <button onClick={() => setLeftWidth(leftWidth < 40 ? 55 : 35)} className="hidden md:inline-block text-[11px] px-2 py-1 rounded bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition">{leftWidth < 40 ? 'Widen' : 'Narrow'}</button>
          {isMobile && (
            <button onClick={() => setShowProblemPanel(p => !p)} className="md:hidden text-[11px] px-2 py-1 rounded bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition">
              {showProblemPanel ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm leading-relaxed custom-scroll">
        {activeProblem && activeTab === 'Description' ? (() => {
          const currentProblem = activeProblem;
          return (
            <div>
              {currentProblem.__meta?.error && (
                <div className="mb-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-800">
                  <div className="text-sm">
                    <strong>Problem metadata:</strong> {currentProblem.__meta.error}
                    <div className="text-xs text-amber-700 mt-1">This problem contains metadata.</div>
                  </div>
                </div>
              )}
              <h3 className="text-base font-bold text-gray-800 mb-2">{currentProblem.title}</h3>
              <div className="text-gray-600 whitespace-pre-wrap mb-4">{currentProblem.description}</div>
              {currentProblem.constraints && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">Constraints</h4>
                  <div className="text-xs font-mono whitespace-pre-wrap bg-blue-50/60 rounded p-3 text-gray-700">{currentProblem.constraints}</div>
                </div>
              )}
              {currentProblem.explanation && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-2">Explanation</h4>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-blue-50/60 rounded p-3 text-gray-700">{currentProblem.explanation}</pre>
                </div>
              )}

              {currentProblem.testCases && currentProblem.testCases.filter(tc => !tc.hidden).length > 0 && (
                <div className="mb-2">
                  <h4 className={`text-xs font-semibold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Sample Test Cases</h4>
                  {currentProblem.testCases.filter(tc => !tc.hidden).slice(0, 3).map((tc, i) => (
                    <div key={i} className="p-3 rounded border bg-gray-50 border-gray-200 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-800">Sample Test Case {i + 1}</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="bg-white p-2 rounded border">
                          <div className="font-medium text-blue-700 mb-1">Input:</div>
                          <div className="font-mono text-gray-800 whitespace-pre-wrap">{normalizeDisplayValue(tc.input)}</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="font-medium text-blue-700 mb-1">Output:</div>
                          <div className="font-mono text-gray-800 whitespace-pre-wrap">{normalizeDisplayValue(tc.output)}</div>
                        </div>
                        {tc.explanation && (
                          <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <div className="font-medium text-blue-800 mb-1">Explanation:</div>
                            <div className="text-gray-700 whitespace-pre-wrap">{tc.explanation}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentProblem.testCases && currentProblem.testCases.filter(tc => tc.hidden).length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Hidden Test Cases</h4>
                  <div className="text-xs text-gray-600">
                    {currentProblem.testCases.filter(tc => tc.hidden).length} additional test cases will be run but not shown.
                  </div>
                </div>
              )}
            </div>
          );
        })() : null}

        {activeTab === 'Editorial' && (
          <div className="p-4 text-sm text-gray-600">Editorial content is not available for this dynamic problem. You can attach editorial notes via the problemData prop.</div>
        )}
        {activeTab === 'Solutions' && (
          <div className="p-4 text-sm text-gray-600">Solutions view - paste sample solutions or explanations in the problemData.explanation field to display here.</div>
        )}
        {activeTab === 'Submissions' && (
          <SubmissionsPanel contestId={location.state?.contestId || props.contestId || null} />
        )}
      </div>
    </div>
  );

  // Simplified loading screen (white + blue); generation removed.
  if (loadingProblem && !problemData) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <h2 className="text-2xl font-semibold text-blue-700">Loading problem...</h2>
          <p className="text-sm text-blue-500 mt-2">Please wait while the problem is loaded from the provided source.</p>
        </div>
      </div>
    );
  }

  // Main Coding Interface - OPTIMIZED HEIGHT
  const rootClasses = 'fixed inset-0 z-[100] w-full h-screen overflow-hidden max-w-[100vw] flex flex-col bg-slate-950 text-slate-950';

  // Show break screen between rounds
  if (showBreakScreen) {
    const currentRound = interviewRounds[currentRoundIndex];
    const nextRound = interviewRounds[currentRoundIndex + 1];
    
    return (
      <RoundBreakScreen
        currentRound={currentRound}
        nextRound={nextRound}
        currentRoundIndex={currentRoundIndex}
        totalRounds={interviewRounds.length || totalRounds}
        onContinue={handleContinueToNextRound}
        trackKey={trackKey}
      />
    );
  }

  return (
    <div className={rootClasses}>
      {!isFullInterview && (
        <div className="border-b border-slate-800 bg-slate-950 px-5 py-3 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500 text-sm font-bold text-slate-950">
                AI
              </div>
              <div>
                <div className="text-sm font-bold text-white">NeuroPrep compiler workspace</div>
                <div className="text-xs text-slate-400">Run code, validate tests, and submit contest-ready solutions.</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-300">
                {selectedTopic || problemConfig.topic}
              </span>
              <span className={`rounded-md border px-3 py-1.5 ${
                judge0Status.connected === false
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-100'
                  : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
              }`}>
                {judge0Status.testing
                  ? 'Runner checking'
                  : judge0Status.connected === false
                    ? 'Runner setup needed'
                    : judge0Status.config?.provider === 'local'
                      ? 'Local runner'
                      : 'Judge0 runner'}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Full Interview Progress Header */}
      {isFullInterview && (
        <div className="bg-slate-950 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-500 text-sm font-bold text-slate-950">
              R{currentRoundIndex + 1}
            </span>
            <div>
              <div className="font-bold">Round {currentRoundIndex + 1} of {totalRounds}</div>
              <div className="text-slate-400 text-xs">{interviewRounds[currentRoundIndex]?.label}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-cyan-200">Full Interview Mode</div>
            <div className="text-xs text-slate-400">{totalRounds - currentRoundIndex - 1} rounds remaining</div>
          </div>
        </div>
      )}
      
     

      {/* Split Workspace (responsive) */}
      <div ref={splitRef} className={`flex-1 w-full ${isMobile ? 'flex flex-col' : 'flex relative'} overflow-hidden`}>
        {/* Problem Panel - sticky, scrollable, card style */}
        {!isMobile && (
          <div
            ref={leftRef}
            style={{ width: `${leftWidth}%`, minWidth: '340px', background: '#f8fafc', borderRight: '1px solid #cbd5e1' }}
            className="flex-shrink-0 h-full overflow-y-auto sticky top-0"
          >
            <div className="p-6">
              {ProblemPanel}
            </div>
          </div>
        )}
        {isMobile && ProblemPanel}

        {/* Divider (desktop only) */}
        {!isMobile && (
          <div
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            className="w-2 cursor-col-resize bg-slate-800 hover:bg-cyan-700 transition relative group"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-40 bg-cyan-500 mix-blend-multiply transition" />
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-5 h-16 rounded-full bg-white/70 border border-blue-300 shadow flex items-center justify-center text-[10px] text-blue-600 font-medium">LR</div>
          </div>
        )}

        {/* Right: Editor & Output */}
        <div ref={rightRef} className="flex-1 flex flex-col min-w-0 bg-white" style={{fontFamily: 'Inter, Segoe UI, Arial, sans-serif'}}> 
          {/* Language & Actions Bar */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <select
                value={language ? language.id : ''}
                onChange={(e) => {
                  const lang = languages.find(l => l.id === Number(e.target.value));
                  if (lang) handleLanguageChange(lang);
                }}
                className="text-sm border border-blue-200 rounded-lg px-3 py-1.5 bg-white text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!language}
              >
                {!language && <option value="">No language available</option>}
                {languages.map(l => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="text-sm border border-blue-200 rounded-lg px-2 py-1 bg-white text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {[14, 16, 18, 20].map(sz => <option key={sz} value={sz}>{sz}px</option>)}
              </select>
              <select
                value={editorTheme}
                onChange={(e) => setEditorTheme(e.target.value)}
                className="text-sm border border-blue-200 rounded-lg px-2 py-1 bg-white text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {['vs-dark','light','hc-black'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {lastSubmission && (
                <div className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  lastSubmission.saved === false
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {lastSubmission.saved === false ? 'Unsaved' : 'Submitted'}: {lastSubmission.points}/100 pts
                </div>
              )}
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetCode} className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white transition font-medium">Reset</motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={runSampleTests} 
                disabled={isSubmitting || (!problemDetails && !problemData)} 
                className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow"
              >
                {isSubmitting ? 'Running...' : 'Run Sample Tests'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCodeSubmit}
                disabled={isSubmitting || (!problemDetails && !problemData)}
                className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </motion.button>
              {/* Problem generation removed; host should supply `problemData` */}
            </div>
          </div>

           
          <div ref={verticalSplitRef} className="flex-1 flex flex-col min-h-0 select-none">
            
            <div style={{ height: isMobile ? 'auto' : `calc(${editorHeight}% - 3px)` }} className={`${isMobile ? 'h-auto' : 'relative'} min-h-[180px] border-b border-blue-100`}>
              {usePlainTextEditor ? (
                <div className="h-full min-h-[50vh] bg-slate-950 p-4 text-white">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-300">
                    <span>Plain editor fallback</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUsePlainTextEditor(false);
                        setMonacoReady(false);
                        editorRef.current = null;
                      }}
                      className="rounded border border-cyan-400/40 px-2 py-1 text-cyan-200 hover:bg-cyan-400/10"
                    >
                      Retry Monaco
                    </button>
                  </div>
                  <textarea
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    spellCheck={false}
                    className="h-[calc(100%-2rem)] min-h-[320px] w-full resize-none rounded-md border border-slate-700 bg-slate-900 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-cyan-400"
                    style={{ fontSize }}
                  />
                </div>
              ) : (
                <Editor
                  height={isMobile ? '50vh' : '100%'}
                  language={language ? language.name : 'plaintext'}
                  value={code}
                  loading={<div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Preparing code editor...</div>}
                  onChange={(value) => setCode(value || '')}
                  theme={editorTheme}
                  options={{
                    fontSize: fontSize,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    padding: { top: 8 },
                    automaticLayout: true
                  }}
                  onMount={(editor) => {
                    editorRef.current = editor;
                    setMonacoReady(true);
                    setUsePlainTextEditor(false);
                  }}
                />
              )}
              {!isMobile && (
                <div className="absolute top-1 left-2 text-[10px] text-blue-400 bg-white/70 px-1 rounded shadow-sm">
                  {usePlainTextEditor ? 'Fallback Editor' : monacoReady ? 'Editor' : 'Loading Editor'}
                </div>
              )}
            </div>
            {/* Horizontal Divider (Desktop) */}
            {!isMobile && (
              <div
                onMouseDown={startVerticalDrag}
                onTouchStart={startVerticalDrag}
                className={`h-2 bg-blue-200 cursor-row-resize relative group ${vDragging ? 'bg-blue-300' : ''}`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-40 bg-blue-600 mix-blend-multiply transition" />
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-20 h-4 rounded-full bg-white/70 border border-blue-300 shadow flex items-center justify-center text-[10px] text-blue-600 font-medium">resize</div>
              </div>
            )}
            {/* Output & Tests (remaining space) - REDESIGNED */}
            <div style={{ height: isMobile ? 'auto' : `calc(${100 - editorHeight}% - 3px)` }} className="flex-1 min-h-[300px] flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 border-t-2 border-blue-300">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 border-b-2 border-blue-200">
                <button
                  onClick={() => setActiveOutputTab('custom')}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                    activeOutputTab === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Custom Input/Output
                </button>
                
                <button
                  onClick={() => setActiveOutputTab('tests')}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-all relative ${
                    activeOutputTab === 'tests'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>Test Results</span>
                    {testResults && (
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        testResults.passed === testResults.total 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {testResults.passed}/{testResults.total}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Custom Input/Output Tab */}
              {activeOutputTab === 'custom' && (
                <div id="custom-output-container" className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
                  
                  {/* Custom Input Section - Compact */}
                  <div className="flex flex-col" style={{ height: '140px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-blue-800">
                        Custom Input
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={runCode} 
                          disabled={isRunning}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded transition font-semibold"
                        >
                          {isRunning ? 'Executing...' : 'Execute Code'}
                        </button>
                        {currentTestCasesNormalized && currentTestCasesNormalized.length > 0 && (
                          <button 
                            onClick={() => {
                              const firstTestInput = currentTestCasesNormalized[0]?.input || '';
                              setCustomInput(typeof firstTestInput === 'string' ? firstTestInput : JSON.stringify(firstTestInput));
                              toast.info('Loaded first test case input');
                            }} 
                            className="px-2.5 py-1.5 bg-white border border-green-600 hover:bg-green-600 hover:text-white text-green-700 text-xs rounded transition font-semibold"
                          >
                            Use Sample
                          </button>
                        )}
                        <button 
                          onClick={() => setCustomInput('')} 
                          className="px-2.5 py-1.5 bg-white border border-gray-400 hover:bg-gray-100 text-gray-700 text-xs rounded transition font-semibold"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter input (one per line or space-separated)"
                      className="flex-1 p-2.5 border border-gray-300 rounded font-mono text-xs resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white overflow-y-auto"
                      style={{fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace'}}
                    />
                  </div>

                  {/* Program Output Section - Expanded */}
                  <div className="flex-1 flex flex-col" style={{ minHeight: '300px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-blue-800">
                        Program Output
                      </h3>
                      <button 
                        onClick={() => setOutput('')} 
                        className="px-3 py-2 bg-white border border-gray-400 hover:bg-gray-100 text-gray-700 text-sm rounded transition font-semibold"
                      >
                        Clear Output
                      </button>
                    </div>
                    <div className="flex-1 bg-gray-900 rounded p-4 overflow-y-auto border border-gray-700">
                      <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap" style={{fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace'}}>
                        {output || '// Run code to see output...\n// Your program output will appear here'}
                      </pre>
                    </div>
                  </div>

                </div>
              )}

              {/* Test Results Tab */}
              {activeOutputTab === 'tests' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {testResults ? (
                    <div className="space-y-4">
                      
                      {/* Test Summary Header */}
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1">Test Execution Results</h3>
                            <p className="text-blue-50 text-sm">Code tested against {testResults.total} test case(s)</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${testResults.passed === testResults.total ? 'text-green-200' : 'text-red-200'}`}>
                              {testResults.passed}/{testResults.total}
                            </div>
                            <div className="text-sm text-blue-50">Tests Passed</div>
                          </div>
                        </div>
                        {testResults.metrics && (
                          <div className="flex gap-4 mt-3 pt-3 border-t border-blue-300">
                            <div className="bg-white/20 px-3 py-2 rounded-lg">
                              <div className="text-xs text-blue-50">Avg Time</div>
                              <div className="font-bold">{Number(testResults.metrics.avgTime).toFixed(3)}s</div>
                            </div>
                            <div className="bg-white/20 px-3 py-2 rounded-lg">
                              <div className="text-xs text-blue-50">Max Memory</div>
                              <div className="font-bold">{testResults.metrics.maxMemory} KB</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sample Test Cases - visible ones */}
                      {testResults.details?.filter((r, idx) => !isHiddenTestResult(r, idx)).length > 0 && (
                        <div>
                          <h4 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                            <span>Sample Test Cases</span>
                          </h4>
                          <div className="space-y-3">
                            {testResults.details?.map((r, idx) => {
                              const testCase = currentTestCasesNormalized?.[idx];
                              if (isHiddenTestResult(r, idx)) return null;
                              return (
                                <div key={idx} className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-md">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="text-base font-bold text-blue-800">Test Case {idx + 1}</div>
                                    <div className={`text-sm px-3 py-1.5 rounded-full font-bold ${r.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                      {r.passed ? 'PASS' : 'FAIL'}
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-300 shadow-sm">
                                      <div className="font-bold text-blue-700 mb-2">Input:</div>
                                      <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap bg-white p-2 rounded border border-blue-200">
                                        {normalizeDisplayValue(r.input)}
                                      </div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-300 shadow-sm">
                                      <div className="font-bold text-blue-700 mb-2">Expected:</div>
                                      <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap bg-white p-2 rounded border border-blue-200">
                                        {normalizeDisplayValue(r.expected)}
                                      </div>
                                    </div>
                                    <div className={`p-3 rounded-lg border-2 shadow-sm ${r.passed ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                                      <div className={`font-bold mb-2 ${r.passed ? 'text-green-700' : 'text-red-700'}`}>Actual Output:</div>
                                      <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap bg-white p-2 rounded border border-gray-300">
                                        {normalizeDisplayValue(r.actual)}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-300">
                                        <span className="font-bold text-blue-700">Time:</span> <span className="text-gray-700">{normalizeDisplayValue(r.time)}s</span>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-300">
                                        <span className="font-bold text-blue-700">Memory:</span> <span className="text-gray-700">{normalizeDisplayValue(r.memory)} KB</span>
                                      </div>
                                    </div>
                                    {(testCase?.explanation || r.explanation) && (
                                      <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
                                        <div className="font-bold text-blue-800 mb-2">Explanation:</div>
                                        <div className="text-gray-700 text-sm whitespace-pre-wrap">{testCase?.explanation || r.explanation}</div>
                                      </div>
                                    )}
                                    {r.classification && (
                                      <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-semibold text-xs">
                                        {r.classification}
                                      </div>
                                    )}
                                    {r.compile_output && (
                                      <div className="text-amber-800 bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                                        <span className="font-bold">Compile Output:</span> {r.compile_output}
                                      </div>
                                    )}
                                    {r.stderr && !r.compile_output && (
                                      <div className="text-red-800 bg-red-50 border-2 border-red-300 rounded-lg p-3">
                                        <span className="font-bold">Stderr:</span> {r.stderr}
                                      </div>
                                    )}
                                    {r.error && (
                                      <div className="text-red-800 bg-red-50 border-2 border-red-300 rounded-lg p-3">
                                        <span className="font-bold">Error:</span> {r.error}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Hidden Test Cases - show pass/fail but not details */}
                      {testResults.details?.filter((r, idx) => isHiddenTestResult(r, idx)).length > 0 && (
                        <div>
                          <h4 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                            <span>Hidden Test Cases</span>
                          </h4>
                          <div className="space-y-3">
                            {testResults.details?.map((r, idx) => {
                              const testCase = currentTestCasesNormalized?.[idx];
                              if (!isHiddenTestResult(r, idx)) return null;
                              return (
                                <div key={idx} className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-md">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="text-base font-bold text-blue-800">Hidden Test {testResults.details?.filter((item, i) => i <= idx && isHiddenTestResult(item, i)).length || 1}</div>
                                    <div className={`text-sm px-3 py-1.5 rounded-full font-bold ${r.passed ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                      {r.passed ? 'PASS' : 'FAIL'}
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-300">
                                      <div className="font-bold text-blue-700 mb-2">Input:</div>
                                      <div className="italic text-gray-600">Hidden for evaluation</div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-300">
                                      <div className="font-bold text-blue-700 mb-2">Expected:</div>
                                      <div className="italic text-gray-600">Hidden for evaluation</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border-2 shadow-sm ${r.passed ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                                      <div className={`font-bold mb-2 ${r.passed ? 'text-green-700' : 'text-red-700'}`}>Actual Output:</div>
                                      <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap bg-white p-2 rounded border border-gray-300">
                                        {normalizeDisplayValue(r.actual)}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-300">
                                        <span className="font-bold text-blue-700">Time:</span> <span className="text-gray-700">{normalizeDisplayValue(r.time)}s</span>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded-lg border border-blue-300">
                                        <span className="font-bold text-blue-700">Memory:</span> <span className="text-gray-700">{normalizeDisplayValue(r.memory)} KB</span>
                                      </div>
                                    </div>
                                    {r.classification && (
                                      <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-semibold text-xs">
                                        {r.classification}
                                      </div>
                                    )}
                                    {r.compile_output && (
                                      <div className="text-amber-800 bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                                        <span className="font-bold">Compile Output:</span> {r.compile_output}
                                      </div>
                                    )}
                                    {r.stderr && !r.compile_output && (
                                      <div className="text-red-800 bg-red-50 border-2 border-red-300 rounded-lg p-3">
                                        <span className="font-bold">Stderr:</span> {r.stderr}
                                      </div>
                                    )}
                                    {r.error && (
                                      <div className="text-red-800 bg-red-50 border-2 border-red-300 rounded-lg p-3">
                                        <span className="font-bold">Error:</span> {r.error}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20">
                      <div className="mb-4 text-5xl font-black text-blue-200">TEST</div>
                      <h3 className="text-xl font-bold text-gray-600 mb-2">No Test Results Yet</h3>
                      <p className="text-gray-500 text-center max-w-md">
                        Click "Run Sample Tests" to check examples or "Submit Solution" to earn coding points
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompilerPage;
