import { describe, expect, it } from 'vitest';
import { resolveMeetingAction, type MeetingActionInput } from './meetingRules';

function resolve(input: MeetingActionInput) {
  return resolveMeetingAction(input);
}

describe('resolveMeetingAction', () => {
  describe('Round 1: PM 佐伯', () => {
    it('softens the previous-warning premise without creating a core resolved flag', () => {
      const resolution = resolve({
        roundId: 'round1_pm',
        targetId: 'r1_target_same_as_last_time',
        evidenceIds: ['ci_legacy_failure'],
        deliveryId: 'comparison_question',
      });

      expect(resolution.outcome).toBe('partial_success');
      expect(resolution.flagPatch).toEqual({
        pmCostPressureUnderstood: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
      expect(resolution.roundCompleted).toBe(true);
    });

    it('allows no-evidence softening without resolving the premise', () => {
      const resolution = resolve({
        roundId: 'round1_pm',
        targetId: 'r1_target_no_alternative',
        evidenceIds: [],
        deliveryId: 'no_evidence_soften',
      });

      expect(resolution.outcome).toBe('neutral');
      expect(resolution.flagPatch).toEqual({});
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('raises breakdown risk when the PM is challenged directly', () => {
      const resolution = resolve({
        roundId: 'round1_pm',
        targetId: 'r1_target_same_as_last_time',
        evidenceIds: ['ci_legacy_failure'],
        deliveryId: 'direct_objection',
      });

      expect(resolution.outcome).toBe('hostile');
      expect(resolution.flagPatch).toEqual({});
      expect(resolution.meetingBreakdownRiskDelta).toBe(1);
    });
  });

  describe('Round 2: Tech Lead 黒瀬', () => {
    it('resolves flaky framing with CI evidence and a condition check', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_previously_unstable',
        evidenceIds: ['ci_legacy_failure'],
        deliveryId: 'condition_check',
      });

      expect(resolution.outcome).toBe('strong_success');
      expect(resolution.flagPatch).toEqual({
        flakyResolved: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('handles the Pira safe path without enemy-flagging Tech Lead', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_not_implementation',
        evidenceIds: ['jira_bug_418_repro'],
        deliveryId: 'face_saving',
      });

      expect(resolution.outcome).toBe('strong_success');
      expect(resolution.flagPatch).toEqual({
        flakyResolved: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('resolves flaky framing with staging evidence without enemy-flagging Tech Lead', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_not_implementation',
        evidenceIds: ['staging_500_log'],
        deliveryId: 'face_saving',
      });

      expect(resolution.outcome).toBe('strong_success');
      expect(resolution.flagPatch).toEqual({
        flakyResolved: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('allows PR evidence as a weaker condition-check route', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_not_implementation',
        evidenceIds: ['pr_tax_category_comment'],
        deliveryId: 'condition_check',
      });

      expect(resolution.outcome).toBe('partial_success');
      expect(resolution.flagPatch).toEqual({
        flakyResolved: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('handles the PR enemy path when the implementation is attacked directly', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_not_implementation',
        evidenceIds: ['pr_tax_category_comment'],
        deliveryId: 'direct_objection',
      });

      expect(resolution.outcome).toBe('hostile');
      expect(resolution.flagPatch).toEqual({
        flakyResolved: true,
        techleadEnemy: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(1);
    });

    it('handles the Pira enemy path when BUG-418 is used aggressively', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_not_implementation',
        evidenceIds: ['jira_bug_418_repro'],
        deliveryId: 'direct_objection',
      });

      expect(resolution.outcome).toBe('hostile');
      expect(resolution.flagPatch).toEqual({
        flakyResolved: true,
        techleadEnemy: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(1);
    });

    it('treats CPU spike evidence as a trap in Round 2', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_previously_unstable',
        evidenceIds: ['cpu_spike_log'],
        deliveryId: 'condition_check',
      });

      expect(resolution.outcome).toBe('misuse');
      expect(resolution.flagPatch).toEqual({});
      expect(resolution.meetingBreakdownRiskDelta).toBe(1);
    });
  });

  describe('Round 3: Sales 桐谷', () => {
    it('turns the deadline into a scope discussion with customer email evidence', () => {
      const resolution = resolve({
        roundId: 'round3_sales',
        targetId: 'r3_target_this_month',
        evidenceIds: ['customer_email_scope'],
        deliveryId: 'scope_decomposition',
      });

      expect(resolution.outcome).toBe('strong_success');
      expect(resolution.flagPatch).toEqual({
        customerScopeResolved: true,
        salesAlly: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('turns Sales pressure into an explainable split-release interest', () => {
      const resolution = resolve({
        roundId: 'round3_sales',
        targetId: 'r3_target_losing_trust',
        evidenceIds: ['customer_email_scope'],
        deliveryId: 'interest_translation',
      });

      expect(resolution.outcome).toBe('strong_success');
      expect(resolution.flagPatch).toEqual({
        customerScopeResolved: true,
        salesAlly: true,
        salesPressureUnderstood: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('enemy-flags Sales when the promise is blamed directly', () => {
      const resolution = resolve({
        roundId: 'round3_sales',
        targetId: 'r3_target_this_month',
        evidenceIds: ['customer_email_scope'],
        deliveryId: 'accuse',
      });

      expect(resolution.outcome).toBe('hostile');
      expect(resolution.flagPatch).toEqual({
        salesEnemy: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(1);
    });

    it('keeps no-evidence risk objection from resolving customer scope', () => {
      const resolution = resolve({
        roundId: 'round3_sales',
        targetId: 'r3_target_losing_trust',
        evidenceIds: [],
        deliveryId: 'direct_objection',
      });

      expect(resolution.outcome).toBe('neutral');
      expect(resolution.flagPatch).toEqual({});
      expect(resolution.meetingBreakdownRiskDelta).toBe(1);
    });
  });

  describe('Round 4: QA 三村', () => {
    it('resolves rollback risk when QA danger is acknowledged with rollback evidence', () => {
      const resolution = resolve({
        roundId: 'round4_qa',
        targetId: 'r4_target_dangerous',
        evidenceIds: ['rollback_procedure'],
        deliveryId: 'empathize_then_split',
      });

      expect(resolution.outcome).toBe('partial_success');
      expect(resolution.flagPatch).toEqual({
        rollbackRiskResolved: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('resolves feature-flag split feasibility with the split proposal', () => {
      const resolution = resolve({
        roundId: 'round4_qa',
        targetId: 'r4_target_everything',
        evidenceIds: ['feature_flag_design'],
        deliveryId: 'split_proposal',
      });

      expect(resolution.outcome).toBe('partial_success');
      expect(resolution.flagPatch).toEqual({
        featureFlagResolved: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('handles the Round 4 rollback and feature flag combo regardless of evidence order', () => {
      const resolution = resolve({
        roundId: 'round4_qa',
        targetId: 'r4_target_everything',
        evidenceIds: ['feature_flag_design', 'rollback_procedure'],
        deliveryId: 'empathize_then_split',
      });

      expect(resolution.outcome).toBe('strong_success');
      expect(resolution.flagPatch).toEqual({
        rollbackRiskResolved: true,
        featureFlagResolved: true,
        qaAlly: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('records QA concern from past incident evidence without resolving release scope', () => {
      const resolution = resolve({
        roundId: 'round4_qa',
        targetId: 'r4_target_previous_incident',
        evidenceIds: ['past_incident_report'],
        deliveryId: 'empathize_then_split',
      });

      expect(resolution.outcome).toBe('partial_success');
      expect(resolution.flagPatch).toEqual({
        qaConcernUnderstood: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
      expect(resolution.logEntries).toHaveLength(3);
      expect(resolution.logEntries.at(-1)?.id).toBe('round4_qa-unresolved');
    });

    it('allows agreeing to a full stop without resolving split-release facts', () => {
      const resolution = resolve({
        roundId: 'round4_qa',
        targetId: 'r4_target_everything',
        evidenceIds: [],
        deliveryId: 'agree_full_stop',
      });

      expect(resolution.outcome).toBe('neutral');
      expect(resolution.flagPatch).toEqual({});
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
    });

    it('enemy-flags QA when the concern is dismissed directly', () => {
      const resolution = resolve({
        roundId: 'round4_qa',
        targetId: 'r4_target_everything',
        evidenceIds: ['feature_flag_design'],
        deliveryId: 'direct_objection',
      });

      expect(resolution.outcome).toBe('hostile');
      expect(resolution.flagPatch).toEqual({
        qaEnemy: true,
      });
      expect(resolution.meetingBreakdownRiskDelta).toBe(1);
    });
  });

  describe('Fallback behavior', () => {
    it('keeps unrelated evidence from changing flags and adds an unresolved log entry', () => {
      const resolution = resolve({
        roundId: 'round3_sales',
        targetId: 'r3_target_this_month',
        evidenceIds: ['rollback_procedure'],
        deliveryId: 'scope_decomposition',
      });

      expect(resolution.outcome).toBe('neutral');
      expect(resolution.flagPatch).toEqual({});
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
      expect(resolution.logEntries).toHaveLength(3);
      expect(resolution.logEntries.at(-1)?.id).toBe('round3_sales-unresolved');
    });

    it('keeps no-evidence fallback concise and non-punitive', () => {
      const resolution = resolve({
        roundId: 'round2_techlead',
        targetId: 'r2_target_test_side',
        evidenceIds: [],
        deliveryId: 'no_evidence_soften',
      });

      expect(resolution.outcome).toBe('neutral');
      expect(resolution.flagPatch).toEqual({});
      expect(resolution.meetingBreakdownRiskDelta).toBe(0);
      expect(resolution.logEntries).toHaveLength(2);
    });
  });
});
