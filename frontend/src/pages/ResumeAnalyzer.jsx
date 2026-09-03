import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  FileText,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Target,
  UploadCloud,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const roleOptions = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'DevOps Engineer',
  'Cybersecurity Analyst',
  'Product Manager',
  'UI/UX Designer',
  'QA Engineer'
];

const scoreTone = (score = 0) => {
  if (score >= 85) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-600' };
  if (score >= 70) return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-600' };
  if (score >= 55) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' };
  return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-600' };
};

const formatDate = (value) => {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeInterviewQuestion = (item, index = 0) => {
  if (!item) return null;

  if (typeof item === 'string') {
    const question = item.trim();
    if (!question) return null;
    return {
      topic: 'Resume Gap',
      difficulty: 'medium',
      type: 'skill-gap',
      question
    };
  }

  const question = String(item.question || item.text || item.prompt || '').trim();
  if (!question) return null;

  return {
    topic: String(item.topic || item.skill || `Question ${index + 1}`).trim(),
    difficulty: String(item.difficulty || 'medium').trim(),
    type: String(item.type || 'skill-gap').trim(),
    question
  };
};

const normalizeInterviewQuestions = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeInterviewQuestion).filter(Boolean);
};

const ScoreCard = ({ icon: Icon, label, value, detail }) => {
  const tone = scoreTone(value);
  return (
    <div className={`rounded-md border ${tone.border} ${tone.bg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${tone.text}`}>{value}%</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80">
          <Icon className={`h-5 w-5 ${tone.text}`} aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white">
        <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </div>
  );
};

const SkillPill = ({ children, type = 'match' }) => {
  const tone = type === 'match'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : 'border-rose-200 bg-rose-50 text-rose-800';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm font-semibold ${tone}`}>
      {type === 'match' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
};

const SectionScore = ({ item }) => {
  const tone = scoreTone(item.score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{item.label}</span>
        <span className={`font-bold ${tone.text}`}>{item.score}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${item.score}%` }} />
      </div>
    </div>
  );
};

