# Scenario Data Schema

Status: Draft v0  
Date: 2026-07-05

## Purpose

このSpecは、P0ステージをReact/TypeScript実装へ落とすためのシナリオデータ構造を定義する。

初期実装ではJSON/YAMLではなくTypeScript構造化データとして持つ。ただし、将来JSON/YAMLへ切り出せるよう、Reactコンポーネントや実行関数をscenario dataに混ぜない。

## Design Principles

- scenario dataは純データに寄せる
- UIコンポーネントはscenario dataを直接編集しない
- ルール判定はscenario dataではなくdomain layerに置く
- ID参照はTypeScript unionで縛る
- P0は1ステージ固定だが、Stage単位で追加できる形にする
- カンプ再現用の見た目情報は、必要最小限だけscenario dataに持つ

## Top-Level Stage

```ts
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
```

P0では `StageId` は固定。

```ts
export type StageId = 'go_no_go_payment_v2';
```

## Characters

```ts
export type CharacterId =
  | 'pm_saeki'
  | 'techlead_kurose'
  | 'sales_kiritani'
  | 'qa_mimura'
  | 'cto_sakaki'
  | 'player';

export type CharacterDefinition = {
  id: CharacterId;
  displayName: string;
  roleLabel: string;
  stance: string;
  avatar: AvatarDefinition;
};

export type AvatarDefinition = {
  kind: 'css_bird_placeholder' | 'player_placeholder';
  label: string;
  colorToken: string;
};
```

P0では、キャラクターの隠れた利害やbias一覧はResult文や将来拡張用の素材として残せるが、初期実装の主要データには入れない。プレイ中にバイアス名を出さないため。

## Documents

```ts
export type DocumentId =
  | 'pilack_release_check'
  | 'pira_bug_418'
  | 'pr_tax_category_comment'
  | 'ci_checkout_v2_failure'
  | 'staging_500_log'
  | 'customer_email_scope'
  | 'rollback_procedure'
  | 'feature_flag_design'
  | 'past_incident_report'
  | 'cpu_spike_log';

export type DocumentKind =
  | 'pilack'
  | 'pira'
  | 'pr'
  | 'ci'
  | 'staging'
  | 'mail'
  | 'runbook'
  | 'feature_flag'
  | 'incident'
  | 'metrics';

export type DocumentLineId = string;

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

export type DocumentLine = {
  id: DocumentLineId;
  speakerId?: CharacterId;
  timestamp?: string;
  text: string;
  style?: DocumentLineStyle;
  evidenceId?: EvidenceId;
};

export type DocumentLineStyle =
  | 'normal'
  | 'code'
  | 'log_error'
  | 'log_warn'
  | 'quote'
  | 'comment'
  | 'heading';
```

`evidenceId` がある行だけ、探索中に証拠取得可能。

重要:

- `isPrologueOnly=true` のPilack/Slack導入は証拠化しない
- クリック可能行と罠行は見た目で区別しない
- `evidenceId` はUIで常時ハイライトするためではなく、hover/focus時のクリック可能判定に使う
- `DocumentLineId` は初期実装では `string` alias とする。seed dataが固まった後、必要なら生成型または明示unionへnarrowする

## Evidence Cards

```ts
export type EvidenceId =
  | 'jira_bug_418_repro'
  | 'ci_legacy_failure'
  | 'customer_email_scope'
  | 'rollback_procedure'
  | 'feature_flag_design'
  | 'staging_500_log'
  | 'pr_tax_category_comment'
  | 'past_incident_report'
  | 'cpu_spike_log';

export type EvidenceKind = 'primary' | 'support' | 'trap';

export type EvidenceCardDefinition = {
  id: EvidenceId;
  title: string;
  shortTitle: string;
  sourceDocumentId: DocumentId;
  kind: EvidenceKind;
  factSummary: string;
};
```

`factSummary` は取得時モーダルと証拠カード一覧に表示する。

表示してよい例:

```text
legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。
```

表示してはいけない例:

```text
これはTech Leadのflaky主張を崩す証拠です。
```

## Meeting Rounds

```ts
export type RoundId =
  | 'round1_pm'
  | 'round2_techlead'
  | 'round3_sales'
  | 'round4_qa'
  | 'round5_cto';

export type DialogueLineId = string;

export type TargetId =
  | 'r1_target_sunk_cost'
  | 'r1_target_no_alternative'
  | 'r1_target_same_as_last_time'
  | 'r1_target_no_problem_last_time'
  | 'r2_target_previously_unstable'
  | 'r2_target_not_implementation'
  | 'r2_target_test_side'
  | 'r3_target_this_month'
  | 'r3_target_losing_trust'
  | 'r4_target_dangerous'
  | 'r4_target_everything'
  | 'r4_target_previous_incident';

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
```

R1-R4:

- `maxEvidenceSelectable` はR1-R3が `1`
- R4だけ `2`

R5:

- final decisionのみなので `targetPhrases=[]`
- `deliveryOptions=[]`
- `maxEvidenceSelectable=0`

ID方針:

