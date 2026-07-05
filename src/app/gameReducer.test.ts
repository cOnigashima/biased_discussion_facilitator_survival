import { describe, expect, it } from 'vitest';
import type { DeliveryId, EvidenceId, TargetId } from '../domain/ids';
import { getAvailableFinalDecisions } from '../domain/finalDecisionRules';
import { createInitialGameState } from '../domain/initialState';
import type { GameState } from '../domain/types';
import { goNoGoPaymentV2Stage } from '../scenario/goNoGoPaymentV2';
import { reduceGameState } from './gameReducer';

function createMeetingReadyState(evidenceIds: EvidenceId[]): GameState {
  const state = {
    ...createInitialGameState(goNoGoPaymentV2Stage),
    phase: 'exploration' as const,
    acquiredEvidence: evidenceIds,
  };

  return reduceGameState(state, { type: 'START_MEETING' }, goNoGoPaymentV2Stage);
}

function confirmRound(
  state: GameState,
  targetId: TargetId,
  evidenceIds: EvidenceId[],
  deliveryId: DeliveryId,
): GameState {
  const withTarget = reduceGameState(
    state,
    { type: 'SELECT_TARGET', targetId },
    goNoGoPaymentV2Stage,
  );
  const withEvidence = reduceGameState(
    withTarget,
    { type: 'SELECT_EVIDENCE', evidenceIds },
    goNoGoPaymentV2Stage,
  );
  const withDelivery = reduceGameState(
    withEvidence,
    { type: 'SELECT_DELIVERY', deliveryId },
    goNoGoPaymentV2Stage,
  );

  return reduceGameState(withDelivery, { type: 'CONFIRM_MEETING_ACTION' }, goNoGoPaymentV2Stage);
}

