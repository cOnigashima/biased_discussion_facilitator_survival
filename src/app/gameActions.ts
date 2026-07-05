import type {
  DeliveryId,
  DocumentId,
  DocumentLineId,
  EvidenceId,
  FinalDecisionId,
  TargetId,
} from '../domain/ids';

export type GameAction =
  | { type: 'START_PROLOGUE' }
  | { type: 'START_EXPLORATION' }
  | { type: 'OPEN_DOCUMENT'; documentId: DocumentId }
  | {
      type: 'ACQUIRE_EVIDENCE';
      evidenceId: EvidenceId;
      documentId: DocumentId;
      lineId: DocumentLineId;
    }
  | { type: 'DISMISS_EVIDENCE_MODAL' }
  | { type: 'START_MEETING' }
  | { type: 'SELECT_TARGET'; targetId: TargetId }
  | { type: 'SELECT_EVIDENCE'; evidenceIds: EvidenceId[] }
  | { type: 'SELECT_DELIVERY'; deliveryId: DeliveryId }
  | { type: 'CONFIRM_MEETING_ACTION' }
  | { type: 'CHOOSE_FINAL_DECISION'; decisionId: FinalDecisionId }
  | { type: 'RESTART' };
