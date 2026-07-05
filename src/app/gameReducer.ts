import type { GameAction } from './gameActions';
import type { DeliveryId, DocumentId, EvidenceId, TargetId } from '../domain/ids';
import { decideEnding } from '../domain/endingRules';
import { acquireEvidence, canStartMeeting, findEvidenceLine } from '../domain/evidenceRules';
import { getAvailableFinalDecisions } from '../domain/finalDecisionRules';
import { createInitialGameState } from '../domain/initialState';
import { resolveMeetingAction } from '../domain/meetingRules';
import type { GameState, MeetingRoundDefinition, StageDefinition } from '../domain/types';

function hasDocument(stage: StageDefinition, documentId: DocumentId): boolean {
  return stage.documents.some((document) => document.id === documentId);
}

function getCurrentRound(
  state: GameState,
  stage: StageDefinition,
): MeetingRoundDefinition | undefined {
  return stage.meetingRounds[state.meeting.currentRoundIndex];
}

function isValidTarget(round: MeetingRoundDefinition, targetId: TargetId): boolean {
  return round.targetPhrases.some((target) => target.id === targetId);
}

function isValidDelivery(round: MeetingRoundDefinition, deliveryId: DeliveryId): boolean {
  return round.deliveryOptions.some((delivery) => delivery.id === deliveryId);
}

function normalizeEvidenceSelection(
  state: GameState,
  round: MeetingRoundDefinition,
  evidenceIds: EvidenceId[],
): EvidenceId[] {
  const uniqueEvidenceIds = [...new Set(evidenceIds)];
  const acquiredEvidenceIds = uniqueEvidenceIds.filter((evidenceId) =>
    state.acquiredEvidence.includes(evidenceId),
  );

  return acquiredEvidenceIds.slice(0, round.maxEvidenceSelectable);
}

function mergeFlags(
  state: GameState,
  flagPatch: Partial<GameState['flags']>,
  meetingBreakdownRiskDelta: number,
): GameState['flags'] {
  return {
    ...state.flags,
    ...flagPatch,
    meetingBreakdownRisk:
      state.flags.meetingBreakdownRisk + meetingBreakdownRiskDelta,
  };
}