describe('game reducer milestone 2 flows', () => {
  it('starts exploration from Pilack instead of the CI failure', () => {
    let state = createInitialGameState(goNoGoPaymentV2Stage);

    state = reduceGameState(state, { type: 'START_PROLOGUE' }, goNoGoPaymentV2Stage);
    state = reduceGameState(state, { type: 'START_EXPLORATION' }, goNoGoPaymentV2Stage);

    expect(state.phase).toBe('exploration');
    expect(state.currentDocumentId).toBe('pilack_release_check');
  });

  it('completes the Great path and ends with governed split release', () => {
    let state = createMeetingReadyState([
      'jira_bug_418_repro',
      'customer_email_scope',
      'rollback_procedure',
      'feature_flag_design',
    ]);

    state = confirmRound(state, 'r1_target_no_alternative', [], 'no_evidence_soften');
    state = confirmRound(
      state,
      'r2_target_not_implementation',
      ['jira_bug_418_repro'],
      'face_saving',
    );
    state = confirmRound(
      state,
      'r3_target_losing_trust',
      ['customer_email_scope'],
      'interest_translation',
    );
    state = confirmRound(
      state,
      'r4_target_everything',
      ['rollback_procedure', 'feature_flag_design'],
      'empathize_then_split',
    );

    expect(state.phase).toBe('finalDecision');
    expect(state.flags).toMatchObject({
      flakyResolved: true,
      customerScopeResolved: true,
      rollbackRiskResolved: true,
      featureFlagResolved: true,
      salesAlly: true,
      qaAlly: true,
      techleadEnemy: false,
    });
    expect(getAvailableFinalDecisions(goNoGoPaymentV2Stage.finalDecisions, state.flags)).toEqual([
      'full_release',
      'full_delay',
      'split_release',
      'split_release_with_governance',
    ]);

    state = reduceGameState(
      state,
      { type: 'CHOOSE_FINAL_DECISION', decisionId: 'split_release_with_governance' },
      goNoGoPaymentV2Stage,
    );

    expect(state.phase).toBe('result');
    expect(state.finalDecision).toBe('split_release_with_governance');
    expect(state.ending).toBe('great');
    expect(state.flags.governanceRuleSelected).toBe(true);
  });

  it('completes the Good path without unlocking the governed option', () => {
    let state = createMeetingReadyState(['customer_email_scope', 'feature_flag_design']);

    state = confirmRound(state, 'r1_target_no_alternative', [], 'no_evidence_soften');
    state = confirmRound(state, 'r2_target_test_side', [], 'no_evidence_soften');
    state = confirmRound(
      state,
      'r3_target_this_month',
      ['customer_email_scope'],
      'scope_decomposition',
    );
    state = confirmRound(
      state,
      'r4_target_everything',
      ['feature_flag_design'],
      'split_proposal',
    );

    expect(state.phase).toBe('finalDecision');
    expect(state.flags).toMatchObject({
      flakyResolved: false,
      customerScopeResolved: true,
      featureFlagResolved: true,
      salesAlly: true,
      qaAlly: false,
    });
    expect(getAvailableFinalDecisions(goNoGoPaymentV2Stage.finalDecisions, state.flags)).toEqual([
      'full_release',
      'full_delay',
      'split_release',
    ]);

    state = reduceGameState(
      state,
      { type: 'CHOOSE_FINAL_DECISION', decisionId: 'split_release' },
      goNoGoPaymentV2Stage,
    );

    expect(state.phase).toBe('result');
    expect(state.finalDecision).toBe('split_release');
    expect(state.ending).toBe('good');
  });

  it('blocks split release after the Pira enemy path even if other facts are resolved', () => {
    let state = createMeetingReadyState([
      'jira_bug_418_repro',
      'customer_email_scope',
      'rollback_procedure',
      'feature_flag_design',
    ]);

    state = confirmRound(state, 'r1_target_no_alternative', [], 'no_evidence_soften');
    state = confirmRound(
      state,
      'r2_target_not_implementation',
      ['jira_bug_418_repro'],
      'direct_objection',
    );
    state = confirmRound(
      state,
      'r3_target_losing_trust',
      ['customer_email_scope'],
      'interest_translation',
    );
    state = confirmRound(
      state,
      'r4_target_everything',
      ['rollback_procedure', 'feature_flag_design'],
      'empathize_then_split',
    );

    expect(state.phase).toBe('finalDecision');
    expect(state.flags.techleadEnemy).toBe(true);
    expect(state.flags.meetingBreakdownRisk).toBe(1);
    expect(getAvailableFinalDecisions(goNoGoPaymentV2Stage.finalDecisions, state.flags)).toEqual([
      'full_release',
      'full_delay',
    ]);
  });

  it('limits evidence selection by round and only allows acquired cards', () => {
    let state = createMeetingReadyState([
      'ci_legacy_failure',
      'customer_email_scope',
      'rollback_procedure',
      'feature_flag_design',
    ]);

    state = reduceGameState(
      state,
      { type: 'SELECT_EVIDENCE', evidenceIds: ['ci_legacy_failure', 'customer_email_scope'] },
      goNoGoPaymentV2Stage,
    );
    expect(state.meeting.selectedEvidenceIds).toEqual(['ci_legacy_failure']);

    state = confirmRound(
      state,
      'r1_target_same_as_last_time',
      ['ci_legacy_failure'],
      'comparison_question',
    );
    state = confirmRound(state, 'r2_target_test_side', [], 'no_evidence_soften');
    state = confirmRound(
      state,
      'r3_target_this_month',
      ['customer_email_scope'],
      'scope_decomposition',
    );

    state = reduceGameState(
      state,
      {
        type: 'SELECT_EVIDENCE',
        evidenceIds: ['rollback_procedure', 'feature_flag_design', 'cpu_spike_log'],
      },
      goNoGoPaymentV2Stage,
    );

    expect(state.meeting.selectedEvidenceIds).toEqual([
      'rollback_procedure',
      'feature_flag_design',
    ]);
  });
});
