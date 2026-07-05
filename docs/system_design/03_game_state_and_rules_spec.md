# Game State and Rules Spec

Status: Draft v0  
Date: 2026-07-05

## Purpose

このSpecは、P0のゲーム状態、イベント、ルール判定、最終分岐を定義する。

UIの見た目ではなく、「プレイヤーの入力がどの状態変化を起こし、どの選択肢やEndingを解放するか」を扱う。

## Principles

P0のルール設計原則:

- 数値スコアをプレイヤーには見せない
- 判定はUIから独立させる
- 汎用スコア式より、P0専用の明示的なルール表を優先する
- 会議ログはゲーム判定文ではなく、事実ログとして生成する
- 証拠カードの用途ヒントは探索中に出さない
- P0外のPremise Lock、ピン留め、議事録修正は状態に入れない

## Core IDs

IDは文字列リテラルunionとして定義する。

```ts
type EvidenceId =
  | 'jira_bug_418_repro'
  | 'ci_legacy_failure'
  | 'customer_email_scope'
  | 'rollback_procedure'
  | 'feature_flag_design'
  | 'staging_500_log'
  | 'pr_tax_category_comment'
  | 'past_incident_report'
  | 'cpu_spike_log';

type RoundId = 'round1_pm' | 'round2_techlead' | 'round3_sales' | 'round4_qa' | 'round5_cto';

type EndingId = 'bad' | 'normal' | 'good' | 'great';
```

## GameState

P0の状態は以下を持つ。

```ts
type GameState = {
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
```

`acquiredEvidence` は順序を持つ。探索で見つけた順をEvidence TrayやResultに使えるため。

## GameFlags

主要フラグ:

```ts
type GameFlags = {
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
```

P0では `pmEnemy` は主要条件に含めない。PMへの攻撃は `meetingBreakdownRisk` や補助ログで表現する。

## Events

Reducerに渡すイベント:

```ts
type GameAction =
  | { type: 'START_EXPLORATION' }
  | { type: 'OPEN_DOCUMENT'; documentId: DocumentId }
  | { type: 'ACQUIRE_EVIDENCE'; evidenceId: EvidenceId; documentId: DocumentId; lineId: DocumentLineId }
  | { type: 'DISMISS_EVIDENCE_MODAL' }
  | { type: 'START_MEETING' }
  | { type: 'SELECT_TARGET'; targetId: TargetId }
  | { type: 'SELECT_EVIDENCE'; evidenceIds: EvidenceId[] }
  | { type: 'SELECT_DELIVERY'; deliveryId: DeliveryId }
  | { type: 'CONFIRM_MEETING_ACTION' }
  | { type: 'CHOOSE_FINAL_DECISION'; decisionId: FinalDecisionId }
  | { type: 'RESTART' };
```

`CONFIRM_MEETING_ACTION` 時に、現在ラウンド・選択target・証拠・出し方から `ActionResolution` を生成する。

## Evidence Acquisition Rules

証拠取得条件:

- `phase === 'exploration'`
- `explorationLocked === false`
- 対象行が `evidenceId` を持つ
- その証拠をまだ取得していない

証拠カード総数:

- P0実装では9枚
- Pira/Jira BUG-418由来の `jira_bug_418_repro` を含める
- CPU Spike Log由来の `cpu_spike_log` も罠カードとして含める

取得時の効果:

- `acquiredEvidence` に追加
- `lastAcquiredEvidenceId` を更新
- 取得済み表示に使うため、UI selectorで行状態を返す

取得時にやらないこと:

- 用途ヒントを表示しない
- 会議フラグを更新しない
- 解決フラグを立てない

会議開始可能条件:

```ts
function canStartMeeting(state: GameState): boolean {
  return state.acquiredEvidence.length >= 2 && !state.explorationLocked;
}
```

Slackは証拠化しないため、`acquiredEvidence` に入らない。

## Meeting Selection Rules

R1-R3:

- 証拠は0枚または1枚
- `証拠なし` は `selectedEvidenceIds = []`

R4:

- 証拠は0枚、1枚、または2枚
- 複数証拠コンボはR4だけ

R5:

- target/evidence/delivery選択は使わない
- FinalDecisionを選ぶ

## ActionResolution

ルール層は、確定アクションから以下を返す。

```ts
type ActionResolution = {
  flagPatch: Partial<GameFlags>;
  meetingBreakdownRiskDelta?: number;
  logEntries: MeetingLogEntry[];
  npcResponse?: DialogueLine;
  roundCompleted: boolean;
};
```

