# Scenario Seed Data Spec

Status: Draft v0  
Date: 2026-07-05

## Purpose

このSpecは、P0をTypeScriptシナリオデータへ落とすためのseed data正本候補である。

`09_scenario_content_matrix.md` と `12_pira_jira_reconciliation.md` の監査結果を受けて、以下を前提として扱う。

- Pira/Jira BUG-418は、カンプ優先で証拠カード化する。Evidence IDは `jira_bug_418_repro`。
- 証拠カード総数は9枚。
- CPUスパイクログはP0に必要な罠カード。メインカンプ未描画なので実装側で補う。
- PRコメントは証拠カード化する。取得copyはfact-onlyで補う。
- 取得copyは用途ヒントを含めない。

## Seed Data Boundary

このSpecに含めるもの:

- character seed
- document seed
- evidence seed
- final decision seed
- ending seed
- data integrity rules

このSpecに含めないもの:

- React component
- CSS実装
- reducer実装
- rule evaluator実装
- meeting action resolutionの詳細

会議選択肢と判定テーブルは `11_meeting_interaction_content.md` で扱う。

## Stage Seed

```ts
export const goNoGoPaymentV2Stage = {
  id: 'go_no_go_payment_v2',
  title: '決済v2 Go/No-Go会議',
  subtitle: 'Release Judgment: 決済移行前夜',
  playerRole: 'シニアエンジニア',
  situation:
    '明日、checkout_v2、請求書出力、customer_data_migrationをリリース予定。Jira、CI失敗、PRコメント、staging障害ログ、顧客メール、ロールバック手順にズレがある。',
  mainGoal:
    '全面リリースでも全面延期でもなく、必要機能だけを段階リリースする判断へ落とす。',
} as const;
```

## Character Seed

| ID | Name | Role | Stance | Avatar Label | Color |
|---|---|---|---|---|---|
| `pm_saeki` | 佐伯 | PM | Go寄り。納期と説明負担を守りたい | セキセイ | `#b7c78e` |
| `techlead_kurose` | 黒瀬 | Tech Lead | Go寄り。設計判断を守りたい | ハヤブサ | `#a9b6cc` |
| `sales_kiritani` | 桐谷 | Sales | 顧客約束を守りたい | オカメ | `#d8c298` |
| `qa_mimura` | 三村 | QA | 全面停止寄り。品質と顧客影響を守りたい | フクロウ | `#c0b2d4` |
| `cto_sakaki` | 榊 | CTO | 最終判断。速度と重大事故回避の両立 | イヌワシ | `#9aa8ba` |
| `player` | 自分 | Senior Engineer | 資料と発言のズレを整理する | 自分 | `#ec7a4f` |

Implementation note:

- P0では立ち絵なし。
- CSSの鳥プレースホルダーで実装する。
- bias一覧やhidden goalはResult文の素材にはできるが、プレイ中UIには出さない。

## Document Seed

| ID | Kind | App Label | Dock Label | Icon | Color | Evidence ID | Card? |
|---|---|---|---|---|---|---|---:|
| `pilack_release_check` | `pilack` | Pilack | Pilack | ◆ | `#6b4e9e` | none | No |
| `pira_bug_418` | `pira` | Pira | Pira | ▤ | `#2f68e0` | `jira_bug_418_repro` | Yes |
| `pr_tax_category_comment` | `pr` | PR | PR | ⑃ | `#7a5ad0` | `pr_tax_category_comment` | Yes |
| `ci_checkout_v2_failure` | `ci` | CI | CI | ❯_ | `#2ba88c` | `ci_legacy_failure` | Yes |
| `staging_500_log` | `staging` | Staging | Staging | ▲ | `#e8a13a` | `staging_500_log` | Yes |
| `customer_email_scope` | `mail` | Mail | Mail | ✉ | `#2f8fd0` | `customer_email_scope` | Yes |
| `rollback_procedure` | `runbook` | Rollback | Rollbk | ↩ | `#5a6576` | `rollback_procedure` | Yes |
| `feature_flag_design` | `feature_flag` | Feature Flags | FFlag | ⚑ | `#2ba88c` | `feature_flag_design` | Yes |
| `past_incident_report` | `incident` | 過去障害 | 過去 | ◷ | `#c85e34` | `past_incident_report` | Yes |
| `cpu_spike_log` | `metrics` | Metrics | CPU | ▧ | `#5a6576` | `cpu_spike_log` | Yes |

### Pira Decision Status

Pira/Jiraは証拠カード化する。

決定理由:

- カンプのPira画面に黄色リングと `cursor:pointer` の行がある。
- P0正本の資料リストには `Jira BUG-418` がある。
- P0正本には「1資料1カード」とある。

実装上の扱い:

- Evidence ID: `jira_bug_418_repro`
- Acquisition copy: `BUG-418で、tax_category=nullの場合にmigration後のcheckoutが500になるとQAが報告している。`
- R2で `flakyResolved=true` を立てられる。
- 攻撃的に出すと `techleadEnemy=true` と `meetingBreakdownRisk +1`。

## Evidence Seed

