# Game Structure

## High-Level Loop

```text
1. 事件/課題が提示される
2. 探索パートで資料を読む
3. 証拠カード・過去発言・人物情報を集める
4. 会議バトルに入る
5. 発言・議事録・前提を操作する
6. 最終判断を出す
7. 結果・余波・リザルトを見る
8. 次章に影響が残る
```

## Two Core Parts

### Exploration Part

読むもの：

- Slack
- Jira
- GitHub PR
- CIログ
- 障害ログ
- 顧客メール
- ロールバック手順
- Feature Flag設計
- 過去障害報告
- 会議メモ
- 1on1メモ
- 技術顧問の提案書
- 経営会議資料

得るもの：

- 証拠カード
- 罠カード
- 補助カード
- 人物の利害
- 過去発言
- 未検証論点
- 違和感メモ

### Battle Part

会議中に起きること：

- 1人ずつ発言する。
- 発言の一部を狙う。
- 証拠カードや過去発言カードを使う。
- 出し方を選ぶ。
- 会議パラメータが変わる。
- 発言が議事録に残る。
- 放置された前提が固まる。
- 最後に議事録修正フェーズがある。

## Session Structure for MVP

```text
Prologue:
  明日の決済v2リリース前夜。Slack上で不穏なやりとりがある。

Exploration:
  Slack, Jira, PR, CI, 顧客メール, ロールバック手順を確認。

Battle:
  Go/No-Go会議。PM, Tech Lead, 営業, QA, CTOが発言。

Minute Revision:
  自動議事録ドラフトを修正する。

Ending:
  全面リリース / 全面延期 / 分割リリース / 分割リリース + ルール化。

Result:
  Safety, Delivery, Trust, Clarity, Heat Control, Learning。
```

## Longer Campaign Progression

| Chapter | Role | 舞台 | 主なテーマ | カタルシス |
|---|---|---|---|---|
| 1 | 現場エンジニア | PR、Jira、CI、リリース会議 | 正常性、計画錯誤、確証 | 不穏なログを証拠に変えて事故を防ぐ |
| 2 | Tech Lead | 設計レビュー、見積もり、技術選定 | 権威、バンドワゴン、サンクコスト、ハロー | 技術宗教戦争を制約とトレードオフに戻す |
| 3 | EM | 1on1、評価、採用、チーム衝突 | ハロー、ホーン、基本的帰属、自己奉仕 | 人間関係の詰まりをほどく |
| 4 | Staff/Principal | 複数チーム、基盤刷新、ADR | 局所最適、現状維持、権威、生存者 | チーム間の前提ズレを統合する |
| 5 | ITコンサル/技術顧問 | 顧客組織、役員会、契約、提案書 | アンカリング、フレーミング、権威、計画錯誤 | 提案を実行可能な計画に落とす |
| 6 | CTO/VPoE | 予算、撤退、採用計画、投資家説明 | サンクコスト、正常性、楽観、自己奉仕 | 技術・人・金・顧客の制約下で判断する |

## Gameplay Pillars

| Pillar | 内容 |
|---|---|
| Document Reading | 資料から違和感を探す |
| Argument Targeting | 発言の怪しい箇所を狙う |
| Timing | すぐ使うか、ピン留めするか |
| Social Handling | 面子、防衛心、信頼を扱う |
| Premise Control | 怪しい前提が合意になる前に止める |
| Decision Design | 出す/止めるの二択を第三案にする |
| Aftermath | 判断が人間関係・次章に残る |

## Stage Format Template

```text
Stage Title:
Role:
Situation:
Main Decision:
Characters:
Exploration Documents:
Evidence Cards:
Red Herrings:
Meeting Rounds:
Core Premises:
Possible Endings:
Result Metrics:
Unlocks / Carryover:
```

## Example Stage List

| Stage | Role | Main Conflict |
|---|---|---|
| 決済v2 Go/No-Go | Senior Engineer | 出す/止める/分割する |
| 障害対応ウォールーム | SRE | 直近原因への思い込みを避けて復旧する |
| ポストモーテム裁判 | Incident Commander | 犯人探しを構造改善に変える |
| アーキテクチャレビュー | Tech Lead | 流行技術と自社制約を比較する |
| ブリリアントジャーク対策 | EM | 成果とチーム破壊を分離する |
| 顧客折衝 | IT Consultant | 無理な要求を実行可能な合意に変える |
| 技術顧問の大型提案 | CTO | 権威と提案書のフレームを剥がす |
| 評価・昇進会議 | EM/Director | ハロー/ホーンを補正する |
| 赤字プロダクト撤退 | Executive | サンクコストと希望的観測を扱う |
