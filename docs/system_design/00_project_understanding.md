# Project Understanding

Status: Draft v0  
Date: 2026-07-05

## Purpose

このドキュメントは、Bias Meeting Game P0 のシステム設計を始める前に、リポジトリ内の仕様・デザイン・企画資料から読み取れる前提を固定する。

ここでは実装方式の最終決定はしない。次の設計Specで議論するための共通理解を作る。

## Repository State

現時点のリポジトリには、アプリケーション実装コードはない。

主な構成:

- `docs/product/`
  - P0実装契約。
- `docs/design/design_handoff_bias_meeting_game/`
  - 高忠実デザインカンプ、デザインREADME、P0仕様のコピー。
- `bias_meeting_game_handoff/`
  - 広めの企画handoff、データモデル案、旧MVP案、実装メモ、バックログ。

`docs/product/p0-spec.md` と `docs/design/design_handoff_bias_meeting_game/p0-spec.md` は同一内容だった。したがって、実装設計では `docs/product/p0-spec.md` を正本として扱う。

## Product Summary

P0は、ソフトウェア開発組織を舞台にした「資料探索 + 会議バトル」ゲームである。

プレイヤーはシニアエンジニアとして、明日リリース予定の `checkout_v2`、請求書出力、`customer_data_migration` をめぐるGo/No-Go会議に参加する。探索資料から違和感を見つけ、会議で発言・証拠・出し方を選び、最終判断を全面リリース/全面延期ではなく分割リリースへ寄せる。

P0は教育クイズではない。バイアス名を当てる遊びでも、相手を論破する遊びでもない。現場資料と会議発言のズレを読み、人間関係を壊しすぎずに判断を変えるゲームである。

## P0 Scope

P0で作るもの:

- Prologue / Slack導入
- Exploration / 資料探索
- Meeting / 会議バトル
- Result / リザルト
- Slack以外の9資料閲覧
- 行クリックによる証拠カード取得
- 証拠カード2枚以上で会議開始
- 5ラウンド固定の会議
- R1-R4の3段選択
  - 発言箇所
  - 証拠カード
  - 出し方
- R4のみ複数証拠コンボ
- R5の最終判断
- Bad / Normal / Good / Great 分岐
- 会議ログとリザルト要約

P0で作らないもの:

- ピン留めシステム
- 議事録修正フェーズ
- プレイ中のPremise Lockゲージ表示
- プレイ中のバイアス名表示
- 数値スコア表示
- 全ラウンド共通コマンド表
- R4以外の複数証拠コンボ
- クリア後フローチャート
- キャラ育成
- セーブ/ロード
- 複数ステージ
- 立ち絵、サウンド、過度なUIポリッシュ

## Gameplay Contract

### Exploration

探索資料は最初から全て読める。

資料:

- Slack導入
- Jira BUG-418
- PR Comment
- CI Log
- Staging Log
- Customer Email
- Rollback Procedure
- Feature Flag Design
- Past Incident Report
- CPU Spike Log

Slackは導入資料であり、証拠カード化しない。
Pira/Jira BUG-418は、デザインカンプ優先の決定により証拠カード化する。

証拠カード取得ルール:

- 1資料1カード
- 行単位クリック
- 常時ハイライトなし
- ホバー時だけクリック可能に見える
- 重要行と罠行は見た目で区別しない
- クリック後、その行は取得済み表示になる
- 取得時は短い事実説明だけ表示する
- 用途ヒントは表示しない

会議開始条件:

- Slackを除く証拠カード2枚以上
- 罠カードも枚数に含める
- 会議開始後は探索に戻れない

### Meeting

会議は5ラウンド固定。

| Round | Speaker | Role |
|---|---|---|
| 1 | 佐伯 | PM |
| 2 | 黒瀬 | Tech Lead |
| 3 | 桐谷 | Sales |
| 4 | 三村 | QA |
| 5 | 榊 | CTO |

R1-R4は、各ラウンド1アクションだけ実行できる。

1アクションは次の3段選択:

```text
1. 発言箇所
2. 証拠カード
3. 出し方
```

R5は3段選択ではなく、最終判断選択である。

### Result

数値スコアは表示しない。

表示するもの:

- Ending
- 最終判断
- 会議ログ
- 確認できた事実
- 確認できなかった事実
- 味方化/敵対の結果
- Great時に制度化されたルール
- 自然言語の振り返り
- 関連バイアス名

## Core Data Model Candidates

実装設計上、少なくとも次のモデルが必要になる。

