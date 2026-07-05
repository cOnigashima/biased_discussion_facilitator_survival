import { describe, expect, it } from 'vitest';
import { goNoGoPaymentV2Stage } from '../scenario/goNoGoPaymentV2';
import { collectClickableLines } from './evidenceRules';
import { validateStage } from './scenarioValidator';

describe('scenario validator', () => {
  it('accepts the P0 go/no-go stage seed data', () => {
    expect(validateStage(goNoGoPaymentV2Stage)).toEqual([]);
  });

  it('keeps the stage at exactly 9 evidence cards and 9 clickable evidence lines', () => {
    expect(goNoGoPaymentV2Stage.evidenceCards).toHaveLength(9);
    expect(collectClickableLines(goNoGoPaymentV2Stage)).toHaveLength(9);
  });

  it('does not make Pilack a source of evidence', () => {
    const pilack = goNoGoPaymentV2Stage.documents.find(
      (document) => document.id === 'pilack_release_check',
    );

    expect(pilack).toBeDefined();
    expect(pilack?.isPrologueOnly).toBe(true);
    expect(pilack?.lines.some((line) => 'evidenceId' in line)).toBe(false);
  });

  it('keeps Pira BUG-418 and CPU spike as explicit card sources', () => {
    const clickableLines = collectClickableLines(goNoGoPaymentV2Stage);

    expect(clickableLines).toContainEqual({
      documentId: 'pira_bug_418',
      lineId: 'pira_tax_null_checkout_500',
      evidenceId: 'jira_bug_418_repro',
    });
    expect(clickableLines).toContainEqual({
      documentId: 'cpu_spike_log',
      lineId: 'cpu_spike_load_test',
      evidenceId: 'cpu_spike_log',
    });
  });

  it('keeps meeting dialogue attached to valid characters', () => {
    const characterIds = new Set(goNoGoPaymentV2Stage.characters.map((character) => character.id));
    const openingSpeakerIds = goNoGoPaymentV2Stage.meetingOpening.map((line) => line.speakerId);
    const roundSpeakerIds = goNoGoPaymentV2Stage.meetingRounds.flatMap((round) => [
      round.speakerId,
      ...round.npcStatement.map((line) => line.speakerId),
    ]);

    expect(goNoGoPaymentV2Stage.meetingOpening.length).toBeGreaterThan(0);
    [...openingSpeakerIds, ...roundSpeakerIds].forEach((speakerId) => {
      expect(characterIds.has(speakerId)).toBe(true);
    });
  });

  it('keeps selectable target phrases visible in their statement lines', () => {
    goNoGoPaymentV2Stage.meetingRounds.forEach((round) => {
      round.targetPhrases.forEach((target) => {
        const statementLine = round.npcStatement.find((line) => line.id === target.statementLineId);

        expect(statementLine).toBeDefined();
        expect(statementLine?.text).toContain(target.phrase);
      });
    });
  });
});
