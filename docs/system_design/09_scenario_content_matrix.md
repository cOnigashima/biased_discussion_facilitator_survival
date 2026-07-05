# Scenario Content Matrix

Status: Draft v0  
Date: 2026-07-05

## Purpose

このドキュメントは、P0実装で使うシナリオ素材を、実装データへ落とせる粒度で一覧化する。

対象:

- 探索資料
- 証拠カード
- クリック対象行
- 取得時copy
- 会議での主な用途
- 実装前に補完が必要な箇所

## Important Finding

探索資料と証拠カード数に不整合がある。

P0正本の探索資料リスト:

```text
Slack導入
Jira BUG-418
PR Comment
CI Log
Staging Log
Customer Email
Rollback Procedure
Feature Flag Design
Past Incident Report
CPU Spike Log
```

一方、P0正本の証拠カードは8枚。

```text
ci_legacy_failure
customer_email_scope
rollback_procedure
feature_flag_design
staging_500_log
pr_tax_category_comment
past_incident_report
cpu_spike_log
```

この8枚に `jira_bug_418` は含まれていない。

Final resolution:

- Slack/Pilack: Prologue専用。証拠カード化しない。
- Pira/Jira: カンプ優先で証拠カード化する。Evidence IDは `jira_bug_418_repro`。
- CPU Spike Log: P0正本では罠カードなので、実装では追加する。
- 証拠カード総数は9枚に更新する。

詳細は `12_pira_jira_reconciliation.md` を参照する。

## Document Matrix

| Document ID | UI/App | Source Status | Evidence ID | Card? | Kind | Primary Use | Implementation Status |
|---|---|---:|---|---:|---|---|---|
| `pilack_release_check` | Pilack | Comp present | none | No | prologue | 状況と人物スタンス提示 | Ready |
| `pira_bug_418` | Pira | Comp present with clickable line | `jira_bug_418_repro` | Yes | primary | R2でQA再現済み条件を示す。攻撃的に出すと敵化 | Ready |
| `pr_tax_category_comment` | PR | Comp present | `pr_tax_category_comment` | Yes | support | R2で事前懸念を示す。攻撃的に出すと敵化 | Ready |
| `ci_checkout_v2_failure` | CI | Comp present | `ci_legacy_failure` | Yes | primary | R2でflaky前提を崩す | Ready |
| `staging_500_log` | Staging | Comp present | `staging_500_log` | Yes | primary | R2で実環境に近い再現を示す | Ready |
| `customer_email_scope` | Mail | Comp present | `customer_email_scope` | Yes | primary | R3で顧客要求範囲を分解する | Ready |
| `rollback_procedure` | Rollbk | Comp present | `rollback_procedure` | Yes | primary | R4でmigration不可逆性を示す | Ready |
| `feature_flag_design` | FFlag | Comp present | `feature_flag_design` | Yes | primary | R4で分割リリース可能性を示す | Ready |
| `past_incident_report` | 過去 | Comp present | `past_incident_report` | Yes | support | R4でQA懸念への共感補助 | Ready |
| `cpu_spike_log` | Metrics/CPU | Main comp missing | `cpu_spike_log` | Yes | trap | R2で誤用すると反撃される | Must add |

## Evidence Matrix