| Model | Role |
|---|---|
| Stage | P0ステージ全体 |
| Character | 参加者、役職、表示名、アバター設定 |
| Document | 探索資料 |
| EvidenceCard | 取得可能な証拠 |
| EvidenceSourceLine | 証拠化できる資料行 |
| MeetingRound | R1-R5の進行単位 |
| ClaimTarget | 狙える発言箇所 |
| DeliveryOption | 出し方 |
| PlayerAction | プレイヤーが確定した選択 |
| ActionResolution | 選択結果、フラグ更新、ログ追加 |
| GameState | 現在フェーズ、取得証拠、内部フラグ、会議ログ |
| FinalDecision | R5で選べる最終判断 |
| Ending | Bad / Normal / Good / Great |
| ResultSummary | リザルト表示用の要約 |

P0では汎用スコアエンジンより、ラウンド別の明示的な判定テーブルを優先する方がよい。理由は、P0正本が「どのラウンドで何を解決するか」をかなり具体的に固定しているため。

## Core State

主要フラグ:

```text
flaky_resolved
customer_scope_resolved
rollback_risk_resolved
feature_flag_resolved
sales_ally
qa_ally
techlead_enemy
sales_enemy
qa_enemy
meeting_breakdown_risk
governance_rule_selected
```

補助評価フラグ例:

```text
qa_concern_understood
pm_cost_pressure_understood
sales_pressure_understood
```

取得証拠:

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

## Ending Rules

分割リリース選択肢の解放条件:

```text
customer_scope_resolved
&& (rollback_risk_resolved || feature_flag_resolved)
&& (sales_ally || qa_ally)
&& techlead_enemy != true
&& sales_enemy != true
&& qa_enemy != true
```

Great選択肢の解放条件:

```text
Good条件
&& sales_ally
&& qa_ally
&& techlead_enemy != true
&& flaky_resolved
&& rollback_risk_resolved
&& feature_flag_resolved
&& meeting_breakdown_risk < 3
```

最終判断:

- 全面リリースは常にBad
- 全面延期は基本Normal
- 分割リリースは常にGood以上
- 分割リリース + Go/No-Go基準明文化はGreat

## UI Understanding

デザインカンプは `docs/design/design_handoff_bias_meeting_game/Bias Meeting Game カンプ.dc.html` にある。

これは本番コードではなく、画面状態とビジュアル仕様の参照である。実装では次のように分解する必要がある。

- AppShell
- PrologueScreen
- ExplorationDesktop
- DocumentWindow
- Dock
- EvidenceTray
- EvidenceAcquiredModal
- MeetingScreen
- ParticipantBar
- MeetingLog
- TargetPhraseSelector
- EvidenceSelector
- DeliverySelector
- FinalDecisionModal
- ResultScreen
- ResultFactList
- RelationshipSummary

デザインは1360x860固定キャンバス基準。P0実装では、まずこの密度を保ったデスクトップ優先UIにするのが自然である。

## Architecture Implications

現時点では実装コードがないため、技術選定から必要になる。

P0の性質から見ると、推奨はクライアントサイド中心のWebアプリである。

理由:

- 状態遷移がローカルで完結する
- サーバー永続化がP0外
- デザインカンプがWeb UIとして作られている
- Playtest配布がしやすい
- ルールエンジンを純粋関数としてテストしやすい

初期設計では、次の分離を置くとよい。

```text
Scenario Data
  ↓
Rules / Reducer
  ↓
Game State
  ↓
UI Components
```

重要なのは、UIコンポーネント内に判定条件を散らさないこと。分岐条件、フラグ更新、会議ログ生成は、UIから独立したルール層に寄せる。

## Design Risks

設計時に注意すべきリスク:

- カンプHTMLをそのまま移植して、状態管理不能なUIになる
- 汎用ゲームエンジン化しすぎて、P0が重くなる
- スコア制に戻ってしまい、P0正本の「数値を見せない」方針を壊す
- バイアス名の説明が前面に出て、教育教材っぽくなる
- 証拠カードの用途ヒントを出しすぎて、探索の快感を潰す
- 会議ログに成功/失敗の判定文を書いてしまう
- 旧handoffのP1要素をP0に戻してしまう

## Next Step

次は `01_grilling_questions.md` の質問リストから、システム設計に必要な決定を数ターンで潰す。

最初に決めるべきなのは、技術スタック、シナリオデータ形式、状態管理方式、UI fidelityの優先度、タイマーの扱いである。
