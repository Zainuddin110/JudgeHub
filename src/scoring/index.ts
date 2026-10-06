export interface CriterionConfig {
  key: string;
  type: string;
  label: string;
  weight: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface EvaluationInput {
  judgeId: string;
  entryId: string;
  scores: Record<string, number>;
  judgeWeight?: number;
}

export interface ComputeOptions {
  criteria: CriterionConfig[];
  evaluations: EvaluationInput[];
  scale?: number;
  decimals?: number;
}

export interface EntryScoreBreakdown {
  entryId: string;
  rawScore: number;
  finalScore: number;
  rank: number;
  judgeCount: number;
  breakdown: Record<string, unknown>;
}

export function computeBasicMean(options: ComputeOptions): EntryScoreBreakdown[] {
  const { criteria, evaluations, scale = 100, decimals = 2 } = options;

  const entryEvaluationsMap = new Map<string, EvaluationInput[]>();
  for (const evaluation of evaluations) {
    const list = entryEvaluationsMap.get(evaluation.entryId) || [];
    list.push(evaluation);
    entryEvaluationsMap.set(evaluation.entryId, list);
  }

  const results: EntryScoreBreakdown[] = [];

  for (const [entryId, evals] of entryEvaluationsMap.entries()) {
    if (evals.length === 0) continue;

    const judgeScores: number[] = [];
    for (const ev of evals) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const criterion of criteria) {
        const val = ev.scores[criterion.key];
        if (typeof val === "number") {
          const min = criterion.min ?? 0;
          const max = criterion.max ?? 10;
          const normalized = max > min ? (val - min) / (max - min) : 0;
          weightedSum += normalized * criterion.weight;
          totalWeight += criterion.weight;
        }
      }

      const judgeScore = totalWeight > 0 ? (weightedSum / totalWeight) * scale : 0;
      judgeScores.push(judgeScore);
    }

    const rawMean = judgeScores.reduce((acc, s) => acc + s, 0) / judgeScores.length;
    const finalScore = Number(rawMean.toFixed(decimals));

    results.push({
      entryId,
      rawScore: rawMean,
      finalScore,
      rank: 0,
      judgeCount: evals.length,
      breakdown: {
        judgeScores,
        mean: rawMean,
      },
    });
  }

  results.sort((a, b) => b.rawScore - a.rawScore);
  results.forEach((row, index) => {
    row.rank = index + 1;
  });

  return results;
}
