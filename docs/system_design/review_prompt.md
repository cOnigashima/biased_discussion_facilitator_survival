# Review Prompt

以下は、別セッションで system design をレビューさせるためのプロンプトです。

```text
あなたはシニアソフトウェアエンジニア兼プロダクト仕様レビュアーです。

対象リポジトリ:
/Users/tonishi/Documents/GitHub/cOnigashima/biased_discussion_facilitator_survival

目的:
Bias Meeting Game P0 を React Web App として実装する前に、docs/system_design 配下の仕様が、P0正本・デザインカンプ・旧handoffと矛盾なく実装可能な状態になっているかレビューしてください。

重要な前提:
- 実装は React Web app / Vite / TypeScript の想定です。
- Chromeやブラウザ実レンダリングには頼らず、HTML/Markdown/YAMLのテキストから確認してください。
- Pira/Jira BUG-418 は、カンプ優先で証拠カード化する決定済みです。
- Evidence ID は `jira_bug_418_repro`。
- P0実装上の証拠カード総数は9枚です。
- CPU Spike Log はメインカンプ未描画ですが、罠カードとして実装に含めます。
- Slack/Pilack は導入資料で、証拠カード化しません。
- P0ではピン留め、Premise Lock表示、Heat/Clarity/Support表示、議事録修正フェーズは実装しません。

必ず読むファイル:
1. docs/system_design/README.md
2. docs/system_design/13_final_consistency_audit.md
3. docs/system_design/12_pira_jira_reconciliation.md
4. docs/system_design/10_scenario_seed_data_spec.md
5. docs/system_design/09_scenario_content_matrix.md
6. docs/system_design/06_scenario_data_schema.md
7. docs/system_design/03_game_state_and_rules_spec.md
8. docs/system_design/07_round_rule_table_spec.md
9. docs/system_design/11_meeting_interaction_content.md
10. docs/system_design/04_ui_screen_model.md
11. docs/product/p0-spec.md
12. docs/design/design_handoff_bias_meeting_game/README.md

必要に応じて確認するファイル:
- docs/design/design_handoff_bias_meeting_game/Bias Meeting Game カンプ.dc.html
- docs/design/design_handoff_bias_meeting_game/Bias Meeting Game ワイヤーフレーム.dc.html
- bias_meeting_game_handoff/09_stage1_go_no_go_spec.md
- bias_meeting_game_handoff/10_stage1_dialogue_and_choices.md
- bias_meeting_game_handoff/11_data_model.yaml

レビュー観点:
1. 実装を止める未決仕様が残っていないか。
2. Pira/Jiraを証拠カード化したことで、Evidence ID、Document ID、クリック行、取得copy、R2ルール、テスト観点に漏れがないか。
3. 証拠カード総数9枚、クリック可能行9本、Slack非証拠化、CPU罠カード化が各Specで一貫しているか。
4. P0正本に残る8枚記述と、system_design側の9枚上書きが十分に明示されているか。
5. カンプの取得文言に含まれる用途ヒントを、実装用fact-only copyで置き換える方針が一貫しているか。
6. Round 1専用カンプなし、CPU画面なし、timer挙動差分、会議ログ/Result copy不足が、実装ブロッカーではなく実装タスクとして整理されているか。
7. P0外要素、特にピン留め、議事録修正、Premise Lock、Heat/Clarity/Support表示が混入していないか。
8. React実装に入るための型・状態・ルール・UI・seed dataの境界が明確か。

出力フォーマット:

最初に必ず次のどれかを1行で出してください。
- GO: 実装工程へ進んでよい
- CONDITIONAL GO: 軽微な修正後に進んでよい
- NO-GO: 実装前に仕様判断が必要

その後、 findings first で書いてください。

各findingは次の形式:
- Severity: Blocker / High / Medium / Low
- File: path:line
- Issue: 何が矛盾または不足しているか
- Why it matters: 実装時に何が壊れるか
- Suggested fix: 具体的な修正案

レビューで問題がなければ、No findings と明記し、残る実装タスクだけを短く列挙してください。

注意:
- 仕様レビューなので、感想や一般論は不要です。
- 既に決定済みの「Pira/Jiraは証拠カード化する」を再議論しないでください。整合しているかだけを見てください。
- 旧handoffは素材集です。P0正本またはsystem_design accepted docsと矛盾する場合、旧handoff側を正にしないでください。
- 可能なら `rg` で `TBD`, `未確定`, `8枚`, `最大取得可能カード`, `Pira`, `Jira`, `cpu_spike_log`, `Premise`, `Heat`, `Clarity`, `Support`, `議事録修正`, `ピン留め` を検索して確認してください。
```
