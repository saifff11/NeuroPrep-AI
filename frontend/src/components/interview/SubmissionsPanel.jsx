import React, { useEffect, useMemo, useState } from 'react';
import { getSubmissionsByContest } from '../../services/SubmissionsService.mongodb';

const PAGE_SIZE = 8;

const getSubmissionDate = (submission) => (
  submission.submittedAt || submission.created_at || submission.createdAt || submission.updatedAt
);

const getSubmissionPoints = (submission) => (
  submission.pointsAwarded ?? submission.score ?? submission.marksObtained ?? 0
);

const SubmissionsPanel = ({ contestId }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('');

  useEffect(() => { setPage(1); }, [usernameFilter, verdictFilter]);

  useEffect(() => {
    if (!contestId) {
      setSubs([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const data = await getSubmissionsByContest(contestId);
        if (mounted) setSubs(data || []);
      } catch (err) {
        console.error('Failed to load submissions:', err);
        if (mounted) setSubs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [contestId]);

  const filtered = useMemo(() => (
    subs.filter((submission) => {
      const username = submission.username || submission.userId || submission.user_id || '';
      const verdict = submission.verdict || submission.status || submission.result?.verdict || '';
      if (usernameFilter && !username.toLowerCase().includes(usernameFilter.toLowerCase())) return false;
      if (verdictFilter && !verdict.toLowerCase().includes(verdictFilter.toLowerCase())) return false;
      return true;
    })
  ), [subs, usernameFilter, verdictFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const downloadCSV = () => {
    const header = ['submission_id', 'username', 'user_id', 'problem_title', 'problem_index', 'points', 'verdict', 'status', 'time', 'memory', 'created_at'];
    const lines = [header.join(',')];

    filtered.forEach((submission) => {
      const row = [
        submission.id || submission._id,
        submission.username || '',
        submission.userId || submission.user_id || '',
        submission.problemTitle || '',
        submission.problem_index ?? submission.problemIndex ?? '',
        getSubmissionPoints(submission),
        submission.verdict || '',
        submission.status || '',
        submission.executionTime ?? submission.time ?? '',
        submission.memory ?? '',
        getSubmissionDate(submission) || ''
      ];
      lines.push(row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `submissions_${contestId || 'contest'}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (!contestId) {
    return <div className="p-4 text-sm text-gray-600">No contest context provided. Submissions are only available within a contest.</div>;
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-600">Loading submissions...</div>;
  }

  if (!subs.length) {
    return <div className="p-4 text-sm text-gray-600">No submissions yet for this contest.</div>;
  }

  return (
    <div className="p-4 text-sm text-gray-700">
      <div className="mb-3 flex items-center gap-2">
        <input
          placeholder="Filter by username"
          value={usernameFilter}
          onChange={(event) => setUsernameFilter(event.target.value)}
          className="rounded border px-3 py-1"
        />
        <input
          placeholder="Filter by verdict"
          value={verdictFilter}
          onChange={(event) => setVerdictFilter(event.target.value)}
          className="rounded border px-3 py-1"
        />
        <button onClick={downloadCSV} className="ml-auto rounded bg-blue-600 px-3 py-1 text-white">
          Export CSV
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {pageItems.map((submission) => {
          const submittedAt = getSubmissionDate(submission);
          const verdict = submission.verdict || submission.status || submission.result?.verdict || 'Unknown';
          const points = getSubmissionPoints(submission);
          return (
            <div key={submission.id || submission._id} className="rounded border bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{submission.username || submission.userId || submission.user_id || 'unknown'}</div>
                <div className="text-xs text-gray-500">
                  {submittedAt ? new Date(submittedAt).toLocaleString() : 'Just now'}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {submission.problemTitle || `Problem #${submission.problem_index ?? submission.problemIndex ?? 0}`} - {verdict}
                <span className="ml-2 rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">{points}/100 pts</span>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2 font-mono text-xs">
                {(submission.code || '').slice(0, 1000)}
              </pre>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-600">Showing {filtered.length} results</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded border px-3 py-1">
            Prev
          </button>
          <div className="text-xs">Page {page} / {totalPages}</div>
          <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded border px-3 py-1">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPanel;
