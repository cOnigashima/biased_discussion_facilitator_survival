# Implementation Plan

Status: Draft v0  
Date: 2026-07-05

## Goal

P0の目標は、1ステージを最後まで遊べるReact Webアプリを作ること。

最初の検証では、見た目の完全再現よりも、次のループが通ることを優先する。

```text
Prologue
-> Exploration
-> Evidence acquisition
-> Meeting R1-R5
-> Final decision
-> Result
```

## Implementation Order

### Milestone 0: App Scaffold

目的:

React/Vite/TypeScriptアプリの土台を作る。

作業:

- Vite React TSプロジェクト作成
- `src/` のレイヤ構成作成
- `tokens.css` と `base.css` 作成
- Vitest導入
- Playwright導入

完了条件:

- `npm run dev` が起動する
- `npm run build` が通る
- 空のテストが走る

### Milestone 1: Domain Types and Scenario Data

目的:

P0ステージのデータをTypeScriptで表現する。

作業:

- ID型定義
- Character定義
- EvidenceCard定義
- Document定義
- MeetingRound定義
- Ending定義
- 初期GameState生成

完了条件:

- P0の9証拠カードが定義されている
- Slackを含む資料が定義されている
- R1-R5が定義されている
- TypeScript compileが通る

### Milestone 2: Rules and Reducer

目的:

UIなしでもP0の状態遷移をテストできるようにする。

作業:

- 証拠取得ルール
- 会議開始条件
- Meeting action resolution
- R4複数証拠コンボ
- Final decision unlock rules
- Ending rules
- ResultSummary生成
- Reducer実装

完了条件:

- Great pathがunit testで通る
- Tech Lead敵化時に分割リリースが出ない
- 全面リリースが常にBadになる
- 全面延期がNormalになる

### Milestone 3: Minimal Playable UI

目的:

見た目は最低限でも、最初から最後までクリックで遊べるようにする。

作業:

- PrologueScreen
- ExplorationScreen
- DocumentWindow
- Evidence acquisition
- MeetingScreen
- 3段選択UI
- FinalDecisionModal
- ResultScreen

完了条件:

- プレイヤーが証拠を2枚取得して会議を開始できる
- R1-R5を進められる
- Resultに到達できる
- Bad/Normal/Good/Greatの各Endingを再現できる

### Milestone 4: Design Handoff Alignment

目的:

カンプの高忠実UIに寄せる。

作業:

- 1360x860 AppFrame
- Prologue Pilack風UI
- Desktop/Dock UI
- 資料アプリ別の見た目差分
- Meeting参加者バー
- Meeting右サイドバー
- Result 2カラム表示
- カラートークン/フォント/余白調整

完了条件:

- カンプの主要4画面に情報構成が対応している
- APP資料画面の主要状態が再現できる
- R3/R4/R5の画面差分が表現されている
- BAD/NORMAL/GOOD/GREATのResult差分が表現されている

### Milestone 5: Verification and Playtest Build

目的:

初回プレイテストへ出せる状態にする。

作業:

- Playwrightで主要導線確認
- 画面崩れ確認
- Result文言確認
- P0受け入れ条件チェック
- READMEに起動方法を書く

完了条件:

- `npm run build` が通る
- 主要導線Playwrightが通る
- P0受け入れ条件を満たす
- ローカルでplaytest可能

## First Build Slice

最初に作るべき最小スライス:

```text
CI Logを開く
-> CI失敗ログを取得
-> Customer Emailを開く
-> 顧客メールを取得
-> 会議開始
-> R1-R5を仮UIで進行
-> 全面延期を選ぶ
-> Normal Resultを表示
```

理由:

- 探索からResultまでの縦導線を最短で確認できる
- Ending判定が単純
- UI全体の接続を早く検証できる

次にGreat pathを通す。

## P0 Acceptance Checklist

P0正本からの受け入れ条件:

- [ ] Prologueで状況と人物の初期スタンスが分かる
- [ ] Slack以外の9資料を読める
- [ ] 資料の行クリックで証拠カードを取得できる
- [ ] 証拠カード2枚以上で会議を開始できる
- [ ] 会議開始後は探索に戻れない
- [ ] 5ラウンドを1アクションずつ進行できる
- [ ] 発言箇所、証拠カード、出し方の3段選択ができる
- [ ] R4で `ロールバック手順 + Feature Flag設計` コンボが使える
- [ ] R5で条件に応じた最終判断選択肢が表示される
- [ ] Bad / Normal / Good / Great に分岐する
- [ ] 会議ログが事実ログとして残る
- [ ] Resultで、最終判断、確認できた事実、確認できなかった事実、関連バイアスを見られる

## Implementation Guardrails

実装中に守ること:

- UIに判定ロジックを書かない
- カンプHTMLをそのまま貼らない
- P0外機能を入れない
- 証拠用途ヒントを出さない
- プレイ中にバイアス名を出さない
- 数値スコアを出さない
- 未解放の最終判断選択肢をグレー表示しない
- 会議ログに成功/失敗を書かない

## Test Plan

### Unit Tests

必須:

- `canStartMeeting`
- `acquireEvidence`
- `resolveMeetingAction`
- `canChooseSplitRelease`
- `canChooseGovernedSplitRelease`
- `decideEnding`
- `buildResultSummary`

### Scenario Tests

必須:

- Great path
- Good path
- Tech Lead enemy path
- CPU trap path
- Full release Bad path
- Full delay Normal path

### Browser Tests

必須:

- Smoke: app loads
- Exploration: acquire two evidence cards
- Meeting: complete R1-R5
- Result: show correct ending

## Later Decisions

P0実装中または後で再検討するもの:

- シナリオデータのJSON/YAML化
- 実時間タイマー有効化
- モバイル対応
- セーブ/ロード
- P1のピン留め
- 議事録修正フェーズ
- Flowchart画面
- 画像アバター/立ち絵
