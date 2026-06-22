const ROLE_SKILL_MAP = {
  'Software Engineer': ['Java', 'Python', 'JavaScript', 'Data Structures', 'Algorithms', 'OOP', 'SQL', 'REST API', 'Git', 'System Design'],
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'REST API', 'Git', 'Accessibility', 'UI/UX'],
  'Backend Developer': ['Java', 'Node.js', 'Spring Boot', 'REST API', 'SQL', 'MongoDB', 'Docker', 'AWS', 'Microservices', 'System Design'],
  'Full Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'REST API', 'SQL', 'MongoDB', 'Docker', 'Git'],
  'Data Analyst': ['SQL', 'Python', 'Excel', 'Power BI', 'Statistics', 'Data Visualization', 'ETL', 'Tableau'],
  'Data Scientist': ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy', 'Deep Learning', 'Data Visualization'],
  'DevOps Engineer': ['Linux', 'Git', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Monitoring'],
  'Cybersecurity Analyst': ['Network Security', 'Linux', 'OWASP', 'SIEM', 'Incident Response', 'Cryptography', 'Cloud Security'],
  'Product Manager': ['Product Strategy', 'User Research', 'Roadmapping', 'Analytics', 'Agile', 'Stakeholder Management', 'SQL'],
  'UI/UX Designer': ['UI/UX', 'Figma', 'User Research', 'Design Systems', 'Prototyping', 'Accessibility', 'Wireframing'],
  'QA Engineer': ['Manual Testing', 'Automation Testing', 'Selenium', 'API Testing', 'Test Cases', 'SQL', 'CI/CD']
};