`flagPatch` と `meetingBreakdownRiskDelta` を分ける理由は、整数加算を明示するため。

## Round Rule Table

### Round 1: PM

Round 1はGood/Great必須ではない。チュートリアル兼、会議の空気作り。

主要成功:

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| 前回も似た警告 | `ci_legacy_failure` | 比較質問/条件確認 | `pmCostPressureUnderstood=true` |
| ここまで来て止めるのは現実的ではない | none | 代替案を確認 | `pmCostPressureUnderstood=true` |

攻撃的な出し方:

| Case | Effects |
|---|---|
| バイアス名を直接指摘 | `meetingBreakdownRisk +1` |
| PMを責める | `meetingBreakdownRisk +1` |

R1は `flakyResolved` などの主要Good/Great条件を直接立てない。

### Round 2: Tech Lead

役割:

- flaky前提を崩す
- Tech Leadを敵化しない

主要成功:

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| 前から不安定 | `ci_legacy_failure` | 条件確認 | `flakyResolved=true` |
| 前から不安定 | `jira_bug_418_repro` | 条件確認 | `flakyResolved=true` |
| 実装の問題ではない | `jira_bug_418_repro` | 退路提示 | `flakyResolved=true` |
| 実装の問題ではない | `staging_500_log` | 退路提示 | `flakyResolved=true` |
| 前から不安定 | `ci_legacy_failure` | 退路提示 | `flakyResolved=true` |

PRコメントの扱い:

| Case | Effects |
|---|---|
| `pr_tax_category_comment` + 攻撃的 | `flakyResolved=true`, `techleadEnemy=true`, `meetingBreakdownRisk +1` |
| `pr_tax_category_comment` + legacy条件確認 | `flakyResolved` は立ててもよいが、CI/stagingより弱いログ文にする |

Pira/Jira BUG-418の扱い:

| Case | Effects |
|---|---|
| `jira_bug_418_repro` + 条件確認/退路提示 | `flakyResolved=true` |
| `jira_bug_418_repro` + 攻撃的 | `flakyResolved=true`, `techleadEnemy=true`, `meetingBreakdownRisk +1` |

Pira/Jiraは「QAがstagingで再現済み」という事実のため、PRコメントより強く、Staging Logよりは文脈寄りの証拠として扱う。

CPU罠:

| Case | Effects |
|---|---|
| `cpu_spike_log` を使う | `meetingBreakdownRisk +1`、主要resolvedは立たない |

### Round 3: Sales

役割:

- 顧客要求を「期限」から「必要機能の範囲」へ分解する
- Salesを味方化する

主要成功:

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| 顧客には今月中 | `customer_email_scope` | スコープ分解 | `customerScopeResolved=true`, `salesAlly=true` |
| 信用を失う | `customer_email_scope` | 利害翻訳 | `customerScopeResolved=true`, `salesAlly=true`, `salesPressureUnderstood=true` |

失敗/攻撃:

| Case | Effects |
|---|---|
| 営業が勝手に約束したと責める | `salesEnemy=true`, `meetingBreakdownRisk +1` |
| 証拠なしで一般論だけ言う | enemy化は避けられるが、resolved/allyは立たない |

### Round 4: QA

役割:

- QAの懸念を認める
- 全面停止ではなく危険部分だけ止める
- R4だけ複数証拠コンボを許可する

主要成功:

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| 危険 | `rollback_procedure` | 共感してから分割 | `rollbackRiskResolved=true` |
| 全部止めるべき | `feature_flag_design` | 分割提案 | `featureFlagResolved=true` |
| 全部止めるべき | `rollback_procedure` + `feature_flag_design` | 共感してから分割 | `rollbackRiskResolved=true`, `featureFlagResolved=true`, `qaAlly=true` |

補助:

| Case | Effects |
|---|---|
| `past_incident_report` + 共感 | `qaConcernUnderstood=true`。ただし `qaAlly=false`, `rollbackRiskResolved=false` |

失敗/攻撃:

| Case | Effects |
|---|---|
| 過剰反応と言う | `qaEnemy=true`, `meetingBreakdownRisk +1` |
| 全面停止に乗る | resolvedは増えず、R5で全面延期に寄る |

### Round 5: CTO

R5は最終判断。常時表示:

- 全面リリース
- 全面延期

条件表示:

