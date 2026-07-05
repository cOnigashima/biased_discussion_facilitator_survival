# Meeting Interaction Content

Status: Draft v0  
Date: 2026-07-05

## Purpose

このSpecは、P0会議バトルで表示する発言箇所、証拠候補、出し方候補を整理する。

旧handoffからP0外要素を除外し、P0正本に合わせた3段選択にする。

除外するもの:

- ピン留め
- 議事録修正
- Premise Lock表示
- Heat / Clarity / Supportの数値表示
- バイアス名指摘を正解扱いする選択肢

## Interaction Contract

R1-R4の1アクション:

```text
1. 狙う発言箇所
2. 証拠カード
3. 出し方
```

証拠カード:

- 所持カードのみ表示
- `証拠なし` を常に表示
- R1-R3は最大1枚
- R4だけ最大2枚

R5:

- 最終判断選択のみ

## Round 1: PM 佐伯

### NPC Statement

```text
ここまで来て止めるのは現実的じゃないです。
前回も似た警告は出ましたけど、結局問題ありませんでしたよね。
```

### Target Phrases

| Target ID | Phrase | Hidden Issue |
|---|---|---|
| `r1_target_sunk_cost` | ここまで来て | サンクコスト |
| `r1_target_no_alternative` | 止めるのは現実的じゃない | 二択化、代替案不足 |
| `r1_target_same_as_last_time` | 前回も似た警告 | 正常性、同一視 |
| `r1_target_no_problem_last_time` | 問題ありませんでした | 結果からの過信 |

### Delivery Options

| Delivery ID | Label | Intended Use |
|---|---|---|
| `comparison_question` | 前回との差分を確認する | CIや過去障害で同一視を揺らす |
| `condition_check` | 今回の失敗条件を確認する | 今回固有条件へ戻す |
| `no_evidence_soften` | まず確認事項として置く | 証拠なしで荒らさず進める |
| `direct_objection` | 同じではないと強く反論する | 攻撃寄り。リスクあり |

### Main Resolutions

| Target | Evidence | Delivery | Effect |
|---|---|---|---|
| `r1_target_same_as_last_time` | `ci_legacy_failure` | `comparison_question` | `pmCostPressureUnderstood=true` |
| `r1_target_same_as_last_time` | `past_incident_report` | `comparison_question` | `pmCostPressureUnderstood=true` |
| any | none | `no_evidence_soften` | no resolved, no enemy |
| any | any | `direct_objection` | possible `meetingBreakdownRisk +1` |

R1はGood/Great必須条件を直接立てない。

## Round 2: Tech Lead 黒瀬

### NPC Statement

```text
このテストは前から不安定です。
実装の問題というより、テスト側の問題だと思います。
```

### Target Phrases

| Target ID | Phrase | Hidden Issue |
|---|---|---|
| `r2_target_previously_unstable` | 前から不安定 | flaky扱いの根拠が弱い |
| `r2_target_not_implementation` | 実装の問題というより | 条件付き実バグの可能性を除外している |
| `r2_target_test_side` | テスト側の問題 | 責任をテストへ寄せている |

### Delivery Options

| Delivery ID | Label | Intended Use |
|---|---|---|
| `condition_check` | 失敗条件を確認する | flakyか条件付きかを確認する |
| `face_saving` | legacy条件だけに絞って確認する | Tech Leadの面子を守る |
| `direct_objection` | 設計ミスとして指摘する | PRコメント使用時に敵化しやすい |
| `no_evidence_soften` | 追加確認だけ提案する | 証拠なしで荒らさない |

### Main Resolutions

| Target | Evidence | Delivery | Effect |
|---|---|---|---|
| `r2_target_previously_unstable` | `ci_legacy_failure` | `condition_check` | `flakyResolved=true` |
| `r2_target_previously_unstable` | `ci_legacy_failure` | `face_saving` | `flakyResolved=true` |
| `r2_target_previously_unstable` | `jira_bug_418_repro` | `condition_check` | `flakyResolved=true` |
| `r2_target_not_implementation` | `jira_bug_418_repro` | `face_saving` | `flakyResolved=true` |
| `r2_target_not_implementation` | `staging_500_log` | `face_saving` | `flakyResolved=true` |
| `r2_target_not_implementation` | `pr_tax_category_comment` | `condition_check` | `flakyResolved=true` |
| `r2_target_not_implementation` | `pr_tax_category_comment` | `direct_objection` | `flakyResolved=true`, `techleadEnemy=true`, `meetingBreakdownRisk +1` |
| `r2_target_not_implementation` | `jira_bug_418_repro` | `direct_objection` | `flakyResolved=true`, `techleadEnemy=true`, `meetingBreakdownRisk +1` |
| any | `cpu_spike_log` | any | `meetingBreakdownRisk +1`, no resolved |

