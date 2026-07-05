import type { FinalDecisionId } from './ids';
import type { FinalDecisionDefinition, GameFlags } from './types';

export function canChooseSplitRelease(flags: GameFlags): boolean {
  return (
    flags.customerScopeResolved &&
    (flags.rollbackRiskResolved || flags.featureFlagResolved) &&
    (flags.salesAlly || flags.qaAlly) &&
    !flags.techleadEnemy &&
    !flags.salesEnemy &&
    !flags.qaEnemy
  );
}

export function canChooseGovernedSplitRelease(flags: GameFlags): boolean {
  return (
    canChooseSplitRelease(flags) &&
    flags.salesAlly &&
    flags.qaAlly &&
    flags.flakyResolved &&
    flags.rollbackRiskResolved &&
    flags.featureFlagResolved &&
    !flags.techleadEnemy &&
    flags.meetingBreakdownRisk < 3
  );
}

export function getAvailableFinalDecisions(
  finalDecisions: FinalDecisionDefinition[],
  flags: GameFlags,
): FinalDecisionId[] {
  return finalDecisions
    .filter((decision) => {
      if (decision.availability === 'always') {
        return true;
      }

      if (decision.availability === 'split_release_unlocked') {
        return canChooseSplitRelease(flags);
      }

      return canChooseGovernedSplitRelease(flags);
    })
    .map((decision) => decision.id);
}
