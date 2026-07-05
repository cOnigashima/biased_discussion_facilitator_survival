import type { DocumentId, DocumentLineId, EvidenceId } from './ids';
import type { GameState, StageDefinition } from './types';

export type EvidenceLineLookup = {
  documentId: DocumentId;
  lineId: DocumentLineId;
  evidenceId: EvidenceId;
};

export function collectClickableLines(stage: StageDefinition): EvidenceLineLookup[] {
  return stage.documents.flatMap((document) =>
    document.lines
      .filter((line): line is typeof line & { evidenceId: EvidenceId } => Boolean(line.evidenceId))
      .map((line) => ({
        documentId: document.id,
        lineId: line.id,
        evidenceId: line.evidenceId,
      })),
  );
}

export function findEvidenceLine(
  stage: StageDefinition,
  documentId: DocumentId,
  lineId: DocumentLineId,
): EvidenceLineLookup | undefined {
  return collectClickableLines(stage).find(
    (line) => line.documentId === documentId && line.lineId === lineId,
  );
}

export function canStartMeeting(state: GameState): boolean {
  return state.acquiredEvidence.length >= 2 && !state.explorationLocked;
}

export function canAcquireEvidence(
  state: GameState,
  stage: StageDefinition,
  documentId: DocumentId,
  lineId: DocumentLineId,
): boolean {
  if (state.phase !== 'exploration' || state.explorationLocked) {
    return false;
  }

  const evidenceLine = findEvidenceLine(stage, documentId, lineId);

  if (!evidenceLine) {
    return false;
  }

  return !state.acquiredEvidence.includes(evidenceLine.evidenceId);
}

export function acquireEvidence(
  state: GameState,
  stage: StageDefinition,
  documentId: DocumentId,
  lineId: DocumentLineId,
): GameState {
  if (!canAcquireEvidence(state, stage, documentId, lineId)) {
    return state;
  }

  const evidenceLine = findEvidenceLine(stage, documentId, lineId);

  if (!evidenceLine) {
    return state;
  }

  return {
    ...state,
    acquiredEvidence: [...state.acquiredEvidence, evidenceLine.evidenceId],
    lastAcquiredEvidenceId: evidenceLine.evidenceId,
  };
}