## Round 3: Sales 桐谷

### NPC Statement

```text
顧客には今月中に出すと伝えています。
ここで延期したら信用を失います。
```

### Target Phrases

| Target ID | Phrase | Hidden Issue |
|---|---|---|
| `r3_target_this_month` | 今月中に出す | 期限と機能範囲が混ざっている |
| `r3_target_losing_trust` | 信用を失います | 損失フレームで全面Goへ寄っている |

### Delivery Options

| Delivery ID | Label | Intended Use |
|---|---|---|
| `scope_decomposition` | 必要機能の範囲を分ける | 顧客メールを使う主ルート |
| `interest_translation` | 顧客説明に使える形へ言い換える | Sales allyを狙う |
| `direct_objection` | 事故リスクを強く押す | 部分的に通るが荒れやすい |
| `accuse` | 営業の約束の仕方を責める | enemy化 |

### Main Resolutions

| Target | Evidence | Delivery | Effect |
|---|---|---|---|
| `r3_target_this_month` | `customer_email_scope` | `scope_decomposition` | `customerScopeResolved=true`, `salesAlly=true` |
| `r3_target_losing_trust` | `customer_email_scope` | `interest_translation` | `customerScopeResolved=true`, `salesAlly=true`, `salesPressureUnderstood=true` |
| any | none | `direct_objection` | no resolved, possible `meetingBreakdownRisk +1` |
| any | any | `accuse` | `salesEnemy=true`, `meetingBreakdownRisk +1` |

## Round 4: QA 三村

### NPC Statement

```text
それでも危険です。全部止めるべきです。
前回もこういう軽視から障害になりました。
```

### Target Phrases

| Target ID | Phrase | Hidden Issue |
|---|---|---|
| `r4_target_dangerous` | 危険です | リスク自体は妥当 |
| `r4_target_everything` | 全部止めるべき | 危険範囲と安全範囲が混ざっている |
| `r4_target_previous_incident` | 前回もこういう軽視 | 過去障害の記憶に引っ張られている |

### Delivery Options

| Delivery ID | Label | Intended Use |
|---|---|---|
| `empathize_then_split` | 懸念に共感してから分ける | R4の主ルート |
| `split_proposal` | 危険部分と出せる部分を分ける | Feature Flagを使う |
| `agree_full_stop` | 全面停止に乗る | Normal寄り |
| `direct_objection` | 過剰反応として反論する | enemy化 |

### Main Resolutions

| Target | Evidence | Delivery | Effect |
|---|---|---|---|
| `r4_target_dangerous` | `rollback_procedure` | `empathize_then_split` | `rollbackRiskResolved=true` |
| `r4_target_everything` | `feature_flag_design` | `split_proposal` | `featureFlagResolved=true` |
| `r4_target_everything` | `rollback_procedure` + `feature_flag_design` | `empathize_then_split` | `rollbackRiskResolved=true`, `featureFlagResolved=true`, `qaAlly=true` |
| `r4_target_previous_incident` | `past_incident_report` | `empathize_then_split` | `qaConcernUnderstood=true`, no `qaAlly` |
| any | none | `agree_full_stop` | no resolved, final full delay remains likely |
| any | any | `direct_objection` | `qaEnemy=true`, `meetingBreakdownRisk +1` |

## Round 5: CTO 榊

### NPC Statement

```text
では、結論としてどうしたいんですか？
```

### Final Decisions

| Decision ID | Label | Availability |
|---|---|---|
| `full_release` | 全面リリース | always |
| `full_delay` | 全面延期 | always |
| `split_release` | 分割リリース | `canChooseSplitRelease` |
| `split_release_with_governance` | 分割リリース + Go/No-Go基準の明文化 | `canChooseGovernedSplitRelease` |

## Non-Blocking Copy Work

実装中に補完するcopy:

- 各Main ResolutionのplayerLog
- 各Main ResolutionのnpcLog
- fallback log
- Result用の確認できた/できなかった事実copy

これは実装開始前のブロッカーではない。選択肢セット、主要効果、ログの書き方方針はこのSpecで固定済みであり、詳細copyはrule resolution copy tableとResult summary builderで補完する。
