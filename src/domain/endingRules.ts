import type { EndingId, FinalDecisionId } from './ids';

export function decideEnding(decision: FinalDecisionId): EndingId {
  if (decision === 'full_release') {
    return 'bad';
  }

  if (decision === 'full_delay') {
    return 'normal';
  }

  if (decision === 'split_release') {
    return 'good';
  }

  return 'great';
}
