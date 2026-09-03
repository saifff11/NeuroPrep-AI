// Md Saif AliPERMAENENT
// AMMANANNAPERMANENENT
import React from 'react';
import { useLocation } from 'react-router-dom';
import CompilerPage from '../../components/interview/CompilerPage.jsx';
import { createPracticeProblem } from '../../utils/practiceProblemFactory';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Compiler = () => {
  const location = useLocation();
  const { user } = useAuth();
  const contest = location.state?.contest;
  const stateProblem = location.state?.problemData || null;
  const stateTopic = location.state?.selectedTopic || location.state?.topic || location.state?.subject || 'Algorithms';
  const stateDifficulty = location.state?.difficulty || 'medium';
  const trackTitle = location.state?.trackTitle || 'Compiler Practice';
  const roundLabel = location.state?.roundLabel || 'Coding Compiler';
  
  // If contest has problems, pass the first problem as problemData
  const problemData = React.useMemo(() => (
    stateProblem || contest?.problems?.[0] || createPracticeProblem(stateTopic, stateDifficulty, {
      trackTitle,
      roundLabel,
    })
  ), [stateProblem, contest, stateTopic, stateDifficulty, trackTitle, roundLabel]);
  const contestId = contest?.id || contest?._id || null;
  
  return (
    <CompilerPage
      user={user}
      problemData={problemData}
      contestId={contestId}
      contest={contest}
      selectedTopic={stateTopic}
      trackKey={location.state?.trackKey}
      isFullInterview={location.state?.isFullInterview}
      currentRoundIndex={location.state?.currentRoundIndex}
      allRounds={location.state?.allRounds}
      totalRounds={location.state?.totalRounds}
    />
  );
};

export default Compiler;
