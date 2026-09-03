const axios = require('axios');

async function fetchProblem(req, res) {
  const { contestId, index } = req.query;

  if (!contestId || !index) {
    return res.status(400).send('contestId and index are required');
  }

  const url = `https://codeforces.com/contest/${encodeURIComponent(contestId)}/problem/${encodeURIComponent(index)}`;

  try {
    const response = await axios.get(url);
    return res.send(response.data);
  } catch (error) {
    console.error('Error fetching Codeforces problem details:', error.message);
    return res.status(500).send('Failed to fetch problem details');
  }
}

module.exports = {
  fetchProblem
};