const ResumeAnalyzer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Backend Developer');
  const [jobDescription, setJobDescription] = useState('');
  const [targetSkills, setTargetSkills] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const focusSkills = useMemo(() => {
    if (!analysis) return [];
    return (analysis.missingSkills?.length ? analysis.missingSkills : analysis.targetSkills || []).slice(0, 6);
  }, [analysis]);
  const interviewQuestions = useMemo(() => (
    normalizeInterviewQuestions(analysis?.interviewQuestions)
  ), [analysis]);

  const canAnalyze = Boolean(resumeFile || resumeText.trim());

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`${API_BASE}/api/resume/history/${user.uid}?limit=5`);
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.success) {
          setAnalysisHistory(data.history || []);
          if (!analysis && data.latest) setAnalysis(data.latest);
        }
      } catch (historyError) {
        console.warn('Unable to load resume history:', historyError.message);
      }
    };

    loadHistory();
  }, [user?.uid]);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!canAnalyze) {
      setError('Upload a resume or paste resume text.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const form = new FormData();
      if (resumeFile) form.append('resume', resumeFile);
      form.append('resumeText', resumeText);
      form.append('targetRole', targetRole);
      form.append('jobDescription', jobDescription);
      form.append('targetSkills', targetSkills);
      form.append('userId', user?.uid || 'guest');

      const headers = {};
      if (user?.getIdToken) {
        try {
          headers.Authorization = `Bearer ${await user.getIdToken()}`;
        } catch (tokenError) {
          console.warn('Unable to attach Firebase token for resume analysis:', tokenError.message);
        }
      }

      const response = await fetch(`${API_BASE}/api/resume/analyze`, {
        method: 'POST',
        headers,
        body: form
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Resume analysis failed.');
      }

      setAnalysis(data.analysis);
      setAnalysisHistory((current) => [data.analysis, ...current.filter((item) => item.analysisId !== data.analysis.analysisId)].slice(0, 5));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const startSkillGapInterview = () => {
    if (!analysis) return;
    const topic = focusSkills.join(', ') || analysis.targetRole;
    navigate('/face-to-face-interview', {
      state: {
        topic,
        subject: `Skill Gap Interview: ${topic}`,
        jobRole: analysis.targetRole,
        difficulty: 'medium',
        duration: 10,
        numberOfQuestions: Math.min(8, Math.max(3, interviewQuestions.length || 5)),
        subTopicDescription: `Resume gap focus for ${analysis.targetRole}: ${topic}`,
        resumeAnalyzer: true,
        skillGapAnalysis: {
          atsScore: analysis.atsScore,
          jobMatchScore: analysis.jobMatchScore,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          suggestedKeywords: analysis.suggestedKeywords
        }
      }
    });
  };

  const startMcqDrill = () => {
    if (!analysis) return;
    const topic = focusSkills.slice(0, 4).join(', ') || analysis.targetRole;
    navigate('/mcq-interview', {
      state: {
        topic,
        subject: topic,
        jobRole: analysis.targetRole,
        difficulty: 'medium',
        mode: 'MCQ',
        resumeAnalyzer: true,
        missingSkills: analysis.missingSkills
      }
    });
  };

  const resetForm = () => {
    setResumeFile(null);
    setResumeText('');
    setJobDescription('');
    setTargetSkills('');
    setAnalysis(null);
    setError('');
  };

  return (
    <div className="np-page">
      <div className="np-container">
        <div className="np-card-ink mb-6 p-6 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100">
              <Briefcase className="h-4 w-4" />
              Career intelligence lab
            </p>
            <h1 className="text-3xl font-bold tracking-normal text-white sm:text-4xl">Resume Analyzer</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              ATS score, job match, missing skills, roadmap, and interview launch from one workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="np-button-secondary mt-5 lg:mt-0"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <form onSubmit={handleAnalyze} className="np-card p-5 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold">Resume Input</h2>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Upload PDF or TXT</span>
              <input
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {resumeFile && <span className="mt-2 block text-sm font-medium text-slate-500">{resumeFile.name}</span>}
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Paste Resume Text</span>
              <textarea
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                rows={7}
                className="np-field resize-y"
                placeholder="Paste resume text here"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Target Role</span>
                <select
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  className="np-field text-sm font-medium"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Target Skills</span>
                <input
                  value={targetSkills}
                  onChange={(event) => setTargetSkills(event.target.value)}
                  className="np-field text-sm"
                  placeholder="Spring Boot, Docker, AWS"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Target Job Description</span>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                rows={5}
                className="np-field resize-y"
                placeholder="Paste target job description"
              />
            </label>

            {error && (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canAnalyze}
              className="np-button-primary mt-5 w-full disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Analyze Resume
            </button>
          </form>

          <div className="space-y-6 lg:col-span-3">
            {analysis ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ScoreCard icon={BarChart3} label="ATS Score" value={analysis.atsScore} detail="Resume structure and keyword fit" />
                  <ScoreCard icon={Target} label="Job Match" value={analysis.jobMatchScore} detail={`${analysis.matchedSkills.length}/${analysis.targetSkills.length} target skills matched`} />
                  <ScoreCard icon={Activity} label="Readiness" value={analysis.placementReadinessScore} detail="Placement readiness signal" />
                </div>

                <div className="np-card p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-emerald-600" />
                      <h2 className="font-bold">Skill Gap Analysis</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={startSkillGapInterview}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <Brain className="h-4 w-4" />
                        Start Skill Gap Interview
                      </button>
                      <button
                        type="button"
                        onClick={startMcqDrill}
                        className="np-button-secondary"
                      >
                        <FileText className="h-4 w-4" />
                        Start MCQ Drill
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-bold text-emerald-700">Matched Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.matchedSkills.length ? analysis.matchedSkills.map((skill) => (
                          <SkillPill key={skill}>{skill}</SkillPill>
                        )) : <p className="text-sm text-slate-500">No target skills matched yet.</p>}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-bold text-rose-700">Missing Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingSkills.length ? analysis.missingSkills.map((skill) => (
                          <SkillPill key={skill} type="missing">{skill}</SkillPill>
                        )) : <p className="text-sm text-slate-500">No major skill gaps found.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="np-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <h2 className="font-bold">ATS Breakdown</h2>
                    </div>
                    <div className="space-y-4">
                      {analysis.sectionAnalysis.map((item) => (
                        <SectionScore key={item.label} item={item} />
                      ))}
                    </div>
                  </div>

                  <div className="np-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <h2 className="font-bold">Resume Suggestions</h2>
                    </div>
                    <div className="space-y-3">
                      {analysis.suggestions.map((suggestion) => (
                        <p key={suggestion} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{suggestion}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <FileText className="mx-auto h-12 w-12 text-slate-400" />
                  <h2 className="mt-4 text-xl font-bold text-slate-900">No analysis yet</h2>
                  <p className="mt-2 text-sm text-slate-500">Upload or paste a resume to begin.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {analysis && (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="np-card p-5 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                  <h2 className="font-bold">Personalized Roadmap</h2>
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  {analysis.roadmap.currentScore}% to {analysis.roadmap.targetScore}%+
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {analysis.roadmap.weeks.map((week) => (
                  <div key={week.week} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-blue-700">Week {week.week}</p>
                    <h3 className="mt-1 font-bold text-slate-950">{week.focus}</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {week.goals.map((goal) => (
                        <li key={goal} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 rounded-md bg-white p-3 text-sm font-medium text-slate-700">{week.outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="np-card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <h2 className="font-bold">Interview Questions</h2>
                </div>
                <button
                  type="button"
                  onClick={startSkillGapInterview}
                  className="np-button-primary px-3 py-2"
                >
                  Start
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {interviewQuestions.map((item, index) => (
                  <div key={`${item.topic}-${index}`} className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-normal text-blue-700">{item.topic}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{item.question}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {analysisHistory.length > 0 && (
          <div className="np-card mt-6 p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold">Resume Analysis History</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {analysisHistory.map((item) => (
                <button
                  type="button"
                  key={item.analysisId || item._id}
                  onClick={() => setAnalysis(item)}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-950">{item.targetRole}</p>
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{item.atsScore}% ATS</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Match {item.jobMatchScore}% - Readiness {item.placementReadinessScore}%
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {formatDate(item.createdAt || item.analyzedAt)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