export function reduceGameState(
  state: GameState,
  action: GameAction,
  stage: StageDefinition,
): GameState {
  if (action.type === 'RESTART') {
    return createInitialGameState(stage);
  }

  if (action.type === 'START_PROLOGUE') {
    if (state.phase !== 'title') {
      return state;
    }

    return {
      ...state,
      phase: 'prologue',
      currentDocumentId: 'pilack_release_check',
    };
  }

  if (action.type === 'START_EXPLORATION') {
    if (state.phase !== 'prologue') {
      return state;
    }

    return {
      ...state,
      phase: 'exploration',
      currentDocumentId: 'pilack_release_check',
      explorationLocked: false,
    };
  }

  if (action.type === 'OPEN_DOCUMENT') {
    if (!hasDocument(stage, action.documentId) || state.explorationLocked) {
      return state;
    }

    return {
      ...state,
      currentDocumentId: action.documentId,
    };
  }

  if (action.type === 'ACQUIRE_EVIDENCE') {
    const evidenceLine = findEvidenceLine(stage, action.documentId, action.lineId);

    if (!evidenceLine || evidenceLine.evidenceId !== action.evidenceId) {
      return state;
    }

    return acquireEvidence(state, stage, action.documentId, action.lineId);
  }

  if (action.type === 'DISMISS_EVIDENCE_MODAL') {
    const { lastAcquiredEvidenceId: _lastAcquiredEvidenceId, ...stateWithoutModal } = state;

    return stateWithoutModal;
  }

  if (action.type === 'START_MEETING') {
    if (state.phase !== 'exploration' || !canStartMeeting(state)) {
      return state;
    }

    return {
      ...state,
      phase: 'meeting',
      explorationLocked: true,
      meeting: {
        currentRoundIndex: 0,
        completedRoundIds: [],
        selectedEvidenceIds: [],
        actionHistory: [],
        logEntries: [],
      },
    };
  }

  if (action.type === 'SELECT_TARGET') {
    if (state.phase !== 'meeting') {
      return state;
    }

    const round = getCurrentRound(state, stage);

    if (!round || !isValidTarget(round, action.targetId)) {
      return state;
    }

    return {
      ...state,
      meeting: {
        ...state.meeting,
        selectedTargetId: action.targetId,
      },
    };
  }

  if (action.type === 'SELECT_EVIDENCE') {
    if (state.phase !== 'meeting') {
      return state;
    }

    const round = getCurrentRound(state, stage);

    if (!round) {
      return state;
    }

    return {
      ...state,
      meeting: {
        ...state.meeting,
        selectedEvidenceIds: normalizeEvidenceSelection(state, round, action.evidenceIds),
      },
    };
  }

  if (action.type === 'SELECT_DELIVERY') {
    if (state.phase !== 'meeting') {
      return state;
    }

    const round = getCurrentRound(state, stage);

    if (!round || !isValidDelivery(round, action.deliveryId)) {
      return state;
    }

    return {
      ...state,
      meeting: {
        ...state.meeting,
        selectedDeliveryId: action.deliveryId,
      },
    };
  }

  if (action.type === 'CONFIRM_MEETING_ACTION') {
    if (state.phase !== 'meeting') {
      return state;
    }

    const round = getCurrentRound(state, stage);

    if (
      !round ||
      round.id === 'round5_cto' ||
      !state.meeting.selectedTargetId ||
      !state.meeting.selectedDeliveryId
    ) {
      return state;
    }

    const resolution = resolveMeetingAction({
      roundId: round.id,
      targetId: state.meeting.selectedTargetId,
      evidenceIds: state.meeting.selectedEvidenceIds,
      deliveryId: state.meeting.selectedDeliveryId,
    });
    const nextRoundIndex = state.meeting.currentRoundIndex + 1;
    const nextRound = stage.meetingRounds[nextRoundIndex];
    const nextPhase = nextRound?.id === 'round5_cto' ? 'finalDecision' : 'meeting';

    return {
      ...state,
      phase: nextPhase,
      flags: mergeFlags(state, resolution.flagPatch, resolution.meetingBreakdownRiskDelta),
      meeting: {
        currentRoundIndex: nextRoundIndex,
        completedRoundIds: [...state.meeting.completedRoundIds, round.id],
        selectedEvidenceIds: [],
        actionHistory: [
          ...state.meeting.actionHistory,
          {
            roundId: round.id,
            targetId: state.meeting.selectedTargetId,
            evidenceIds: state.meeting.selectedEvidenceIds,
            deliveryId: state.meeting.selectedDeliveryId,
            outcome: resolution.outcome,
          },
        ],
        logEntries: [...state.meeting.logEntries, ...resolution.logEntries],
      },
    };
  }

  if (action.type === 'CHOOSE_FINAL_DECISION') {
    if (state.phase !== 'finalDecision') {
      return state;
    }

    const availableDecisionIds = getAvailableFinalDecisions(stage.finalDecisions, state.flags);

    if (!availableDecisionIds.includes(action.decisionId)) {
      return state;
    }

    const ending = decideEnding(action.decisionId);

    return {
      ...state,
      phase: 'result',
      finalDecision: action.decisionId,
      ending,
      flags: {
        ...state.flags,
        governanceRuleSelected: action.decisionId === 'split_release_with_governance',
      },
      meeting: {
        ...state.meeting,
        logEntries: [
          ...state.meeting.logEntries,
          {
            id: 'final-decision',
            roundId: 'round5_cto',
            text: `プレイヤーは最終判断として「${
              stage.finalDecisions.find((decision) => decision.id === action.decisionId)?.title ??
              action.decisionId
            }」を選んだ。`,
          },
        ],
      },
    };
  }

  return state;
}

export function createGameReducer(stage: StageDefinition) {
  return (state: GameState, action: GameAction): GameState =>
    reduceGameState(state, action, stage);
}
