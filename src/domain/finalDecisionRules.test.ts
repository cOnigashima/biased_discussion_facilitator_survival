import { describe, expect, it } from 'vitest';
import { finalDecisions } from '../scenario/goNoGoPaymentV2';
import { defaultGameFlags } from './initialState';
import {
  canChooseGovernedSplitRelease,
  canChooseSplitRelease,
  getAvailableFinalDecisions,
} from './finalDecisionRules';

describe('final decision unlock rules', () => {
  it('always exposes full release and full delay', () => {
    expect(getAvailableFinalDecisions(finalDecisions, defaultGameFlags)).toEqual([
      'full_release',
      'full_delay',
    ]);
  });

  it('unlocks split release without unlocking great when core conditions are partial', () => {
    const flags = {
      ...defaultGameFlags,
      customerScopeResolved: true,
      rollbackRiskResolved: true,
      salesAlly: true,
    };

    expect(canChooseSplitRelease(flags)).toBe(true);
    expect(canChooseGovernedSplitRelease(flags)).toBe(false);
    expect(getAvailableFinalDecisions(finalDecisions, flags)).toEqual([
      'full_release',
      'full_delay',
      'split_release',
    ]);
  });

  it('unlocks governed split release only on the great path conditions', () => {
    const flags = {
      ...defaultGameFlags,
      flakyResolved: true,
      customerScopeResolved: true,
      rollbackRiskResolved: true,
      featureFlagResolved: true,
      salesAlly: true,
      qaAlly: true,
    };

    expect(getAvailableFinalDecisions(finalDecisions, flags)).toEqual([
      'full_release',
      'full_delay',
      'split_release',
      'split_release_with_governance',
    ]);
  });

  it('blocks split release when Tech Lead has been enemy-flagged', () => {
    const flags = {
      ...defaultGameFlags,
      customerScopeResolved: true,
      rollbackRiskResolved: true,
      salesAlly: true,
      techleadEnemy: true,
    };

    expect(canChooseSplitRelease(flags)).toBe(false);
    expect(getAvailableFinalDecisions(finalDecisions, flags)).toEqual([
      'full_release',
      'full_delay',
    ]);
  });
});
