import type { DocumentId } from './ids';
import type { GameFlags, GameState, StageDefinition } from './types';

export const defaultGameFlags: GameFlags = {
  flakyResolved: false,
  customerScopeResolved: false,
  rollbackRiskResolved: false,
  featureFlagResolved: false,
  salesAlly: false,
  qaAlly: false,
  techleadEnemy: false,
  salesEnemy: false,
  qaEnemy: false,
  meetingBreakdownRisk: 0,
  governanceRuleSelected: false,
  qaConcernUnderstood: false,
  pmCostPressureUnderstood: false,
  salesPressureUnderstood: false,
};

export function createInitialGameState(stage: StageDefinition): GameState {
  const firstDocumentId = stage.documents[0]?.id as DocumentId | undefined;

  if (!firstDocumentId) {
    throw new Error('Stage must define at least one document.');
  }

  return {
    phase: 'title',
    currentDocumentId: firstDocumentId,
    acquiredEvidence: [],
    explorationLocked: false,
    meeting: {
      currentRoundIndex: 0,
      completedRoundIds: [],
      selectedEvidenceIds: [],
      actionHistory: [],
      logEntries: [],
    },
    flags: { ...defaultGameFlags },
  };
}
