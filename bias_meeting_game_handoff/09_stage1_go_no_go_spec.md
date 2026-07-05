# Stage 1 Spec: 決済v2 Go/No-Go会議

## Stage Title

候補：

- Go / No-Go: 決済v2
- Release Judgment: 決済移行前夜
- 炎上前夜: customer_data_migration

## Player Role

シニアエンジニア。決済v2リリースのGo/No-Go会議に参加する。

## Situation

明日、新しい決済フロー `checkout_v2` と関連する請求書出力機能、顧客データmigrationをリリースする予定。

Slack上では、CIが赤いがPMとTech LeadはGo寄り。QAは危険と主張。営業は顧客に今月中と伝えている。CTOは事業速度を重視しつつも、事故は避けたい。

探索パートで資料を読み、会議バトルで最終判断を変える。

## Main Decision

以下のどれに着地するか。

1. 全面リリース
2. 全面延期
3. 危険部分だけ延期し、必要機能だけ出す
4. 3に加えて次回Go/No-Go基準を制度化する

## Initial Meeting State

```yaml
heat: 1
clarity: 1
support: 1
time: 5
momentum: release
premise_lock:
  same_as_last_time: 0
  flaky_test: 0
  customer_needs_all_features: 0
  stop_everything: 0
```

## Characters

| Character | Role | Initial Stance |
|---|---|---|
| 佐伯 | PM | Go |
| 黒瀬 | Tech Lead | Go / design defense |
| 三村 | QA | No-Go / stop everything |
| 桐谷 | Sales | Go / customer promise |
| 榊 | CTO | Wants decision / speed with acceptable risk |

## Exploration Documents

### Slack: `#release-check`

```text
PM 佐伯:
明日の決済v2リリース、基本的にはGoで進めたいです。
CIが少し赤いですが、前回も似たような警告はありましたし、
最後は通ったので大丈夫だと思っています。

Tech Lead 黒瀬:
決済周りの実装は大きな問題ないです。
落ちているテストは以前から不安定なやつですね。

QA 三村:
今回の失敗は前回と違います。
legacy_plan=true の顧客で同じ落ち方をしています。
このまま出すのは危険です。

営業 桐谷:
顧客には今月中に出すと伝えています。
ここで延期になると説明がかなり厳しいです。
```

### Jira: `BUG-418`

```text
BUG-418: legacy_plan=true の顧客で checkout_v2 が失敗する

Priority: P2
Status: Open

QA comment:
stagingで3回再現。
tax_category が null の場合に migration 後のcheckoutで500。

Tech Lead comment:
既存データの揺れによるもの。
リリース後のcleanupで対応可能。
```

### PR Comment

```text
Reviewer:
legacy customer の tax_category が null の場合、migration後に参照エラーになりませんか？

Author:
通常フローでは tax_category は必須なので問題ない想定です。
古い顧客データは別途cleanupで対応予定。
```

### CI Log

```text
Failed: CheckoutV2MigrationSpec
Seed: 18433

Case:
legacy_plan = true
tax_category = null
invoice_export_enabled = true

Error:
NoMethodError: undefined method `rate' for nil:NilClass
```

### Customer Email

```text
今月中に必要なのは、請求書出力の新フォーマット対応です。
新しい決済フローについては、来月初旬の展開でも問題ありません。
ただし、今月の請求処理に影響が出ると困ります。
```

### Rollback Procedure

```text
checkout_v2 UI:
feature flagで無効化可能。

invoice export:
旧フォーマットへ切り戻し可能。

customer_data_migration:
本番write後の完全ロールバック不可。
手動修正が必要。
```

### Feature Flag Design

```text
Feature Flags:
- checkout_v2_enabled
- invoice_export_v2_enabled
- migration_write_enabled

Note:
checkout UI と invoice export は個別制御可能。
customer_data_migration は一度writeすると完全な自動rollbackは不可。
```

### Past Incident Report

```text
3か月前、stagingで出ていた軽微な警告をflakyとして扱い、
本番で一部顧客の請求処理が失敗した。

