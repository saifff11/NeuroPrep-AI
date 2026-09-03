const express = require('express');
const controller = require('../controllers/codeforcesController.cjs');

const router = express.Router();

router.get('/fetchProblem', controller.fetchProblem);

module.exports = router;