const SKILL_LIBRARY = [
  { name: 'Java', category: 'Programming', aliases: ['java'] },
  { name: 'Python', category: 'Programming', aliases: ['python', 'python3'] },
  { name: 'JavaScript', category: 'Programming', aliases: ['javascript', 'js', 'ecmascript'] },
  { name: 'TypeScript', category: 'Programming', aliases: ['typescript', 'ts'] },
  { name: 'C++', category: 'Programming', aliases: ['c++', 'cpp'] },
  { name: 'C#', category: 'Programming', aliases: ['c#', 'c sharp', 'csharp'] },
  { name: 'HTML', category: 'Frontend', aliases: ['html', 'html5'] },
  { name: 'CSS', category: 'Frontend', aliases: ['css', 'css3'] },
  { name: 'React', category: 'Frontend', aliases: ['react', 'react.js', 'reactjs'] },
  { name: 'Angular', category: 'Frontend', aliases: ['angular', 'angular.js'] },
  { name: 'Vue.js', category: 'Frontend', aliases: ['vue', 'vue.js', 'vuejs'] },
  { name: 'Node.js', category: 'Backend', aliases: ['node', 'node.js', 'nodejs'] },
  { name: 'Express.js', category: 'Backend', aliases: ['express', 'express.js', 'expressjs'] },
  { name: 'Spring Boot', category: 'Backend', aliases: ['spring boot', 'springboot', 'spring framework'] },
  { name: 'REST API', category: 'Backend', aliases: ['rest api', 'restful api', 'rest', 'api development', 'api design'] },
  { name: 'Microservices', category: 'Backend', aliases: ['microservices', 'microservice architecture'] },
  { name: 'SQL', category: 'Database', aliases: ['sql', 'mysql', 'postgresql', 'postgres', 'oracle sql', 'mssql'] },
  { name: 'MongoDB', category: 'Database', aliases: ['mongodb', 'mongo db', 'mongoose'] },
  { name: 'Firebase', category: 'Database', aliases: ['firebase', 'firestore'] },
  { name: 'Data Structures', category: 'Computer Science', aliases: ['data structures', 'dsa'] },
  { name: 'Algorithms', category: 'Computer Science', aliases: ['algorithms', 'algorithm design', 'dsa'] },
  { name: 'OOP', category: 'Computer Science', aliases: ['oop', 'object oriented programming', 'object-oriented programming'] },
  { name: 'System Design', category: 'Architecture', aliases: ['system design', 'scalability', 'high level design', 'hld'] },
  { name: 'Git', category: 'Tools', aliases: ['git', 'github', 'gitlab', 'version control'] },
  { name: 'Linux', category: 'Tools', aliases: ['linux', 'ubuntu', 'shell scripting', 'bash'] },
  { name: 'Docker', category: 'DevOps', aliases: ['docker', 'containerization', 'containers'] },
  { name: 'Kubernetes', category: 'DevOps', aliases: ['kubernetes', 'k8s'] },
  { name: 'AWS', category: 'Cloud', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  { name: 'Azure', category: 'Cloud', aliases: ['azure', 'microsoft azure'] },
  { name: 'GCP', category: 'Cloud', aliases: ['gcp', 'google cloud'] },
  { name: 'CI/CD', category: 'DevOps', aliases: ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions'] },
  { name: 'Terraform', category: 'DevOps', aliases: ['terraform', 'iac', 'infrastructure as code'] },
  { name: 'Monitoring', category: 'DevOps', aliases: ['monitoring', 'prometheus', 'grafana', 'observability'] },
  { name: 'Machine Learning', category: 'AI/Data', aliases: ['machine learning', 'ml', 'sklearn', 'scikit-learn'] },
  { name: 'Deep Learning', category: 'AI/Data', aliases: ['deep learning', 'neural networks', 'tensorflow', 'pytorch'] },
  { name: 'Pandas', category: 'AI/Data', aliases: ['pandas'] },
  { name: 'NumPy', category: 'AI/Data', aliases: ['numpy'] },
  { name: 'Statistics', category: 'AI/Data', aliases: ['statistics', 'statistical analysis', 'probability'] },
  { name: 'Excel', category: 'Analytics', aliases: ['excel', 'advanced excel', 'spreadsheets'] },
  { name: 'Power BI', category: 'Analytics', aliases: ['power bi', 'powerbi'] },
  { name: 'Tableau', category: 'Analytics', aliases: ['tableau'] },
  { name: 'Data Visualization', category: 'Analytics', aliases: ['data visualization', 'visualisation', 'dashboarding'] },
  { name: 'ETL', category: 'Analytics', aliases: ['etl', 'data cleaning', 'data pipeline'] },
  { name: 'Network Security', category: 'Security', aliases: ['network security', 'firewall', 'ids', 'ips'] },
  { name: 'OWASP', category: 'Security', aliases: ['owasp', 'web security', 'application security'] },
  { name: 'SIEM', category: 'Security', aliases: ['siem', 'splunk', 'security monitoring'] },
  { name: 'Incident Response', category: 'Security', aliases: ['incident response', 'threat response'] },
  { name: 'Cryptography', category: 'Security', aliases: ['cryptography', 'encryption', 'hashing'] },
  { name: 'Cloud Security', category: 'Security', aliases: ['cloud security', 'iam', 'identity access management'] },
  { name: 'Manual Testing', category: 'Testing', aliases: ['manual testing', 'functional testing'] },
  { name: 'Automation Testing', category: 'Testing', aliases: ['automation testing', 'test automation'] },
  { name: 'Selenium', category: 'Testing', aliases: ['selenium', 'selenium webdriver'] },
  { name: 'API Testing', category: 'Testing', aliases: ['api testing', 'postman'] },
  { name: 'Test Cases', category: 'Testing', aliases: ['test cases', 'test scenarios', 'test plan'] },
  { name: 'Agile', category: 'Product', aliases: ['agile', 'scrum', 'kanban'] },
  { name: 'Product Strategy', category: 'Product', aliases: ['product strategy', 'product management'] },
  { name: 'Roadmapping', category: 'Product', aliases: ['roadmap', 'roadmapping'] },
  { name: 'Stakeholder Management', category: 'Product', aliases: ['stakeholder management', 'stakeholders'] },
  { name: 'Analytics', category: 'Product', aliases: ['analytics', 'metrics', 'kpi', 'a/b testing'] },
  { name: 'UI/UX', category: 'Design', aliases: ['ui/ux', 'ux design', 'ui design', 'user experience'] },
  { name: 'Figma', category: 'Design', aliases: ['figma'] },
  { name: 'User Research', category: 'Design', aliases: ['user research', 'usability testing'] },
  { name: 'Design Systems', category: 'Design', aliases: ['design systems', 'component library'] },
  { name: 'Prototyping', category: 'Design', aliases: ['prototyping', 'prototype'] },
  { name: 'Wireframing', category: 'Design', aliases: ['wireframing', 'wireframes'] },
  { name: 'Accessibility', category: 'Design', aliases: ['accessibility', 'a11y', 'wcag'] }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function skillAppearsInText(text, skillName) {
  const skill = getSkillDefinition(skillName);
  const aliases = skill ? [skill.name, ...skill.aliases] : [skillName];
  const source = String(text || '').toLowerCase();

  return aliases.some((alias) => {
    const term = String(alias || '').trim().toLowerCase();
    if (!term) return false;
    if (/^[a-z0-9#]{1,2}$/.test(term)) {
      const shortPattern = new RegExp(`(^|[\\s,;(/-])${escapeRegex(term)}([\\s,;)/-]|$)`, 'i');
      return shortPattern.test(source);
    }
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, 'i');
    return pattern.test(source);
  });
}

function normalizeSkillLabel(value) {
  const raw = String(value || '').trim();
  const known = getSkillDefinition(raw);
  if (known) return known.name;
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(' ');
}

function getSkillDefinition(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;

  return SKILL_LIBRARY.find((skill) => (
    skill.name.toLowerCase() === raw ||
    skill.aliases.some((alias) => alias.toLowerCase() === raw)
  )) || null;
}

function uniqueSkills(values) {
  const seen = new Set();
  const output = [];

  values
    .map(normalizeSkillLabel)
    .filter(Boolean)
    .forEach((skill) => {
      const key = skill.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        output.push(skill);
      }
    });

  return output;
}

function parseSkillInput(value) {
  if (Array.isArray(value)) return uniqueSkills(value);
  return uniqueSkills(String(value || '').split(/[,;\n]/));
}

function detectSkills(text) {
  return SKILL_LIBRARY
    .filter((skill) => skillAppearsInText(text, skill.name))
    .map((skill) => ({ name: skill.name, category: skill.category }));
}

function getTargetSkills({ targetRole, jobDescription, targetSkills }) {
  const role = ROLE_SKILL_MAP[targetRole] ? targetRole : 'Software Engineer';
  const roleSkills = ROLE_SKILL_MAP[role] || ROLE_SKILL_MAP['Software Engineer'];
  const jdSkills = jobDescription ? detectSkills(jobDescription).map((skill) => skill.name) : [];
  const explicitSkills = parseSkillInput(targetSkills);
  return uniqueSkills([...roleSkills, ...jdSkills, ...explicitSkills]);
}

function hasContactInfo(text) {
  return {
    email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
    phone: /(\+?\d[\d\s().-]{7,}\d)/.test(text),
    portfolio: /(linkedin\.com|github\.com|portfolio|behance\.net|dribbble\.com)/i.test(text)
  };
}

function sectionPresence(text) {
  const source = String(text || '').toLowerCase();
  return {
    summary: /(summary|profile|objective)/i.test(source),
    skills: /(skills|technical skills|technologies)/i.test(source),
    experience: /(experience|internship|employment|work history)/i.test(source),
    projects: /(projects|project work|portfolio)/i.test(source),
    education: /(education|degree|bachelor|master|university|college)/i.test(source),
    certifications: /(certification|certifications|certificate)/i.test(source)
  };
}

function calculateContentDepth(text) {
  const source = String(text || '');
  const words = source.split(/\s+/).filter(Boolean).length;
  const actionVerbs = (source.match(/\b(built|created|developed|designed|implemented|improved|optimized|managed|led|deployed|analyzed|automated)\b/gi) || []).length;
  const metrics = (source.match(/\b\d+(\.\d+)?%?|\b(increased|reduced|improved|optimized|decreased)\b/gi) || []).length;
  const lengthScore = clamp(Math.round((words / 450) * 100), 20, 100);
  const verbScore = clamp(actionVerbs * 12, 0, 100);
  const metricScore = clamp(metrics * 15, 0, 100);
  return Math.round(lengthScore * 0.45 + verbScore * 0.25 + metricScore * 0.3);
}

function buildSectionAnalysis({ skillScore, sectionScore, contactScore, contentDepth }) {
  return [
    { label: 'Skill Coverage', score: skillScore },
    { label: 'Resume Sections', score: sectionScore },
    { label: 'Contact Details', score: contactScore },
    { label: 'Impact Metrics', score: contentDepth },
    { label: 'ATS Keyword Fit', score: Math.round(skillScore * 0.75 + sectionScore * 0.25) }
  ];
}

function buildSuggestions({ missingSkills, sections, contact, contentDepth }) {
  const suggestions = [];

  if (missingSkills.length) {
    suggestions.push(`Add evidence for ${missingSkills.slice(0, 4).join(', ')} in projects or experience.`);
  }
  if (!sections.projects) suggestions.push('Add a Projects section with role-relevant implementations.');
  if (!sections.skills) suggestions.push('Add a Technical Skills section with grouped keywords.');
  if (!sections.summary) suggestions.push('Add a short role-focused summary at the top.');
  if (!contact.email || !contact.phone || !contact.portfolio) suggestions.push('Include email, phone, and a LinkedIn or GitHub link.');
  if (contentDepth < 65) suggestions.push('Use measurable bullets with action verbs and quantified impact.');

  return suggestions.slice(0, 6);
}

function buildRoadmap({ missingSkills, targetRole, atsScore }) {
  const fallbackSkills = ROLE_SKILL_MAP[targetRole] || ROLE_SKILL_MAP['Software Engineer'];
  const focusSkills = (missingSkills.length ? missingSkills : fallbackSkills).slice(0, 8);
  const weeks = [];

  for (let index = 0; index < 4; index += 1) {
    const first = focusSkills[index * 2] || focusSkills[index % focusSkills.length] || 'Core fundamentals';
    const second = focusSkills[index * 2 + 1];
    const skills = second ? [first, second] : [first];
    weeks.push({
      week: index + 1,
      focus: skills.join(' + '),
      goals: [
        `Learn the interview fundamentals of ${skills.join(' and ')}.`,
        `Build one mini project or note set using ${skills[0]}.`,
        `Practice MCQs and one spoken answer for ${skills.join(', ')}.`
      ],
      outcome: `Add resume bullets and interview examples around ${skills.join(', ')}.`
    });
  }

  return {
    currentScore: atsScore,
    targetScore: Math.max(85, Math.min(95, atsScore + 18)),
    weeks
  };
}

function buildInterviewQuestions({ missingSkills, targetSkills, targetRole }) {
  const topics = (missingSkills.length ? missingSkills : targetSkills).slice(0, 6);
  const questions = [];

  topics.forEach((skill) => {
    questions.push({
      topic: skill,
      difficulty: 'medium',
      type: 'skill-gap',
      question: `How would you apply ${skill} in a ${targetRole} project?`
    });
    questions.push({
      topic: skill,
      difficulty: 'medium',
      type: 'follow-up',
      question: `What common mistakes should a candidate avoid while working with ${skill}?`
    });
  });

  return questions.slice(0, 10);
}

function analyzeResumeText({ resumeText, targetRole = 'Software Engineer', jobDescription = '', targetSkills = [] } = {}) {
  const text = String(resumeText || '').trim();
  if (text.length < 40) {
    throw new Error('Resume text is too short for analysis.');
  }

  const role = ROLE_SKILL_MAP[targetRole] ? targetRole : 'Software Engineer';
  const target = getTargetSkills({ targetRole: role, jobDescription, targetSkills });
  const extractedSkills = detectSkills(text);
  const matchedSkills = target.filter((skill) => skillAppearsInText(text, skill));
  const missingSkills = target.filter((skill) => !matchedSkills.some((matched) => matched.toLowerCase() === skill.toLowerCase()));
  const skillScore = target.length ? Math.round((matchedSkills.length / target.length) * 100) : 0;
  const contact = hasContactInfo(text);
  const contactScore = Math.round((Object.values(contact).filter(Boolean).length / Object.keys(contact).length) * 100);
  const sections = sectionPresence(text);
  const sectionScore = Math.round((Object.values(sections).filter(Boolean).length / Object.keys(sections).length) * 100);
  const contentDepth = calculateContentDepth(text);
  const atsScore = clamp(Math.round(skillScore * 0.65 + sectionScore * 0.18 + contactScore * 0.1 + contentDepth * 0.07), 0, 100);
  const jobMatchScore = skillScore;
  const placementReadinessScore = clamp(Math.round(atsScore * 0.55 + jobMatchScore * 0.35 + contentDepth * 0.1), 0, 100);

  return {
    analysisId: `resume_${Date.now()}`,
    targetRole: role,
    atsScore,
    jobMatchScore,
    placementReadinessScore,
    matchedSkills,
    missingSkills,
    extractedSkills,
    targetSkills: target,
    suggestedKeywords: uniqueSkills(missingSkills).slice(0, 12),
    sectionAnalysis: buildSectionAnalysis({ skillScore, sectionScore, contactScore, contentDepth }),
    suggestions: buildSuggestions({ missingSkills, sections, contact, contentDepth }),
    roadmap: buildRoadmap({ missingSkills, targetRole: role, atsScore }),
    interviewQuestions: buildInterviewQuestions({ missingSkills, targetSkills: target, targetRole: role }),
    resumeSummary: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
      sections,
      contact,
      detectedSkillCount: extractedSkills.length
    }
  };
}

function getSupportedRoles() {
  return Object.keys(ROLE_SKILL_MAP);
}

module.exports = {
  analyzeResumeText,
  detectSkills,
  getSupportedRoles,
  getTargetSkills,
  skillAppearsInText
};
