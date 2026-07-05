# Round Rule Table Spec

Status: Draft v0  
Date: 2026-07-05

## Purpose

このSpecは、P0会議バトルのラウンド別判定テーブルを実装向けに整理する。

`03_game_state_and_rules_spec.md` は状態と分岐の全体設計であり、このファイルは実際に `resolveMeetingAction` へ落とすための明示ルール表である。

## Rule Key

R1-R4の判定キー:

```ts
type RuleKey = {
  roundId: RoundId;
  targetId: TargetId;
  evidenceIds: EvidenceId[];
  deliveryId: DeliveryId;
};
```

照合順:

1. exact match
2. round + evidence + delivery match
3. round + evidence match
4. round + delivery match
5. fallback

P0では、すべての組み合わせを網羅しなくてよい。未定義の組み合わせはfallbackで処理する。

## Resolution Output

```ts
type RuleResolution = {
  outcome: 'strong_success' | 'partial_success' | 'neutral' | 'misuse' | 'hostile';
  flagPatch?: Partial<GameFlags>;
  meetingBreakdownRiskDelta?: number;
  playerLog: string;
  npcLog: string;
  unresolvedLog?: string;
};
```

UIに `outcome` を直接表示しない。テストやResult差分の内部材料としてだけ使う。

## Common Fallbacks

### Evidenceなし + 良い出し方

効果:

- enemy化しない
- `meetingBreakdownRisk` を上げない
- resolved/allyは立てない

ログ例:

```text
プレイヤーは、追加確認の必要性を質問した。
このラウンドでは、資料に基づく事実確認までは行われなかった。
```

### 証拠は関連しているがtargetがズレている

効果:

- enemy化しない
- `meetingBreakdownRisk` を上げない
- resolvedは立てない

### 証拠は正しいが攻撃的

効果:

- resolvedは立つ場合がある
- enemyが立つ
- `meetingBreakdownRisk +1`

### CPUスパイクログ

効果:

- resolvedは立てない
- Round 2では `meetingBreakdownRisk +1`
- ログでTech Leadに切り返される

## Round 1: PM 佐伯

Round 1の目的:

- チュートリアル
- 「前回と同じ」前提を軽く揺らす
- Good/Greatの必須条件にはしない

### Strong / Partial Success

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| `r1_target_same_as_last_time` | `ci_legacy_failure` | `comparison_question` | `pmCostPressureUnderstood=true` |
| `r1_target_same_as_last_time` | `past_incident_report` | `comparison_question` | `pmCostPressureUnderstood=true` |
| `r1_target_unrealistic_to_stop` | none | `no_evidence_soften` | `pmCostPressureUnderstood=true` |

ログ例:

```text
佐伯は、前回も似た警告があったと説明した。
プレイヤーは、前回と今回の失敗条件を比較したいと質問した。
佐伯は、対象条件が違うなら同じとは言い切れないと認めた。
```

### Hostile / Misuse

| Case | Effects |
|---|---|
| `direct_objection` with blame tone | `meetingBreakdownRisk +1` |
| バイアス名を直接指摘するdeliveryを将来追加した場合 | `meetingBreakdownRisk +1` |

R1では `pmEnemy` を主要フラグとして持たない。

## Round 2: Tech Lead 黒瀬

Round 2の目的:

- flaky前提を崩す
- Tech Leadを敵化しない

### Strong Success

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| `r2_target_previously_unstable` | `ci_legacy_failure` | `condition_check` | `flakyResolved=true` |
| `r2_target_previously_unstable` | `ci_legacy_failure` | `face_saving` | `flakyResolved=true` |
| `r2_target_previously_unstable` | `jira_bug_418_repro` | `condition_check` | `flakyResolved=true` |
| `r2_target_not_implementation` | `jira_bug_418_repro` | `face_saving` | `flakyResolved=true` |
| `r2_target_not_implementation` | `staging_500_log` | `face_saving` | `flakyResolved=true` |

ログ例:

```text
黒瀬は、失敗しているテストを以前から不安定なものだと説明した。
プレイヤーはCI失敗ログを示し、legacy_plan=true / tax_category=null の条件を確認した。
黒瀬は、legacy条件に絞った追加確認が必要だと認めた。
```

### Risky Success

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| `r2_target_not_implementation` | `pr_tax_category_comment` | `direct_objection` | `flakyResolved=true`, `techleadEnemy=true`, `meetingBreakdownRisk +1` |
| `r2_target_not_implementation` | `pr_tax_category_comment` | `condition_check` | `flakyResolved=true` |
| `r2_target_not_implementation` | `jira_bug_418_repro` | `direct_objection` | `flakyResolved=true`, `techleadEnemy=true`, `meetingBreakdownRisk +1` |

