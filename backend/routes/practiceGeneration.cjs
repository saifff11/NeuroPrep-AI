const express = require('express');
const controller = require('../controllers/practiceGenerationController.cjs');

const router = express.Router();

router.post('/mcq-questions', controller.generateMcqQuestions);
router.post('/coding-problems', controller.generateCodingProblem);
router.post('/assess-interview', controller.assessInterview);
router.post('/analyze-code', controller.analyzeCode);

module.exports = router;