- 分割リリース
- 分割リリース + Go/No-Go基準明文化

未解放の選択肢はグレー表示しない。そもそも一覧に出さない。

## Final Decision Unlock Rules

分割リリース:

```ts
function canChooseSplitRelease(flags: GameFlags): boolean {
  return (
    flags.customerScopeResolved &&
    (flags.rollbackRiskResolved || flags.featureFlagResolved) &&
    (flags.salesAlly || flags.qaAlly) &&
    !flags.techleadEnemy &&
    !flags.salesEnemy &&
    !flags.qaEnemy
  );
}
```

Great選択肢:

```ts
function canChooseGovernedSplitRelease(flags: GameFlags): boolean {
  return (
    canChooseSplitRelease(flags) &&
    flags.salesAlly &&
    flags.qaAlly &&
    flags.flakyResolved &&
    flags.rollbackRiskResolved &&
    flags.featureFlagResolved &&
    !flags.techleadEnemy &&
    flags.meetingBreakdownRisk < 3
  );
}
```

## Ending Rules

```ts
function decideEnding(decision: FinalDecisionId, flags: GameFlags): EndingId {
  if (decision === 'full_release') return 'bad';
  if (decision === 'full_delay') return 'normal';
  if (decision === 'split_release') return 'good';
  if (decision === 'split_release_with_governance') return 'great';
}
```

補足:

- 全面リリースは危険なmigrationまで出すため常にBad
- 全面延期は基本Normal
- 分割リリースは、選択肢が表示された時点でGood以上
- GreatはR5で明文化選択肢を選んだ場合

`meetingBreakdownRisk >= 3` の扱い:

- Great選択肢は出ない
- Good条件達成済みならGoodは可能
- Good未達なら最終選択肢が全面リリース/全面延期に限られる
- ResultSummaryで「会議は荒れた」差分を出す

## Meeting Log Rules

会議ログは事実だけを書く。

書くもの:

- 誰が何を主張した
- プレイヤーが何を提示/質問した
- 何が確認された
- 何は確認されなかった
- 最終的にどの判断が選ばれた

書かないもの:

- 成功/失敗
- 危うい/まずい
- 正解/不正解
- Premise Lock演出
- バイアス名
- 内部フラグ名

例:

```text
黒瀬は、失敗しているテストを以前から不安定なものだと説明した。
プレイヤーはCI失敗ログを示し、legacy_plan=true / tax_category=null の条件を確認した。
黒瀬は、legacy条件に絞った追加確認が必要だと認めた。
```

## Result Summary Rules

ResultはEnding別テンプレート + フラグ差分で生成する。

確認できた事実:

- `flakyResolved`
- `customerScopeResolved`
- `rollbackRiskResolved`
- `featureFlagResolved`

確認できなかった事実:

- 上記のfalse項目

関係結果:

- `salesAlly`
- `qaAlly`
- `techleadEnemy`
- `salesEnemy`
- `qaEnemy`

Great時に表示するルール:

```text
1. 同一条件で複数回落ちるCIはflaky扱いしない
2. ロールバック不能なwrite/migrationはGo/No-Go前に明示する
3. 顧客要求は「期限」だけでなく「必要機能の範囲」まで確認する
```

P0ではこの3本をまとめて制度化する。個別選択にはしない。

## Validation Paths

最低限、次のプレイ経路がルールテストで再現できること。

### Great Path

```text
Acquire: ci_legacy_failure, customer_email_scope, rollback_procedure, feature_flag_design
R2: CI失敗ログ + 退路提示
R3: 顧客メール + スコープ分解
R4: rollback_procedure + feature_flag_design + 共感して分割
R5: 分割リリース + Go/No-Go基準明文化
Ending: great
```

### Good Path

```text
R3でcustomerScopeResolved
R4でrollbackRiskResolved or featureFlagResolved
salesAlly or qaAlly
enemyなし
R5: 分割リリース
Ending: good
```

### Tech Lead Enemy Path

```text
R2: PRコメント + 設計ミス扱い
techleadEnemy=true
R5: 分割リリース選択肢なし
```

Pira/Jiraでも同じ敵化経路を持つ。

```text
R2: Jira BUG-418 + 設計ミス扱い
techleadEnemy=true
R5: 分割リリース選択肢なし
```

### Full Release Bad Path

```text
R5: 全面リリース
Ending: bad
```

### Full Delay Normal Path

```text
R5: 全面延期
Ending: normal
```
