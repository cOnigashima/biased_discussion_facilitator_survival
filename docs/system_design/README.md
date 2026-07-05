# System Design

このフォルダは、Bias Meeting Game P0 を実装するためのシステム設計ドキュメント置き場です。

## Source Priority

実装設計では、次の優先順位で資料を扱う。

1. `docs/product/p0-spec.md`
   - P0の正本仕様。
   - ゲーム進行、証拠カード、会議ラウンド、内部フラグ、分岐条件、受け入れ条件の契約。
2. `docs/design/design_handoff_bias_meeting_game/`
   - 高忠実デザインカンプとUI/ビジュアル仕様。
   - 実装時はHTMLをそのまま流用せず、画面状態とコンポーネントの参照として使う。
3. `bias_meeting_game_handoff/`
   - 企画背景、旧MVP案、将来構想、文体素材。
   - P0正本と矛盾する場合はP0正本を優先する。

例外:

- Pira/Jira BUG-418は、デザインカンプ上のクリック可能表現を優先し、P0証拠カードに含める。
- この決定により、Slack以外の証拠カード総数は9枚とする。

## Documents

- `00_project_understanding.md`
  - 現時点のプロジェクト把握、P0範囲、設計上の含意。
- `01_grilling_questions.md`
  - システム設計で決める質問リスト。各質問に推奨回答を付ける。
- `02_architecture_spec.md`
  - React Webアプリとしてのアーキテクチャ、レイヤ、ディレクトリ方針。
- `03_game_state_and_rules_spec.md`
  - GameState、イベント、ルール判定、エンド分岐の設計。
- `04_ui_screen_model.md`
  - 画面構成、コンポーネント分解、UI状態の扱い。
- `05_implementation_plan.md`
  - 実装順序、マイルストーン、検証計画。
- `06_scenario_data_schema.md`
  - P0ステージのTypeScriptシナリオデータ構造。
- `07_round_rule_table_spec.md`
  - 会議ラウンド別の実装向け判定テーブル。
- `08_content_and_design_audit.md`
  - デザインカンプとシナリオ素材の充足監査。
- `09_scenario_content_matrix.md`
  - 探索資料、証拠カード、取得copy、会議利用の実装用マトリクス。
- `10_scenario_seed_data_spec.md`
  - TypeScript化するためのstage/document/evidence/final decision seed data。
- `11_meeting_interaction_content.md`
  - P0用に整理した会議ラウンド別の発言箇所、証拠、出し方セット。
- `12_pira_jira_reconciliation.md`
  - Pira/Jira BUG-418を証拠カード化する決定と、P0仕様への差分。
- `13_final_consistency_audit.md`
  - Pira/Jira再決定後の最終整合監査と、次工程へ進むためのGo/No-Go。
- `review_prompt.md`
  - 別セッションで設計レビューを依頼するためのプロンプト。

## Current Direction

P0は、まず1ステージを最後まで遊べるWebプロトタイプとして設計する。

採用方針:

- App: React Web app
- Build: Vite
- Language: TypeScript
- State: `useReducer` + pure rules functions
- Data: 初期はTypeScript構造化データ
- UI: 1360x860デスクトップ優先
- Timer: 初期実装では強制タイムアウトなし
- Evidence cards: 9枚。Pira/Jira BUG-418を含め、CPU Spike Logも罠カードとして含める

中核は次の体験に絞る。

```text
資料から違和感を見つける
→ 会議発言に刺す
→ 全面Go / 全面Stop の二択を分割リリースへ軌道修正する
```