| Evidence ID | Title | Kind | Source Document | Clickable Line / Fact | Acquisition Copy | Meeting Use |
|---|---|---|---|---|---|---|
| `jira_bug_418_repro` | Jira BUG-418 | primary | Pira / Jira BUG-418 | `tax_category=null` の場合にmigration後のcheckoutで500。QAがstagingで3回再現 | `BUG-418で、tax_category=nullの場合にmigration後のcheckoutが500になるとQAが報告している。` | R2: flaky前提を崩す。攻撃的に出すとTech Lead敵化 |
| `ci_legacy_failure` | CI失敗ログ | primary | CI Log | `legacy_plan=true` かつ `tax_category=null` のケースで `CheckoutV2MigrationSpec` が失敗 | `legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。` | R2: flaky前提を崩す |
| `staging_500_log` | staging障害ログ | primary | Staging Log | stagingで同条件のcheckoutが500を返している | `stagingで legacy_plan=true / tax_category=null のcheckoutが500を返している。` | R2: CIより強い実環境証拠 |
| `customer_email_scope` | 顧客メール | primary | Customer Email | 今月中に必要なのは請求書出力。新決済フロー全体は来月初旬でよい | `顧客が今月中に必要としているのは請求書出力で、新決済フロー全体ではない。` | R3: 顧客要求の範囲を切る |
| `rollback_procedure` | ロールバック手順 | primary | Rollback Procedure | `customer_data_migration` は本番write後の完全ロールバック不可 | `customer_data_migrationは本番write後に完全ロールバックできない。` | R4: 危険部分を特定する |
| `feature_flag_design` | Feature Flag設計 | primary | Feature Flag Design | checkout UI と invoice export は個別制御可能。migrationはrollback不可 | `checkout UI と invoice export は個別に制御できる。customer_data_migrationは自動rollbackできない。` | R4: 分割リリース可能性 |
| `pr_tax_category_comment` | PRコメント | support | PR Comment | `legacy customer の tax_category が null の場合、migration 後に参照エラーになりませんか？` | `PRでlegacy customerのtax_category=nullに対する参照エラー懸念が事前に指摘されていた。` | R2: 強いが高リスク。出し方次第でTech Lead敵化 |
| `past_incident_report` | 過去障害報告 | support | Past Incident Report | staging警告をflaky扱いして本番障害。ただし原因は今回と同一ではない | `過去にstaging警告をflaky扱いし、本番で請求処理失敗が起きた。ただし原因は今回と同一ではない。` | R4: QA共感補助。単独では解決しない |
| `cpu_spike_log` | CPUスパイクログ | trap | CPU Spike Log | staging CPU spike。原因は別チームの負荷テスト | `stagingでCPUスパイクがあったが、原因は別チームの負荷テストだった。` | R2: 誤用で反撃。前提解決なし |

## Acquisition Copy Rules

取得時copyは、用途ヒントを含めない。

Good:

```text
stagingで legacy_plan=true / tax_category=null のcheckoutが500を返している。
```

Avoid:

```text
これはflaky主張を崩せる証拠だ。
```

カンプ内の一部取得文言は、プレイヤーの気づきとしては良いが、P0正本の「用途ヒントを表示しない」ルールにはやや強い。実装では上のEvidence Matrixのfact-only copyを採用する。

## Document Detail Matrix

### Pilack / Prologue

Source:

- Main comp: `SCREEN 01`
- Design README: Prologue / Pilack
- Stage spec: Slack `#release-check`

Role:

- 状況導入
- PM/Tech Lead/Sales/QAの初期スタンス提示
- 証拠カード化しない

Key content:

```text
CI bot: Build #1841 FAILED
佐伯: 基本Go。前回も似た警告はあった。
黒瀬: 落ちているテストは以前から不安定。
三村: 今回の失敗は前回と違う。legacy_plan=trueで同じ落ち方。
桐谷: 顧客には今月中と伝えている。
```

Implementation:

- `isPrologueOnly=true`
- `evidenceId` なし

### Pira / BUG-418

Source:

- Main comp: `APP · Pira`
- Stage spec: Jira `BUG-418`

Role:

- 証拠カード対象。
- QAがstagingで3回再現したこと
- 黒瀬がcleanupで後対応/P2扱いにしていること

Key content:

```text
BUG-418: legacy_plan=true の顧客で checkout_v2 が失敗する
Priority: P2
QA comment: stagingで3回再現。tax_category=nullの場合にmigration後のcheckoutで500。
Tech Lead comment: 既存データの揺れ。リリース後のcleanupで対応可能。
```

Implementation:

- `evidenceId='jira_bug_418_repro'`
- clickable lineは `tax_category が null の場合に migration 後の checkout で 500`
- 取得copyは用途ヒントを入れず、QA報告の事実だけにする

Meeting use:

- R2で `flakyResolved=true` を立てられる。
- `face_saving` / `condition_check` なら敵化しない。
- `direct_objection` でTech Leadの判断ミスとして突くと `techleadEnemy=true` と `meetingBreakdownRisk +1`。

### PR / PR Comment

Source:

- Main comp: `APP · PR`
- Stage spec: PR Comment

Evidence:

- `pr_tax_category_comment`

Clickable line:

```text
legacy customer の tax_category が null の場合、migration 後に参照エラーになりませんか？
```

Response context:

```text
通常フローでは tax_category は必須なので問題ない想定です。
古い顧客データは別途 cleanup で対応予定。
Author が Resolved にした。
```

Acquisition copy:

```text
PRでlegacy customerのtax_category=nullに対する参照エラー懸念が事前に指摘されていた。
```

Meeting use:

- R2で使えるが高リスク
- `設計ミスですよね` 系の出し方なら `techleadEnemy=true`
- `legacy条件だけ確認したい` 系の出し方なら敵化しない

### CI / CI Log

Source:

- Main comp: `APP · CI`
- Stage spec: CI Log

Evidence:

- `ci_legacy_failure`

Clickable line:

```text
legacy_plan=true
tax_category=null
CheckoutV2MigrationSpec failed
NoMethodError: undefined method `rate' for nil:NilClass
```

Acquisition copy:

```text
legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。
```

Meeting use:

- R2でflaky前提を崩す
- R1では前回との差分確認の補助に使えるが、Good/Great必須ではない

### Staging / Staging Log

Source:

- Main comp: `APP · Staging`
- Design README

Evidence:

- `staging_500_log`

Clickable line:

```text
500が11件反復
全部 legacy_plan=true / tax_category=null
```

Acquisition copy:

```text
stagingで legacy_plan=true / tax_category=null のcheckoutが500を返している。
```

Meeting use:

- R2でCIより強い実環境証拠
- `flakyResolved=true`

### Mail / Customer Email

Source:

- Main comp: `APP · Mail`
- Stage spec: Customer Email

Evidence:

- `customer_email_scope`

Clickable line:

```text
今月中に必要なのは、請求書出力の新フォーマット対応です。
新しい決済フローについては、来月初旬の展開でも問題ありません。
```

Acquisition copy:

```text
顧客が今月中に必要としているのは請求書出力で、新決済フロー全体ではない。
```

Meeting use:

- R3
- `customerScopeResolved=true`
- 良い出し方なら `salesAlly=true`

### Rollbk / Rollback Procedure

Source:

- Main comp: `APP · Rollbk`
- Stage spec: Rollback Procedure

Evidence:

- `rollback_procedure`

Clickable line:

```text
customer_data_migration:
本番write後の完全ロールバック不可。
手動修正が必要。
```

Acquisition copy:

```text
customer_data_migrationは本番write後に完全ロールバックできない。
```

Meeting use:

- R4
- `rollbackRiskResolved=true`
- `feature_flag_design` と組み合わせると `qaAlly=true`

### FFlag / Feature Flag Design

Source:

- Main comp: `APP · FFlag`
- Stage spec: Feature Flag Design

Evidence:

- `feature_flag_design`

Clickable line:

```text
checkout UI と invoice export は個別制御可能。
customer_data_migration は一度writeすると完全な自動rollbackは不可。
```

Acquisition copy:

```text
checkout UI と invoice export は個別に制御できる。customer_data_migrationは自動rollbackできない。
```

Meeting use:

- R4
- `featureFlagResolved=true`
- `rollback_procedure` と組み合わせるとGreat条件に近づく

### Past Incident / 過去障害報告

Source:

- Main comp: `APP · 過去`
- Stage spec: Past Incident Report

Evidence:

- `past_incident_report`

Clickable line:

```text
3か月前、stagingで出ていた軽微な警告をflakyとして扱い、
本番で一部顧客の請求処理が失敗した。
ただし、当時の原因はタイムゾーン変換であり、今回の tax_category とは直接同一ではない。
```

Acquisition copy:

```text
過去にstaging警告をflaky扱いし、本番で請求処理失敗が起きた。ただし原因は今回と同一ではない。
```

Meeting use:

- R4でQA共感補助
- `qaConcernUnderstood=true`
- 単独では `qaAlly=false`
- 単独では `rollbackRiskResolved=false`

### CPU / CPU Spike Log

Source:

- Stage spec: Red Herring
- Wireframe only
- Main comp missing

Evidence:

- `cpu_spike_log`

Document content:

```text
staging環境で一時的なCPUスパイクあり。
原因は別チームの負荷テスト。
今回の checkout_v2 migration とは直接関係が薄い。
```

Acquisition copy:

```text
stagingでCPUスパイクがあったが、原因は別チームの負荷テストだった。
```

Meeting use:

- R2で使うとTech Leadに反撃される
- `meetingBreakdownRisk +1`
- resolvedは立たない

Implementation:

- Add a Metrics/CPU document window.
- Dock label candidate: `CPU`
- App label candidate: `Metrics`
- Visual tone: neutral/slate, so trapと分からない見た目にする。

## Meeting Content Matrix

### Round 1: PM 佐伯

NPC statement:

```text
ここまで来て止めるのは現実的じゃないです。
前回も似た警告は出ましたけど、結局問題ありませんでしたよね。
```

Target phrases:

- `ここまで来て`
- `止めるのは現実的じゃない`
- `前回も似た警告`
- `問題ありませんでした`

P0 handling:

- Good/Great必須ではない
- R1専用画面はカンプにないため、SCREEN 03のMeeting基準形をPM用データで再利用する
- 旧handoffのピン留め選択肢はP0外なので除外する

### Round 2: Tech Lead 黒瀬

NPC statement:

```text
このテストは前から不安定です。
実装の問題というより、テスト側の問題だと思います。
```

Target phrases:

- `前から不安定`
- `実装の問題というより`
- `テスト側の問題`

Main evidence:

- `jira_bug_418_repro`
- `ci_legacy_failure`
- `staging_500_log`
- `pr_tax_category_comment`
- `cpu_spike_log` as trap

Flags:

- `flakyResolved`
- `techleadEnemy`
- `meetingBreakdownRisk`

### Round 3: Sales 桐谷

NPC statement:

```text
顧客には今月中に出すと伝えています。
ここで延期したら信用を失います。
```

Target phrases:

- `今月中に出す`
- `信用を失います`

Main evidence:

- `customer_email_scope`

Flags:

- `customerScopeResolved`
- `salesAlly`
- `salesEnemy`
- `salesPressureUnderstood`

### Round 4: QA 三村

NPC statement:

```text
それでも危険です。全部止めるべきです。
前回もこういう軽視から障害になりました。
```

Target phrases:

- `危険`
- `全部止めるべき`
- `前回もこういう軽視`

Main evidence:

- `rollback_procedure`
- `feature_flag_design`
- `past_incident_report`

Combo:

```text
rollback_procedure + feature_flag_design
```

Flags:

- `rollbackRiskResolved`
- `featureFlagResolved`
- `qaAlly`
- `qaEnemy`
- `qaConcernUnderstood`

### Round 5: CTO 榊

NPC statement:

```text
では、結論としてどうしたいんですか？
```

Final decisions:

- `full_release`
- `full_delay`
- `split_release`
- `split_release_with_governance`

Display rule:

- `full_release` and `full_delay` are always visible
- `split_release` appears only when unlocked
- `split_release_with_governance` appears only when Great conditions are met
- Locked decisions are not shown

## Implementation Readiness Checklist

- [x] Evidence IDs fixed
- [x] Major document content exists
- [x] Design comp has most screens
- [x] Result variants exist
- [x] Decide Pira/Jira evidence-card handling
- [ ] Add CPU/Metrics document UI
- [x] Add CPU/Metrics document content
- [x] Add PR acquisition copy
- [x] Replace hint-heavy acquisition copy with fact-only copy
- [x] Define P0 interaction content excluding old handoff choices
- [x] Write final R1-R4 delivery option labels
- [ ] Write meeting log copy for fallback/partial outcomes