PRコメントとPira/Jira BUG-418は強いが、攻撃的に出すとTech Leadを敵化する。

### Misuse

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| any | `cpu_spike_log` | any | `meetingBreakdownRisk +1` |

ログ例:

```text
プレイヤーはCPUスパイクログを示した。
黒瀬は、それは別チームの負荷テストであり、今回のmigrationとは関係が薄いと説明した。
```

## Round 3: Sales 桐谷

Round 3の目的:

- 顧客の「期限」を「必要機能の範囲」に分解する
- Salesを味方化する

### Strong Success

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| `r3_target_this_month` | `customer_email_scope` | `scope_decomposition` | `customerScopeResolved=true`, `salesAlly=true` |
| `r3_target_losing_trust` | `customer_email_scope` | `interest_translation` | `customerScopeResolved=true`, `salesAlly=true`, `salesPressureUnderstood=true` |

ログ例:

```text
桐谷は、顧客には今月中と伝えていると説明した。
プレイヤーは顧客メールを示し、今月中に必要なのは請求書出力であることを確認した。
桐谷は、請求書出力だけ今月中に出せるなら説明できると答えた。
```

### Hostile

| Case | Effects |
|---|---|
| 営業が勝手に約束したと責める | `salesEnemy=true`, `meetingBreakdownRisk +1` |

ログ例:

```text
プレイヤーは、営業が勝手に約束したのではないかと指摘した。
桐谷は、先週の会議で今月中という話になっていたと反論した。
```

### Neutral

| Case | Effects |
|---|---|
| 証拠なしで信用リスクだけを述べる | resolved/allyなし |

## Round 4: QA 三村

Round 4の目的:

- QAの懸念を認める
- 危険部分と出せる部分を分ける
- R4のみ2枚証拠コンボを使える

### Strong Success

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| `r4_target_dangerous` | `rollback_procedure` | `empathize_then_split` | `rollbackRiskResolved=true` |
| `r4_target_everything` | `feature_flag_design` | `split_proposal` | `featureFlagResolved=true` |
| `r4_target_everything` | `rollback_procedure` + `feature_flag_design` | `empathize_then_split` | `rollbackRiskResolved=true`, `featureFlagResolved=true`, `qaAlly=true` |

ログ例:

```text
三村は、危険なので全部止めるべきだと説明した。
プレイヤーはロールバック手順とFeature Flag設計を示し、customer_data_migrationは止め、請求書出力だけ段階リリースする案を確認した。
三村は、migrationを止めるならその案をレビューできると答えた。
```

### Support Success

| Target | Evidence | Delivery | Effects |
|---|---|---|---|
| `r4_target_previous_incident` | `past_incident_report` | `empathize_then_split` | `qaConcernUnderstood=true` |

注意:

- `past_incident_report` 単独では `qaAlly` を立てない
- `rollbackRiskResolved` も立てない
- Greatには届かない

### Hostile

| Case | Effects |
|---|---|
| 過剰反応と言う | `qaEnemy=true`, `meetingBreakdownRisk +1` |

### Full Stop

| Case | Effects |
|---|---|
| QAに全面的に乗る | resolvedは増えない。R5で全面延期に寄る |

## Round 5: CTO 榊

Round 5の目的:

- 条件に応じて最終判断を選ばせる

常時表示:

- `full_release`
- `full_delay`

条件表示:

- `split_release`
- `split_release_with_governance`

## Fallback Rule

未定義組み合わせ:

```ts
const fallbackResolution: RuleResolution = {
  outcome: 'neutral',
  playerLog: 'プレイヤーは、追加確認が必要だと発言した。',
  npcLog: 'このラウンドでは、前提を変える事実確認までは行われなかった。',
};
```

Fallbackはプレイヤーに「無効」と言わない。会議ログ上は、事実確認が進まなかったことだけを書く。

## Test Cases

必須:

- R2 CI + face_saving => `flakyResolved=true`, `techleadEnemy=false`
- R2 Pira + face_saving => `flakyResolved=true`, `techleadEnemy=false`
- R2 PR + direct_objection => `flakyResolved=true`, `techleadEnemy=true`
- R2 Pira + direct_objection => `flakyResolved=true`, `techleadEnemy=true`
- R2 CPU => `meetingBreakdownRisk +1`, no resolved
- R3 customer email + scope => `customerScopeResolved=true`, `salesAlly=true`
- R3 blame sales => `salesEnemy=true`
- R4 rollback + feature flag combo => `rollbackRiskResolved=true`, `featureFlagResolved=true`, `qaAlly=true`
- R4 past incident only => `qaConcernUnderstood=true`, no `qaAlly`
- R4 overreaction => `qaEnemy=true`
