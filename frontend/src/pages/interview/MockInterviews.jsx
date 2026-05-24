import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  Code2,
  Layers3,
  Library,
  MonitorCog,
  PlayCircle,
  Route,
  SearchCheck,
  Settings2,
  Sparkles,
  UserRoundCheck,
  X,
} from 'lucide-react';
import RoundRoadmapModal from '../../components/interview/RoundRoadmapModal';
import ChooseYourPath from '../../components/interview/ChooseYourPath';
import { tracksConfig } from '../../config/tracksConfig';
import { practiceDomains } from '../../config/practiceConfig';
import { frameworksAndTools, programmingLanguages } from '../../config/techSectionsConfig';

const categoryDetails = {
  tech: {
    eyebrow: 'Technical practice suite',
    title: 'Build technical interview readiness with AI workflows.',
    copy: 'Choose a technical library, role track, or round map to start coding, MCQ, and face-to-face preparation.',
    icon: Code2,
  },
  nonTech: {
    eyebrow: 'Business practice suite',
    title: 'Practice strategy, product, design, and leadership interviews.',
    copy: 'Turn non-technical interview prep into a structured AI coaching workflow.',
    icon: BriefcaseBusiness,
  },
  company: {
    eyebrow: 'Company practice suite',
    title: 'Train for company-specific hiring pipelines.',
    copy: 'Prepare for aptitude, coding, technical, managerial, and HR rounds with guided AI workflows.',
    icon: Building2,
  },
};

const techSections = [
  {
    key: 'languages',
    title: 'Programming Languages',
    copy: 'Practice language-specific concepts, syntax, and interview patterns.',
    icon: Code2,
    count: programmingLanguages.length,
    label: 'Languages',
  },
  {
    key: 'domains',
    title: 'Domain Practice',
    copy: 'Explore software, cyber, data, web, mobile, cloud, and DevOps domains.',
    icon: Library,
    count: practiceDomains.length,
    label: 'Domains',
  },
  {
    key: 'frameworks',
    title: 'Frameworks & Tools',
    copy: 'Build confidence with modern frameworks, cloud tools, and databases.',
    icon: Settings2,
    count: frameworksAndTools.length,
    label: 'Technologies',
  },
];

const modeIcon = {
  MCQ: BrainCircuit,
  'Coding Compiler': MonitorCog,
  'Interview Person to Person': UserRoundCheck,
};

const interviewModes = [
  {
    name: 'MCQ',
    desc: 'Multiple-choice diagnostic round',
    route: '/mcq-interview',
  },
  {
    name: 'Coding Compiler',
    desc: 'Live coding practice workspace',
    route: '/compiler',
  },
  {
    name: 'Interview Person to Person',
    desc: 'AI face-to-face interview',
    route: '/face-to-face-interview',
  },
];

const codingEligibleTopics = new Set([
  'DSA',
  'System Design',
  'OOP',
  'Concurrency',
  'Testing',
  'Databases',
  'APIs & REST',
  'SQL',
  'ML Models',
  'Feature Engineering',
  'Python/R',
  'Python',
  'Statistics',
]);

const getResponsiveImage = (src) => {
  const isUnsplash = src && src.includes('images.unsplash.com');
  const base = src ? src.split('?')[0] : '';
  return {
    src800: isUnsplash ? `${base}?auto=format&fit=crop&w=800&q=70` : src,
    srcSet: isUnsplash
      ? `${base}?auto=format&fit=crop&w=400&q=60 400w, ${base}?auto=format&fit=crop&w=800&q=70 800w, ${base}?auto=format&fit=crop&w=1200&q=75 1200w`
      : undefined,
  };
};

const BackButton = ({ onClick, children = 'Back' }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    {children}
  </button>
);