- `TargetId` は `11_meeting_interaction_content.md` のTarget ID一覧を正として明示unionにする
- `DialogueLineId` は初期実装では `string` alias とする
- `TargetPhraseDefinition.statementLineId` は、同じ `MeetingRoundDefinition.npcStatement` 内に存在する `DialogueLineId` を参照する
- 起動時またはテスト時のscenario integrity validatorで、`statementLineId` の参照整合を検証する

## Delivery IDs

出し方はラウンドごとの固定候補として表示する。

```ts
export type DeliveryId =
  | 'comparison_question'
  | 'condition_check'
  | 'face_saving'
  | 'scope_decomposition'
  | 'interest_translation'
  | 'empathize_then_split'
  | 'split_proposal'
  | 'direct_objection'
  | 'accuse'
  | 'agree_full_stop'
  | 'no_evidence_soften';
```

同じ `DeliveryId` でも、ラウンドごとに意味は変わり得る。実際の判定は `roundId + targetId + evidenceIds + deliveryId` で行う。

## Final Decisions

```ts
export type FinalDecisionId =
  | 'full_release'
  | 'full_delay'
  | 'split_release'
  | 'split_release_with_governance';

export type FinalDecisionDefinition = {
  id: FinalDecisionId;
  title: string;
  body: string;
  availability: FinalDecisionAvailability;
  resultEndingId: EndingId;
};

export type FinalDecisionAvailability =
  | { kind: 'always' }
  | { kind: 'split_release_unlocked' }
  | { kind: 'great_unlocked' };
```

UIは `availability` を直接解釈しない。domain layerのselectorが、現在のGameStateから表示可能なFinalDecisionを返す。

未解放の選択肢は表示しない。

## Endings

```ts
export type EndingId = 'bad' | 'normal' | 'good' | 'great';

export type EndingDefinition = {
  id: EndingId;
  label: string;
  title: string;
  bannerTone: 'danger' | 'warning' | 'success' | 'great';
  finalDecisionSummary: string;
  defaultReflection: string;
  biasReflectionItems: BiasReflectionItem[];
};

export type BiasReflectionItem = {
  text: string;
  relatedBiases: string[];
};
```

Resultの最終文面は、`EndingDefinition` にGameStateから生成した差分を足して作る。

## Example: Evidence Card

```ts
export const ciLegacyFailureEvidence: EvidenceCardDefinition = {
  id: 'ci_legacy_failure',
  title: 'CI失敗ログ',
  shortTitle: 'CI失敗',
  sourceDocumentId: 'ci_checkout_v2_failure',
  kind: 'primary',
  factSummary:
    'legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。',
};
```

## Example: Document Line

```ts
{
  id: 'ci_line_failure_case',
  text: 'legacy_plan=true / tax_category=null / NoMethodError: undefined method `rate` for nil:NilClass',
  style: 'log_error',
  evidenceId: 'ci_legacy_failure',
}
```

## Example: Meeting Round

```ts
export const round2TechLead: MeetingRoundDefinition = {
  id: 'round2_techlead',
  roundNumber: 2,
  speakerId: 'techlead_kurose',
  title: 'Tech Lead 黒瀬: flaky test',
  npcStatement: [
    {
      id: 'r2_statement_main',
      speakerId: 'techlead_kurose',
      text: 'このテストは前から不安定です。実装の問題というより、テスト側の問題だと思います。',
    },
  ],
  targetPhrases: [
    {
      id: 'r2_target_previously_unstable',
      phrase: '前から不安定',
      statementLineId: 'r2_statement_main',
    },
    {
      id: 'r2_target_not_implementation',
      phrase: '実装の問題というより',
      statementLineId: 'r2_statement_main',
    },
  ],
  deliveryOptions: [
    { id: 'condition_check', label: '失敗条件を確認する' },
    { id: 'face_saving', label: 'legacy条件だけに絞って確認する' },
    { id: 'direct_objection', label: '設計ミスとして指摘する' },
  ],
  maxEvidenceSelectable: 1,
};
```

## Scenario Integrity Checks

実装時にテストまたは起動時検証したいこと:

- 全Documentの `evidenceId` が `EvidenceCardDefinition` に存在する
- 各EvidenceCardの `sourceDocumentId` が存在する
- Slack/Pilackは `isPrologueOnly=true` かつ証拠化行を持たない
- R1-R4はtargetPhrasesとdeliveryOptionsを持つ
- R5はtargetPhrasesとdeliveryOptionsを持たない
- R4だけ `maxEvidenceSelectable=2`
- FinalDecisionは4種類存在する
- Endingは4種類存在する
- 全TargetPhraseの `statementLineId` が同一Round内のDialogueLineに存在する
- ID重複がない

## Future JSON/YAML Migration

将来外部ファイル化しやすいもの:

- CharacterDefinition
- DocumentDefinition
- EvidenceCardDefinition
- MeetingRoundDefinition
- EndingDefinition

外部化しにくいためTypeScriptに残すもの:

- Action resolution rule table
- Final decision unlock predicates
- ResultSummary builder
- Scenario integrity validator
