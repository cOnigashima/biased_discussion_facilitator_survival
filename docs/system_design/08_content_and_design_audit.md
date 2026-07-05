# Content and Design Audit

Status: Draft v0  
Date: 2026-07-05

## Purpose

この監査は、P0実装に必要なシナリオ素材とデザイン素材が本当に揃っているかを確認する。

結論:

- デザインカンプは主要画面・主要状態をかなり持っている。
- シナリオ素材も広く揃っている。
- シナリオデータ化に必要な主要ID、証拠、取得行、取得copyは `09_scenario_content_matrix.md` と `10_scenario_seed_data_spec.md` に整理済み。
- 残る注意点は、CPUスパイクログの画面UI、Round 1会議画面の流用、会議ログ/リザルト差分copyの補完。

## Design Source Audit

対象:

```text
docs/design/design_handoff_bias_meeting_game/Bias Meeting Game カンプ.dc.html
```

HTMLから確認できる画面ラベル:

| Label | Status | Notes |
|---|---|---|
| SCREEN 01 | Present | Prologue / Pilack |
| SCREEN 02 | Present | Exploration / 資料探索 |
| SCREEN 03 | Present | Meeting / Round 2基準形 |
| SCREEN 04 | Present | Result / Great例 |
| APP · CI | Present | CI資料アプリ |
| APP · Pira | Present | Jira相当 |
| APP · PR | Present | PRレビュー |
| APP · Staging | Present | staging障害ログ |
| APP · Mail | Present | 顧客メール |
| APP · Rollbk | Present | ロールバック手順 |
| APP · FFlag | Present | Feature Flag |
| APP · 過去 | Present | 過去障害報告 |
| SCREEN 03 · R3 | Present | Sales round |
| SCREEN 03 · R4 | Present | QA round / 2枚コンボ |
| SCREEN 03 · R5 | Present | CTO final decision |
| SCREEN 04 · BAD | Present | Bad result |
| SCREEN 04 · NORMAL | Present | Normal result |
| SCREEN 04 · GOOD | Present | Good result |

不足または注意:

| Item | Status | Action |
|---|---|---|
| CPU Spike Log app | Missing from main comp | P0正本では必要。ワイヤーフレームにだけ存在。実装側で追加する |
| Meeting Round 1 dedicated screen | Missing as separate comp | Round 2基準形を使い回し、PMラウンドデータで構成する |
| Result Great dedicated variant | Present as SCREEN 04 | SCREEN 04がGreat例。BAD/NORMAL/GOODも別途あり |
| Exploration acquired modal variants | Partial | CI取得ポップアップと各APP下部の取得文言がある。共通modalとして実装する |

## Evidence Acquisition Copy Audit

カンプHTML上で `取得:` として明示されているもの:

| Evidence | Present in Comp | Notes |
|---|---:|---|
| CI失敗ログ | Yes | SCREEN 02 / APP CI |
| staging障害ログ | Yes | APP Staging |
| 顧客メール | Yes | APP Mail |
| ロールバック手順 | Yes | APP Rollbk |
| Feature Flag設計 | Yes | APP FFlag |
| 過去障害報告（補助） | Yes | APP 過去 |
| PRコメント | No explicit `取得:` line found | 実装用copyは `09` / `10` で補完済み |
| Jira BUG-418 | No explicit `取得:` line found | カンプ優先で証拠化。実装用copyは `09` / `10` で補完済み |
| CPUスパイクログ | No | 本文と取得copyは `09` / `10` で補完済み。画面UIは実装時に追加 |

Pira/Jira BUG-418をカンプ優先で証拠化するため、実装上の最大取得可能カードは9枚とする。取得文言はシード仕様側を正とする。

## Scenario Source Audit

主なシナリオ素材:

| Source | Use |
|---|---|
| `docs/product/p0-spec.md` | P0契約。最優先 |
| `docs/design/design_handoff_bias_meeting_game/README.md` | デザイン・画面・UI状態の解説 |
| `bias_meeting_game_handoff/09_stage1_go_no_go_spec.md` | 資料本文、ステージ概要、旧Ending条件 |
| `bias_meeting_game_handoff/10_stage1_dialogue_and_choices.md` | 会議発言、選択肢、反応文 |
| `bias_meeting_game_handoff/11_data_model.yaml` | 旧データモデル案 |
| `bias_meeting_game_handoff/12_flowchart_nodes.yaml` | 旧フローチャート/分岐案 |

## Scenario Completeness

| Area | Status | Notes |
|---|---|---|
| Stage premise | Ready | P0正本で固定済み |
| Characters | Ready enough | 名前/役職/スタンス/アバターは揃っている |
| Exploration documents | Mostly ready | CPU画面UIだけ実装時に追加。本文/copyは補完済み |
| Evidence cards | Ready by ID | 9枚。Pira/Jira BUG-418をカンプ優先で追加済み |
| Meeting rounds | Mostly ready | R1-R5の発言と良手/悪手はある |
| Round choices | Ready enough | `11_meeting_interaction_content.md` でP0用に再整理済み |
| Rule effects | Ready enough | `07_round_rule_table_spec.md` で主要判定を固定済み |
| Meeting logs | Partial | 例文はあるが全パス分は未完成 |
| Result copy | Mostly ready | カンプに4エンド分あり。動的差分copyは補完が必要 |

## P0 vs Old Handoff Conflicts

旧handoffには、P0正本で外された要素が残っている。

実装時に除外するもの:

- ピン留め
- ピン留め済み発言とのコンボ
- 議事録修正フェーズ
- Premise Lock表示
- Heat / Clarity / Support の数値表示
- Minute Revision screen
- フローチャート

扱い:

- 旧handoffは素材集として使う
- 仕様判断は `docs/product/p0-spec.md` を優先する
- 旧handoffのChoice文は、P0の3段選択用に再編集して使う

## Design Visibility Answer

「デザインが見えているか」への正確な回答:

- HTML構造としては見えている。
- 画面ラベル、画面順、アプリ画面、取得文言、会議ラウンド、リザルト状態は抽出できている。
- Chrome headlessでSCREEN 01の実レンダリングも一度確認できた。
- ただし以後はChromeを使わず、HTMLから直接起こす方針にする。

実装設計上は、実レンダリング確認よりもHTML構造抽出の方が有効である。カンプは静的HTMLであり、必要なのは「状態一覧」と「UI要素/文言/トークン」の抽出だから。

## Remaining Content Work Before Implementation

実装前に残っていること:

1. CPUスパイクログの画面UIを実装側で追加する。
2. R1画面はSCREEN 03基準形をPM用データで流用する。
3. fallback/partial outcomeを含む会議ログcopyを実装しながら補完する。
4. Resultの動的差分copyを実装しながら補完する。

## Recommended Next Document

作成済み:

```text
09_scenario_content_matrix.md
```

内容:

- Documentごとの本文
- Evidence ID
- clickable line
- acquisition copy
- trap/support/primary分類
- 使用可能Round
- P0実装で補完が必要なcopy
