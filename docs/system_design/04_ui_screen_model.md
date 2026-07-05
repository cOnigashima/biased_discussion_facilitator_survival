# UI Screen Model

Status: Draft v0  
Date: 2026-07-05

## Purpose

このSpecは、P0 React Webアプリの画面構成、コンポーネント分解、UI状態を定義する。

デザインカンプの見た目を参照しつつ、静的HTMLではなく状態駆動のReactコンポーネントとして実装するためのモデルである。

## UI Principles

- 1360x860デスクトップ体験を優先する
- カンプの密度、色、余白、情報設計に寄せる
- HTMLカンプのinline styleをそのまま移植しない
- 画面はGameStateから導出する
- ルール判定をUIに書かない
- プレイ中に数値スコアやバイアス名を出さない
- 証拠カードの用途ヒントを出さない
- クリック可能箇所はhover/focusで分かるようにする

## Screen Flow

```text
PrologueScreen
  -> ExplorationScreen
  -> MeetingScreen R1-R4
  -> FinalDecision modal on MeetingScreen
  -> ResultScreen
```

`phase` と `meeting.currentRoundIndex` で表示を切り替える。

## Shared App Frame

P0全体は、カンプの1360x860キャンバスを基準にする。

推奨:

- `AppFrame` が外側背景、キャンバス、スケール制約を担当
- 画面本体は `width: 1360px; height: 860px`
- 小さいviewportでは縮小または横スクロールを許容
- モバイル専用レイアウトはP0外

## PrologueScreen

目的:

- 状況と人物の初期スタンスを伝える
- Slack風アプリ `Pilack` の `#release-check` を読む
- 探索へ入る導線を出す

表示:

- メニューバー
- Pilackウィンドウ
- Slack風チャンネル一覧
- メッセージストリーム
- ドック
- 最下部コメント帯

操作:

- `資料を調べる` / `探索へ` のボタン

証拠取得:

- Prologue内のSlackは証拠カード化しない

## ExplorationScreen

目的:

- 資料アプリを開き、怪しい行をクリックして証拠カードを取得する
- 取得証拠が2枚以上なら会議開始を解放する

主要コンポーネント:

```text
ExplorationScreen
  AppMenuBar
  DesktopShell
    DocumentWindow
    Dock
    EvidenceTray
  ExplorationCommentBar
  EvidenceAcquiredModal
```

### Dock

表示するアプリ:

- Pilack
- Pira
- PR
- CI
- Staging
- Mail
- Rollbk
- FFlag
- 過去
- Metrics or CPU
- Evidence Memo

クリックで `OPEN_DOCUMENT` を発火する。

### DocumentWindow

`document.kind` に応じて軽い表示差分を出す。

P0では、全資料を完全別コンポーネントにしない。以下の共通構造で十分に寄せる。

```text
Window chrome
  Title bar
  App-specific header
  Document content
```

行クリック:

- `DocumentLine.evidenceId` がある行だけクリック可能
- 常時ハイライトはしない
- hover/focusで背景やリングを出す
- 取得後は取得済み表示に変える

### EvidenceAcquiredModal

証拠取得後に短く表示する。

表示:

- `取得: {evidence.title}`
- `{evidence.factSummary}`

表示しない:

- どのラウンドで使うか
- 誰に刺さるか
- Good/Great条件へのヒント

### ExplorationCommentBar

表示:

- プレイヤーの短い気づき
- 証拠枚数
- 会議開始ボタン

会議開始ボタン:

- 証拠2枚未満はdisabled
- 証拠2枚以上でenabled
- クリック時に「会議開始後は探索に戻れない」ことを明示する

確認UI:

- 初期実装では簡単なconfirm modalでよい
- ブラウザ標準 `confirm()` は使わず、アプリ内モーダルにする

## MeetingScreen

目的:

- 会議ログを読み、NPC発言の狙う箇所を選ぶ
- 所持証拠と出し方を選ぶ
- 各ラウンド1アクションだけ実行する

主要コンポーネント:

```text
MeetingScreen
  MeetingHeader
  ParticipantBar
  MeetingMain
    MeetingLogPanel
    MeetingActionPanel
      TargetPhraseList
      EvidenceSelector
      DeliverySelector
      ConfirmActionButton
```

### MeetingHeader

表示:

