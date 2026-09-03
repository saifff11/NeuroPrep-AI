const test = require('node:test');
const assert = require('node:assert/strict');

const {
  analyzeResumeText,
  detectSkills,
  getTargetSkills,
  normalizeInterviewQuestions,
  skillAppearsInText
} = require('../services/resumeAnalyzerService.cjs');

test('detects resume skills without confusing Java and JavaScript', () => {
  const text = 'Built projects using Java, MySQL, HTML, and CSS.';

  assert.equal(skillAppearsInText(text, 'Java'), true);
  assert.equal(skillAppearsInText('Built frontend with JavaScript', 'Java'), false);
  assert.equal(skillAppearsInText(text, 'SQL'), true);
});

test('combines role, job description, and explicit target skills', () => {
  const targetSkills = getTargetSkills({
    targetRole: 'Backend Developer',
    jobDescription: 'Need Spring Boot, Docker, AWS, and REST APIs.',
    targetSkills: 'Kafka, Redis'
  });

  assert.ok(targetSkills.includes('Spring Boot'));
  assert.ok(targetSkills.includes('Docker'));
  assert.ok(targetSkills.includes('AWS'));
  assert.ok(targetSkills.includes('Kafka'));
  assert.ok(targetSkills.includes('Redis'));
});

test('analyzes ATS score, matched skills, missing skills, roadmap, and interview questions', () => {
  const analysis = analyzeResumeText({
    targetRole: 'Backend Developer',
    jobDescription: 'Target job requires Java, Spring Boot, REST API, Docker, AWS, and SQL.',
    resumeText: `
      Saif Ali
      saif@example.com | +91 9876543210 | github.com/saif
      Summary
      Backend-focused student with Java and MySQL experience.
      Skills
      Java, MySQL, HTML, CSS, Git
      Projects
      Built a student management project using Java and MySQL. Improved query performance by 25%.
      Education
      B.Tech Computer Science
    `
  });

  assert.ok(analysis.atsScore > 0);
  assert.ok(analysis.jobMatchScore > 0);
  assert.ok(analysis.matchedSkills.includes('Java'));
  assert.ok(analysis.matchedSkills.includes('SQL'));
  assert.ok(analysis.missingSkills.includes('Spring Boot'));
  assert.ok(analysis.missingSkills.includes('Docker'));
  assert.ok(analysis.missingSkills.includes('AWS'));
  assert.equal(analysis.roadmap.weeks.length, 4);
  assert.ok(analysis.interviewQuestions.length >= 4);
  assert.equal(typeof analysis.interviewQuestions[0], 'object');
  assert.equal(typeof analysis.interviewQuestions[0].question, 'string');
});

test('detects skills with categories for UI grouping', () => {
  const skills = detectSkills('React, Node.js, MongoDB, Docker, AWS');
  const names = skills.map((skill) => skill.name);

  assert.deepEqual(names, ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS']);
  assert.ok(skills.every((skill) => skill.category));
});

test('normalizes legacy string interview questions into object shape', () => {
  const questions = normalizeInterviewQuestions([
    'How would you explain Docker in a backend interview?',
    {
      topic: 'AWS',
      question: 'How would you deploy a backend project on AWS?'
    }
  ]);

  assert.deepEqual(questions[0], {
    topic: 'Resume Gap',
    difficulty: 'medium',
    type: 'skill-gap',
    question: 'How would you explain Docker in a backend interview?'
  });
  assert.equal(questions[1].topic, 'AWS');
  assert.equal(questions[1].difficulty, 'medium');
});