ただし、当時の原因はタイムゾーン変換であり、今回の tax_category とは直接同一ではない。
```

### Red Herring: CPU Spike Log

```text
staging環境で一時的なCPUスパイクあり。
原因は別チームの負荷テスト。
今回の checkout_v2 migration とは直接関係が薄い。
```

## Evidence Cards

| ID | Title | Core Use | Risk |
|---|---|---|---|
| ci_legacy_failure | CI失敗ログ | flaky主張を崩す | 低 |
| pr_tax_category_comment | PRコメント | 事前懸念があった証拠 | 中。Tech Leadの面子を傷つける |
| staging_500_log | staging障害ログ | 実行時再現 | 低 |
| customer_email_scope | 顧客メール | 顧客要求を分解 | 低 |
| rollback_procedure | ロールバック手順 | 危険部分特定 | 低 |
| feature_flag_design | Feature Flag設計 | 分割リリース案 | 低 |
| past_incident_report | 過去障害報告 | 正常性を崩す補助 | 中。原因が違うため雑に使うと反撃 |
| cpu_spike_log | CPUスパイクログ | 罠 | 高 |

## Core Premise Nodes

| ID | Premise | Initial | Bad if locked | Resolved State |
|---|---|---|---|---|
| same_as_last_time | 前回と同じ警告 | 未検証 | 正常性でGo寄り | 今回は別条件と認識 |
| flaky_test | CI失敗はflaky | 未検証 | 技術リスクが隠れる | 条件付き実バグとして扱う |
| customer_needs_all | 顧客は全機能を今月必要 | 未検証 | 全面Go圧 | 請求書出力だけ必要 |
| stop_everything | 全部止めるべき | 未検証 | 全面延期 | 危険部分だけ止める |
| rollback_risk | ロールバック不能変更 | 未整理 | migrationがGoされる | migration延期 |
| go_no_go_rule | 次回ルール化 | 未提案 | その場しのぎ | Great条件 |

## Battle Rounds

### Round 1: PM 佐伯

発言：

```text
ここまで来て止めるのは現実的じゃないです。
前回も似た警告は出ましたけど、結局問題ありませんでしたよね。
```

狙い：

- 前回と今回が同じか。
- 過去コストに引っ張られていないか。

良手：

- CIログで比較質問。
- 前回との差分を見る。

悪手：

- 「それは正常性バイアスです」
- 「無責任です」

### Round 2: Tech Lead 黒瀬

発言：

```text
このテストは前から不安定です。
実装の問題というより、テスト側の問題だと思います。
```

狙い：

- flaky testか、条件付き実バグか。
- 設計全体ではなくlegacy条件に絞れるか。

良手：

- CIログ + stagingログ。
- 退路提示：「設計全体ではなく、legacy条件だけ確認したい」

悪手：

- 「設計ミスですね」
- PRコメントを強く突きつける。

### Round 3: Sales 桐谷

発言：

```text
顧客には今月中に出すと伝えています。
ここで延期したら信用を失います。
```

狙い：

- 顧客が今月中に必要なのは何か。
- 顧客約束を守る方法は全機能リリースだけか。

良手：

- 顧客メールでスコープ分解。
- 「請求書出力だけ出せば説明できるか」

悪手：

- 「営業が勝手に約束しただけ」

### Round 4: QA 三村

発言：

```text
それでも危険です。全部止めるべきです。
前回もこういう軽視から障害になりました。
```

狙い：

- 危険という判断は認める。
- ただし全部止める必要があるかを分ける。

良手：

- ロールバック手順 + Feature Flag設計。
- 危険なのはcustomer_data_migrationと整理。

悪手：

- 「過剰反応です」
- QAに全面的に乗って全部止める。

### Round 5: CTO 榊

発言：

```text
では、結論としてどうしたいんですか？
```

選択：

- 全面リリース
- 全面延期
- 請求書出力のみリリース、migration延期
- 上記 + 次回Go/No-Go基準化

## Minute Revision Phase

自動議事録ドラフト例：

```text
- CI失敗は既知のflaky testと判断。
- 顧客都合により今月中のリリースが必要。
- QA懸念はあるが、影響範囲は限定的。
- 予定通りGo。
```

プレイヤーが修正する：

```text
- CI失敗は legacy_plan=true かつ tax_category=null で再現しており、flakyとは記録しない。
- 顧客が今月中に必要としているのは請求書出力であり、新決済フロー全体ではない。
- ロールバック不能なのは customer_data_migration である。
- 決定: invoice exportのみ段階リリース。checkout_v2 UIはfeature flag off。customer_data_migrationは延期。
```

## Endings

### Bad: 強行リリース

条件：

- flaky前提がロック。
- 顧客全機能必要前提がロック。
- migrationリスク未整理。

結果：

- 本番でlegacy顧客のcheckoutが500。
- ロールバック困難。
- ポストモーテムで責任追及。

### Bad 2: 会議決裂

条件：

- Heatが最大。
- Tech Leadまたは営業を敵化。
- Support不足。

結果：

- CTOが強引に判断。
- チーム内信頼低下。

### Normal: 全面延期

条件：

- QAの全面停止に乗る。
- 顧客スコープ分解に失敗。

結果：

- 事故は防げる。
- 顧客説明が重くなる。
- PM/営業からの信頼低下。

### Good: 分割リリース

条件：

- 顧客メール使用。
- ロールバック手順使用。
- Feature Flag設計使用。
- migrationリスクを整理。

結果：

- 請求書出力のみ段階リリース。
- checkout_v2とmigrationは延期。
- 顧客約束と安全性の両立。

### Great: 分割リリース + ルール化

条件：

- Good条件。
- Heatを抑える。
- Tech Leadの面子を潰さない。
- 営業を味方化。
- QAの不安を扱う。
- 議事録修正成功。
- Go/No-Go基準を提案。

結果：

- 次回以降、ロールバック不能変更は事前明示。
- 同一条件で3回以上落ちるCIはflaky扱いしない。
- PMが次章で少し成長する。
