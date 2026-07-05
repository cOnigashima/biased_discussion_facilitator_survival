import { describe, expect, it } from 'vitest';
import { goNoGoPaymentV2Stage } from '../scenario/goNoGoPaymentV2';
import { createInitialGameState } from './initialState';
import { acquireEvidence, canAcquireEvidence, canStartMeeting } from './evidenceRules';

describe('evidence acquisition rules', () => {
  it('requires exploration phase and a clickable evidence line', () => {
    const state = {
      ...createInitialGameState(goNoGoPaymentV2Stage),
      phase: 'exploration' as const,
    };

    expect(
      canAcquireEvidence(
        state,
        goNoGoPaymentV2Stage,
        'ci_checkout_v2_failure',
        'ci_case_legacy_tax_null',
      ),
    ).toBe(true);
    expect(
      canAcquireEvidence(
        state,
        goNoGoPaymentV2Stage,
        'pilack_release_check',
        'pilack_pm_schedule',
      ),
    ).toBe(false);
  });

  it('adds evidence once and preserves acquisition order', () => {
    const state = {
      ...createInitialGameState(goNoGoPaymentV2Stage),
      phase: 'exploration' as const,
    };

    const withCi = acquireEvidence(
      state,
      goNoGoPaymentV2Stage,
      'ci_checkout_v2_failure',
      'ci_case_legacy_tax_null',
    );
    const withMail = acquireEvidence(
      withCi,
      goNoGoPaymentV2Stage,
      'customer_email_scope',
      'mail_invoice_only_this_month',
    );
    const duplicateCi = acquireEvidence(
      withMail,
      goNoGoPaymentV2Stage,
      'ci_checkout_v2_failure',
      'ci_case_legacy_tax_null',
    );

    expect(withMail.acquiredEvidence).toEqual(['ci_legacy_failure', 'customer_email_scope']);
    expect(withMail.lastAcquiredEvidenceId).toBe('customer_email_scope');
    expect(duplicateCi).toBe(withMail);
  });

  it('allows the meeting only after two acquired cards and before exploration is locked', () => {
    const state = {
      ...createInitialGameState(goNoGoPaymentV2Stage),
      phase: 'exploration' as const,
    };

    const withOneCard = acquireEvidence(
      state,
      goNoGoPaymentV2Stage,
      'ci_checkout_v2_failure',
      'ci_case_legacy_tax_null',
    );
    const withTwoCards = acquireEvidence(
      withOneCard,
      goNoGoPaymentV2Stage,
      'customer_email_scope',
      'mail_invoice_only_this_month',
    );

    expect(canStartMeeting(state)).toBe(false);
    expect(canStartMeeting(withOneCard)).toBe(false);
    expect(canStartMeeting(withTwoCards)).toBe(true);
    expect(canStartMeeting({ ...withTwoCards, explorationLocked: true })).toBe(false);
  });
});
