# Final Consistency Audit

Status: Accepted v1  
Date: 2026-07-05

## Purpose

Pira/Jira再決定後に、P0正本、デザインREADME、HTMLカンプ、旧handoff、system design docsの矛盾が実装を止める状態で残っていないかを確認する。

## Verdict

次工程へ進んでよい。

実装を止める未決仕様は残っていない。残っているものは、次工程で実装しながら作るUI/copy作業であり、プロダクト判断の未決ではない。

## Implementation Source Of Truth

実装時は次を正とする。

1. Base: `docs/product/p0-spec.md`
2. Explicit overrides:
   - `12_pira_jira_reconciliation.md`
   - `13_final_consistency_audit.md`
3. Implementation specs:
   - `06_scenario_data_schema.md`
   - `07_round_rule_table_spec.md`
   - `09_scenario_content_matrix.md`
   - `10_scenario_seed_data_spec.md`
   - `11_meeting_interaction_content.md`

P0正本やデザインREADMEに残る「8枚」「証拠資料8種」は、Pira/Jira追加後の実装では上書きする。

## Confirmed Decisions

| Area | Decision | Implementation Impact |
|---|---|---|
| Pira/Jira BUG-418 | カンプ優先で証拠カード化する | `jira_bug_418_repro` を追加 |
| Evidence count | 8枚ではなく9枚 | integrity checkは9枚で見る |
| CPU Spike Log | 罠カードとして残す | メインカンプ未描画なのでMetrics/CPU画面を追加 |
| Slack/Pilack | 導入資料のみ | 証拠カード化しない |
| PR/Pira/Staging acquisition copy | カンプ文言ではなくfact-only seedを使う | 用途ヒントを出さない |
| Round 1 screen | 専用カンプなし | SCREEN 03のMeeting基準形をPM用データで流用 |
| Round timer | 初期実装では強制タイムアウトなし | タイマー風UIだけ表示。実時間処理はP1候補 |
| Meeting log | 読み取り専用の事実ログ | 議事録修正フェーズは作らない |
| Old handoff mechanics | P0外 | ピン留め、Premise Lock、Heat/Clarity/Support表示、議事録修正は除外 |

## Remaining Non-Blocking Work

| Work | Why Not Blocking | Where To Implement |
|---|---|---|
| CPU/Metrics document UI | 本文、取得行、copy、ルールは定義済み | Exploration document component |
| fallback/partial meeting log copy | ルールと主要ログ方針は定義済み | rule resolution copy table |
| Result dynamic copy | 4エンドと表示項目は定義済み | Result summary builder |
| Pixel-level polish | P0は通しプレイ検証が先 | CSS Modules / global tokens |

## Cross-Source Conflicts Checked

### Evidence Count

Conflict:

- P0正本: 最大取得可能カード8枚
- デザインカンプ: Piraにクリック可能表現あり
- CPU: P0正本では罠カードだがメインカンプ未描画

Resolution:

- Pira/Jiraを追加し、CPUも残す。
- 実装上の証拠カードは9枚。

### Acquisition Copy

Conflict:

- カンプの一部取得文言は、用途ヒントやプレイヤーの気づきに近い。
- P0正本は、取得時に用途ヒントを出さない。

Resolution:

- `09` / `10` のfact-only copyを使う。
- カンプ文言はUIトーン参考に留める。

### Timer

Conflict:

- デザインREADMEは時間切れでRound機会が流れる挙動を示す。
- 初期設計では読み体験を優先し、強制タイムアウトなし。

Resolution:

- P0初期実装はタイマー表示のみ。
- 実時間タイマー有効化はプレイテスト後のLater Decision。

### Meeting Log vs Minute Revision

Conflict:

- 旧handoffには議事録修正フェーズ、ピン留め、Premise Lockが残る。
- P0正本では外す。

Resolution:

- P0は読み取り専用の会議ログのみ。
- 旧handoffは文体素材としてだけ使う。

## Next Phase Gate

次工程に入る条件:

- 9 evidenceのseed dataを実装する
- `pira_bug_418` に `jira_bug_418_repro` のクリック行を付ける
- `cpu_spike_log` のMetrics/CPU画面を追加する
- scenario integrity validatorで9枚、9クリック行、Pilack非証拠化、TargetPhraseの `statementLineId` 参照整合を検証する

この条件は実装工程の最初に満たせるため、設計工程はここで次へ進めてよい。