| ID | Title | Short Title | Kind | Source | Acquisition Copy |
|---|---|---|---|---|---|
| `jira_bug_418_repro` | Jira BUG-418 | BUG-418 | primary | `pira_bug_418` | `BUG-418で、tax_category=nullの場合にmigration後のcheckoutが500になるとQAが報告している。` |
| `ci_legacy_failure` | CI失敗ログ | CI失敗 | primary | `ci_checkout_v2_failure` | `legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。` |
| `staging_500_log` | staging障害ログ | staging 500 | primary | `staging_500_log` | `stagingで legacy_plan=true / tax_category=null のcheckoutが500を返している。` |
| `customer_email_scope` | 顧客メール | 顧客メール | primary | `customer_email_scope` | `顧客が今月中に必要としているのは請求書出力で、新決済フロー全体ではない。` |
| `rollback_procedure` | ロールバック手順 | Rollback | primary | `rollback_procedure` | `customer_data_migrationは本番write後に完全ロールバックできない。` |
| `feature_flag_design` | Feature Flag設計 | Feature Flag | primary | `feature_flag_design` | `checkout UI と invoice export は個別に制御できる。customer_data_migrationは自動rollbackできない。` |
| `pr_tax_category_comment` | PRコメント | PRコメント | support | `pr_tax_category_comment` | `PRでlegacy customerのtax_category=nullに対する参照エラー懸念が事前に指摘されていた。` |
| `past_incident_report` | 過去障害報告 | 過去障害 | support | `past_incident_report` | `過去にstaging警告をflaky扱いし、本番で請求処理失敗が起きた。ただし原因は今回と同一ではない。` |
| `cpu_spike_log` | CPUスパイクログ | CPUスパイク | trap | `cpu_spike_log` | `stagingでCPUスパイクがあったが、原因は別チームの負荷テストだった。` |

Implementation note:

- `kind` はUIで罠を見分けるために使わない。
- `kind` はResultや内部テスト、開発者向け検証にだけ使う。

## Clickable Line Seed

| Document ID | Line ID | Evidence ID | Text |
|---|---|---|---|
| `pira_bug_418` | `pira_tax_null_checkout_500` | `jira_bug_418_repro` | `tax_category が null の場合に migration 後の checkout で 500` |
| `ci_checkout_v2_failure` | `ci_case_legacy_tax_null` | `ci_legacy_failure` | `legacy_plan=true / tax_category=null / CheckoutV2MigrationSpec failed` |
| `staging_500_log` | `staging_repeated_500_legacy_tax_null` | `staging_500_log` | `500が11件反復。全部 legacy_plan=true / tax_category=null。` |
| `customer_email_scope` | `mail_invoice_only_this_month` | `customer_email_scope` | `今月中に必要なのは、請求書出力の新フォーマット対応です。新しい決済フローについては、来月初旬の展開でも問題ありません。` |
| `rollback_procedure` | `rollback_migration_irreversible` | `rollback_procedure` | `customer_data_migration: 本番write後の完全ロールバック不可。手動修正が必要。` |
| `feature_flag_design` | `fflag_independent_invoice_checkout` | `feature_flag_design` | `checkout UI と invoice export は個別制御可能。customer_data_migration は一度writeすると完全な自動rollbackは不可。` |
| `pr_tax_category_comment` | `pr_legacy_tax_null_review` | `pr_tax_category_comment` | `legacy customer の tax_category が null の場合、migration 後に参照エラーになりませんか？` |
| `past_incident_report` | `incident_flaky_staging_warning` | `past_incident_report` | `staging警告をflakyとして扱い、本番で一部顧客の請求処理が失敗した。ただし原因は今回と直接同一ではない。` |
| `cpu_spike_log` | `cpu_spike_load_test` | `cpu_spike_log` | `staging環境で一時的なCPUスパイクあり。原因は別チームの負荷テスト。` |

## Document Body Seeds

### `cpu_spike_log`

Main compにないため、実装時に以下をseedとして追加する。

```text
Metrics / staging

21:08 CPU usage reached 92% for 4 minutes.
21:09 load-test-worker from analytics-team started batch simulation.
21:13 CPU usage returned to normal.

Note:
The spike was caused by another team's load test.
No checkout_v2 migration error was observed in this metric.
```

日本語UI表示:

```text
staging環境で一時的なCPUスパイクあり。
原因は別チームの負荷テスト。
今回の checkout_v2 migration とは直接関係が薄い。
```

### `pira_bug_418`

カンプ優先で証拠化する。クリック対象はQA comment内の `tax_category が null の場合に migration 後のcheckoutで500`。

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

## Final Decision Seed

| ID | Title | Availability | Ending |
|---|---|---|---|
| `full_release` | 全面リリース | always | bad |
| `full_delay` | 全面延期 | always | normal |
| `split_release` | 分割リリース | split release unlocked | good |
| `split_release_with_governance` | 分割リリース + Go/No-Go基準の明文化 | great unlocked | great |

Display rule:

- locked choices are not rendered
- do not render disabled/gray locked decisions

## Ending Seed

| ID | Banner | Title | Final Decision |
|---|---|---|---|
| `bad` | danger | 強行リリース | 全面リリース |
| `normal` | warning | 全面延期 | 全面延期 |
| `good` | success | 分割リリース | invoice exportのみ段階リリース |
| `great` | great | 分割リリース + ルール化 | invoice exportのみ段階リリース + Go/No-Go基準明文化 |

Great rules:

```text
1. 同一条件で複数回落ちるCIはflaky扱いしない
2. ロールバック不能なwrite/migrationはGo/No-Go前に明示する
3. 顧客要求は「期限」だけでなく「必要機能の範囲」まで確認する
```

## Integrity Rules

実装時にバリデーションすること:

- Evidence枚数は9枚
- Card化されるDocument数は9件
- Pilackは証拠カード化しない
- Piraは `jira_bug_418_repro` の証拠化行を持つ
- CPUは証拠カード化する
- 各EvidenceのsourceDocumentIdが存在する
- 各clickable lineのevidenceIdが存在する
- 各Evidenceはちょうど1つのclickable lineを持つ
- R4以外は最大証拠選択数1
- R4だけ最大証拠選択数2
