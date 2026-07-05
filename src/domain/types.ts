import type {
  CharacterId,
  DeliveryId,
  DialogueLineId,
  DocumentId,
  DocumentKind,
  DocumentLineId,
  EndingId,
  EvidenceId,
  EvidenceKind,
  FinalDecisionId,
  RoundId,
  StageId,
  TargetId,
} from './ids';

export type AvatarDefinition = {
  kind: 'css_bird_placeholder' | 'player_placeholder';
  label: string;
  colorToken: string;
};

export type CharacterDefinition = {
  id: CharacterId;
  displayName: string;
  roleLabel: string;
  stance: string;
  avatar: AvatarDefinition;
};

export type DocumentLineStyle =
  | 'normal'
  | 'code'
  | 'log_error'
  | 'log_warn'
  | 'quote'
  | 'comment'
  | 'heading';

export type DocumentLine = {
  id: DocumentLineId;
  speakerId?: CharacterId;
  timestamp?: string;
  text: string;
  style?: DocumentLineStyle;
  evidenceId?: EvidenceId;
};

export type DocumentDefinition = {
  id: DocumentId;
  kind: DocumentKind;
  title: string;
  appLabel: string;
  dockLabel: string;
  appColorToken: string;
  iconLabel: string;
  isPrologueOnly: boolean;
  lines: DocumentLine[];
};

export type EvidenceCardDefinition = {
  id: EvidenceId;
  title: string;
  shortTitle: string;
  sourceDocumentId: DocumentId;
  kind: EvidenceKind;
  factSummary: string;
};

export type DialogueLine = {
  id: DialogueLineId;
  speakerId: CharacterId;
  text: string;
};

export type TargetPhraseDefinition = {
  id: TargetId;
  phrase: string;
  statementLineId: DialogueLineId;
};

export type DeliveryOptionDefinition = {
  id: DeliveryId;
  label: string;
};

export type MeetingRoundDefinition = {
  id: RoundId;
  roundNumber: 1 | 2 | 3 | 4 | 5;
  speakerId: CharacterId;
  title: string;
  npcStatement: DialogueLine[];
  targetPhrases: TargetPhraseDefinition[];
  deliveryOptions: DeliveryOptionDefinition[];
  maxEvidenceSelectable: 0 | 1 | 2;
};

export type FinalDecisionDefinition = {
  id: FinalDecisionId;
  title: string;
  availability: 'always' | 'split_release_unlocked' | 'great_unlocked';
  endingId: EndingId;
};

export type EndingDefinition = {
  id: EndingId;
  banner: 'danger' | 'warning' | 'success' | 'great';
  title: string;
  finalDecisionLabel: string;
  description: string;
  greatRules?: string[];
};

export type StageDefinition = {
  id: StageId;
  title: string;
  subtitle: string;
  playerRole: string;
  situation: string;
  mainGoal: string;
  characters: CharacterDefinition[];
  documents: DocumentDefinition[];
  evidenceCards: EvidenceCardDefinition[];
  meetingRounds: MeetingRoundDefinition[];
  finalDecisions: FinalDecisionDefinition[];
  endings: EndingDefinition[];
};

export type GamePhase = 'prologue' | 'exploration' | 'meeting' | 'finalDecision' | 'result';

export type GameFlags = {
  flakyResolved: boolean;
  customerScopeResolved: boolean;
  rollbackRiskResolved: boolean;
  featureFlagResolved: boolean;
  salesAlly: boolean;
  qaAlly: boolean;
  techleadEnemy: boolean;
  salesEnemy: boolean;
  qaEnemy: boolean;
  meetingBreakdownRisk: number;
  governanceRuleSelected: boolean;
  qaConcernUnderstood: boolean;
  pmCostPressureUnderstood: boolean;
  salesPressureUnderstood: boolean;
};

export type RuleOutcome =
  | 'strong_success'
  | 'partial_success'
  | 'neutral'
  | 'misuse'
  | 'hostile';

export type MeetingLogEntry = {
  id: string;
  roundId?: RoundId;
  text: string;
};

export type PlayerAction = {
  roundId: RoundId;
  targetId?: TargetId;
  evidenceIds: EvidenceId[];
  deliveryId?: DeliveryId;
  outcome?: RuleOutcome;
};

export type GameState = {
  phase: GamePhase;
  currentDocumentId: DocumentId;
  acquiredEvidence: EvidenceId[];
  lastAcquiredEvidenceId?: EvidenceId;
  explorationLocked: boolean;
  meeting: {
    currentRoundIndex: number;
    completedRoundIds: RoundId[];
    selectedTargetId?: TargetId;
    selectedEvidenceIds: EvidenceId[];
    selectedDeliveryId?: DeliveryId;
    actionHistory: PlayerAction[];
    logEntries: MeetingLogEntry[];
  };
  flags: GameFlags;
  finalDecision?: FinalDecisionId;
  ending?: EndingId;
};