- `ROUND 02 / 05` などのラウンド表示
- 空気/状況の自然言語ラベル
- タイマー風UI

Timer:

- 初期実装では表示のみ
- 強制タイムアウトはしない
- 将来有効化できるよう、コンポーネント境界は分ける

### ParticipantBar

表示:

- 佐伯 PM
- 黒瀬 Tech Lead
- 桐谷 Sales
- 三村 QA
- 榊 CTO
- 自分

発言中:

- 枠を強調
- `発言中` バッジ
- 他参加者はopacityを落とす

アバター:

- P0ではCSSの鳥プレースホルダー
- 画像アセットは使わない

### MeetingLogPanel

表示:

- NPC発言
- プレイヤー発言
- NPC反応
- 事実ログ

クリック可能な発言箇所:

- TargetPhraseとして分割
- hoverでクリック可能に見える
- 選択中だけ青下線
- 未選択時の常時ハイライトはしない

### MeetingActionPanel

3段選択を縦に並べる。

1. 狙う発言箇所
2. 証拠カード
3. 出し方

`ConfirmActionButton` は以下が揃うまでdisabled。

- target selected
- evidence selected
  - `証拠なし` も選択扱い
- delivery selected

### EvidenceSelector

表示:

- 所持証拠カード
- `証拠なし`

R1-R3:

- 単一選択

R4:

- 最大2枚選択
- `R4のみ2枚コンボ可` のバッジを表示
- `証拠なし` 選択時は他証拠を解除

R5:

- 表示しない

### DeliverySelector

出し方はラウンドごとの固定候補。

全ラウンド共通コマンド表にはしない。

例:

- 条件確認
- 比較質問
- 共感してから分割
- 退路提示
- スコープ分解
- 攻撃的に指摘

画面上では、効果や正解を示す説明を書かない。

## FinalDecisionModal

R5ではMeetingScreen上にモーダルを出す。

常時表示:

- 全面リリース
- 全面延期

条件解放:

- 分割リリース
- 分割リリース + Go/No-Go基準の明文化

重要:

- 未解放選択肢はグレー表示しない
- 解放済み選択肢だけを一覧に出す

選択後:

- `CHOOSE_FINAL_DECISION`
- Ending判定
- Resultへ遷移

## ResultScreen

目的:

- 数値スコアなしで、判断結果と会議の振り返りを見せる

主要コンポーネント:

```text
ResultScreen
  EndingBanner
  FinalDecisionSummary
  MeetingLogRecap
  FactSummary
  RelationshipSummary
  GovernanceRules
  BiasReflection
  FooterActions
```

表示:

- Ending
- 最終判断
- 会議ログ
- 確認できた事実
- 確認できなかった事実
- 味方化/敵対の結果
- Great時に制度化されたルール
- 自然言語の振り返り
- 関連バイアス名

バイアス名:

- プレイ中には出さない
- Resultで自然言語の振り返りの下に添える
- 主見出しにしない

## UI State vs Game State

GameStateに入れるもの:

- 現在phase
- 現在資料
- 取得済み証拠
- 現在ラウンド
- 選択中target/evidence/delivery
- 内部フラグ
- 会議ログ
- Ending

ローカルUI stateでよいもの:

- モーダルのアニメーション状態
- hover状態
- タブの開閉
- スクロール位置
- 一時的なfocus管理

ただし、プレイ結果に影響する状態は必ずGameStateに入れる。

## Design Tokens

`styles/tokens.css` に以下を移す。

- 面/地
- インク
- 罫線
- primary blue
- coral
- teal
- danger red
- amber
- pick highlight
- radius
- shadow

フォント:

- Zen Maru Gothic
- IBM Plex Sans JP
- IBM Plex Mono

P0ではGoogle Fonts読み込みを許可する。オフライン配布が必要になったらセルフホストを検討する。

## Interaction Caveats

禁止:

- 常時正解行をハイライトする
- 罠行と重要行を見た目で区別する
- 証拠カードの用途ヒントを出す
- 選択肢に「味方になる」「Great条件」などのメタ情報を出す
- 会議ログに成功/失敗を書く
- 数値スコアや内部フラグ名をプレイヤーへ出す

許可:

- hover/focusでクリック可能性を示す
- 取得済み表示を出す
- R4のみ2枚コンボ可というUI制約を示す
- Resultで関連バイアス名を添える

