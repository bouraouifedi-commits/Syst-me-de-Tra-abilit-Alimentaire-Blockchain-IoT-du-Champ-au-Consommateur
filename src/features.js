
export function buildLotFeatures({ statusSeq, timeSeq, docCount, actorCount }) {
  const n = statusSeq.length;

  let invalidJumps = 0;
  let backwards = 0;
  for (let i = 1; i < n; i++) {
    const prev = Number(statusSeq[i - 1]);
    const cur = Number(statusSeq[i]);
    if (cur < prev) backwards++;
    if (cur > prev + 1) invalidJumps++;
  }

  const deltas = [];
  for (let i = 1; i < timeSeq.length; i++) {
    const d = Number(timeSeq[i]) - Number(timeSeq[i - 1]);
    if (isFinite(d) && d >= 0) deltas.push(d);
  }

  const meanDelta = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  const maxDelta = deltas.length ? Math.max(...deltas) : 0;
  const minDelta = deltas.length ? Math.min(...deltas) : 0;

  return [
    n,                 // historyLen
    Number(docCount),  // documentsLen
    Number(actorCount),// unique actors
    Number(statusSeq[n - 1] ?? 0), // last status
    invalidJumps,
    backwards,
    meanDelta,
    maxDelta,
    minDelta,
  ];
}