const MockInterviews = () => {
  const { category: urlCategory } = useParams();
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showSubTopics, setShowSubTopics] = useState(false);
  const [selectedMock, setSelectedMock] = useState(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(
    urlCategory === 'tech' ? 'tech' :
      urlCategory === 'non-tech' ? 'nonTech' :
        urlCategory === 'company' ? 'company' : null
  );
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [selectedTrackKey, setSelectedTrackKey] = useState(null);
  const [showLanguageTopics, setShowLanguageTopics] = useState(false);
  const [selectedLanguageDomain, setSelectedLanguageDomain] = useState(null);
  const [selectedTechSection, setSelectedTechSection] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (urlCategory === 'tech') setSelectedCategory('tech');
    else if (urlCategory === 'non-tech') setSelectedCategory('nonTech');
    else if (urlCategory === 'company') setSelectedCategory('company');
    else setSelectedCategory(null);
  }, [urlCategory]);

  const categoryInfo = categoryDetails[selectedCategory] || categoryDetails.tech;
  const CategoryIcon = categoryInfo.icon;

  const getModesForSubTopic = (topicName) => {
    if (!topicName) return interviewModes.filter((mode) => mode.name !== 'Coding Compiler');
    const includeCoding = codingEligibleTopics.has(topicName);
    return interviewModes.filter((mode) => (includeCoding ? true : mode.name !== 'Coding Compiler'));
  };

  const handleStartPractice = (track) => {
    setSelectedMock(track);
    setSelectedSubTopic(null);
    setShowSubTopics(true);
    setShowModeSelection(false);
    setSelectedTrackKey(track.key);
  };

  const handleSubTopicSelect = (topic) => {
    setSelectedSubTopic(topic);
    setShowSubTopics(false);
    setShowModeSelection(false);
    setShowRoadmap(true);
  };

  const handleModeSelect = (mode) => {
    setShowModeSelection(false);
    navigate(mode.route, {
      state: {
        jobRole: selectedMock?.title,
        subject: selectedSubTopic?.name,
        subTopicDescription: selectedSubTopic?.desc,
        mode: mode.name,
      },
    });
  };

  const routeForMode = (mode) => {
    switch (mode) {
      case 'MCQ': return '/mcq-interview';
      case 'Coding Compiler': return '/compiler';
      case 'Person-to-Person': return '/face-to-face-interview';
      default: return null;
    }
  };

  const handleRoundSelect = (round) => {
    const route = routeForMode(round.mode);
    if (!route) return;
    setShowRoadmap(false);
    navigate(route, {
      state: {
        jobRole: selectedMock?.title,
        subject: selectedSubTopic?.name,
        subTopicDescription: selectedSubTopic?.desc,
        roundId: round.id,
        mode: round.mode,
      },
    });
  };

  const handleResetCategory = () => {
    setSelectedCategory(null);
    setSelectedMock(null);
    setSelectedTechSection(null);
    navigate('/practice');
  };

  const PracticeHeader = () => (
    <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:flex lg:items-end lg:justify-between lg:gap-8">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
          <CategoryIcon className="h-4 w-4" aria-hidden="true" />
          {categoryInfo.eyebrow}
        </div>
        <h1 className="max-w-3xl text-3xl font-bold text-slate-950 sm:text-4xl">{categoryInfo.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{categoryInfo.copy}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 lg:mt-0">
        {selectedTechSection && (
          <BackButton onClick={() => setSelectedTechSection(null)}>Sections</BackButton>
        )}
        <BackButton onClick={handleResetCategory}>Change path</BackButton>
      </div>
    </div>
  );

  const TechSectionGrid = () => (
    <div className="mb-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Practice libraries</h2>
          <p className="mt-1 text-sm text-slate-600">Use fast topic libraries before starting a formal interview track.</p>
        </div>
        <span className="hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 sm:inline-flex">
          AI practice catalog
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {techSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.button
              type="button"
              key={section.key}
              onClick={() => setSelectedTechSection(section.key)}
              className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-lg"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                  {section.count} {section.label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-950">{section.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.copy}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
                Open library
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const SkillCard = ({ item, type, onClick, index }) => (
    <motion.button
      type="button"
      onClick={onClick}
      className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-lg"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br ${item.color || item.gradient || 'from-slate-800 to-slate-950'} text-white`}>
          <SearchCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
          {type}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-950">{item.name || item.title}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">{item.description || item.desc}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(item.topics || []).slice(0, 4).map((topic) => (
          <span key={topic} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
            {topic}
          </span>
        ))}
      </div>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
        Start practice
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </motion.button>
  );

  const TrackCard = ({ track, index }) => {
    const image = getResponsiveImage(track.img);
    return (
      <motion.div
        className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 hover:shadow-lg"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -4 }}
      >
        <div className="relative h-44 overflow-hidden bg-slate-200">
          <img
            src={image.src800}
            srcSet={image.srcSet}
            sizes="(min-width:1280px) 30vw, (min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
            loading="lazy"
            decoding="async"
            alt={`${track.title} cover`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-md bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-700">
            {track.subTopics.length} topics
          </span>
        </div>
        <div className="flex min-h-[270px] flex-col p-5">
          <h3 className="text-xl font-bold text-slate-950">{track.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{track.desc}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {track.subTopics.slice(0, 4).map((topic) => (
              <span key={topic.name} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                {topic.name}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleStartPractice(track)}
            className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            Select track
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="saas-grid min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!selectedCategory && (
          <ChooseYourPath
            onSelectTrack={(trackType) => {
              const path = trackType === 'nonTech' ? 'non-tech' : trackType;
              navigate(`/practice/${path}`);
            }}
          />
        )}

        {selectedCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PracticeHeader />

            {selectedCategory === 'tech' && !selectedTechSection && <TechSectionGrid />}

            {selectedCategory === 'tech' && selectedTechSection === 'languages' && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-slate-950">Programming language library</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {programmingLanguages.map((language, index) => (
                    <SkillCard
                      key={language.id}
                      item={language}
                      type={language.difficulty}
                      index={index}
                      onClick={() => {
                        navigate('/practice-session', {
                          state: {
                            type: 'language',
                            language: language.name,
                            languageId: language.id,
                            topics: language.topics,
                            difficulty: language.difficulty,
                          },
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'tech' && selectedTechSection === 'domains' && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-slate-950">Domain practice library</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {practiceDomains.map((domain, index) => (
                    <SkillCard
                      key={domain.id}
                      item={domain}
                      type={`${domain.topics.length} topics`}
                      index={index}
                      onClick={() => {
                        setSelectedLanguageDomain(domain);
                        setShowLanguageTopics(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedCategory === 'tech' && selectedTechSection === 'frameworks' && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-slate-950">Frameworks and tools library</h2>
                {Object.entries(
                  frameworksAndTools.reduce((groups, tool) => {
                    const category = tool.category || 'Other';
                    return { ...groups, [category]: [...(groups[category] || []), tool] };
                  }, {})
                ).map(([group, tools]) => (
                  <div key={group} className="mb-8">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">{group}</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {tools.map((tool, index) => (
                        <SkillCard
                          key={tool.id}
                          item={tool}
                          type={tool.category}
                          index={index}
                          onClick={() => {
                            navigate('/practice-session', {
                              state: {
                                type: 'tool',
                                tool: tool.name,
                                toolId: tool.id,
                                topics: tool.topics,
                                category: tool.category,
                              },
                            });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedCategory && !selectedTechSection && (
              <div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Interview tracks</h2>
                    <p className="mt-1 text-sm text-slate-600">Select a role or company track to open an AI round roadmap.</p>
                  </div>
                  <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 sm:flex">
                    <Route className="h-4 w-4 text-cyan-600" aria-hidden="true" />
                    Round map enabled
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tracksConfig[selectedCategory].map((track, index) => (
                    <TrackCard key={track.key} track={track} index={index} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showModeSelection && selectedMock && selectedSubTopic && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModeSelection(false)}
          >
            <motion.div
              className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    Practice mode
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">Choose interview mode</h3>
                  <p className="mt-2 text-sm text-slate-600">{selectedMock.title} / {selectedSubTopic.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModeSelection(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close mode selection"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3">
                {getModesForSubTopic(selectedSubTopic.name).map((mode, index) => {
                  const Icon = modeIcon[mode.name] || BrainCircuit;
                  return (
                    <motion.button
                      type="button"
                      key={mode.name}
                      className="group flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-slate-50"
                      onClick={() => handleModeSelect(mode)}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-950">{mode.name}</p>
                        <p className="mt-1 text-sm text-slate-600">{mode.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" aria-hidden="true" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubTopics && selectedMock && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSubTopics(false)}
          >
            <motion.div
              className="w-full max-w-5xl rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                    <Layers3 className="h-4 w-4" aria-hidden="true" />
                    {selectedMock.subTopics.length} topics
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">{selectedMock.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{selectedMock.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubTopics(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close topic selection"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-2 md:grid-cols-2 lg:grid-cols-3">
                {selectedMock.subTopics.map((topic, index) => (
                  <motion.button
                    type="button"
                    key={topic.name}
                    className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-cyan-300 hover:bg-white"
                    onClick={() => handleSubTopicSelect(topic)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-bold text-slate-950">{topic.name}</p>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" aria-hidden="true" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{topic.desc}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RoundRoadmapModal
        open={showRoadmap && !!selectedTrackKey}
        onClose={() => setShowRoadmap(false)}
        trackKey={selectedTrackKey}
        onSelectRound={handleRoundSelect}
      />

      <AnimatePresence>
        {showLanguageTopics && selectedLanguageDomain && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLanguageTopics(false)}
          >
            <motion.div
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700">
                    <Library className="h-4 w-4" aria-hidden="true" />
                    Domain topics
                  </div>
                  <h2 className="text-2xl font-bold text-slate-950">{selectedLanguageDomain.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{selectedLanguageDomain.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLanguageTopics(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close domain topics"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {selectedLanguageDomain.topics.map((topic, index) => (
                  <motion.button
                    type="button"
                    key={topic}
                    onClick={() => {
                      navigate('/practice-session', {
                        state: {
                          domain: selectedLanguageDomain.id,
                          domainTitle: selectedLanguageDomain.title,
                          topic,
                          languages: selectedLanguageDomain.languages,
                          difficulty: 'medium',
                        },
                      });
                    }}
                    className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-cyan-300 hover:bg-white"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.025 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-slate-950">{topic}</p>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Practice {topic.toLowerCase()} concepts and problems.</p>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Available languages</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLanguageDomain.languages.map((language) => (
                    <span key={language} className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockInterviews;
