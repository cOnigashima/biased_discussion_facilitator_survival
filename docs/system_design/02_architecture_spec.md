# Architecture Spec

Status: Draft v0  
Date: 2026-07-05

## Decision

P0はReact Webアプリとして実装する。

採用スタック:

| Area | Decision |
|---|---|
| Build | Vite |
| UI | React |
| Language | TypeScript |
| State | React `useReducer` |
| Rules | Pure TypeScript functions |
| Scenario Data | TypeScript structured data |
| Styling | CSS Modules + global design token CSS |
| Tests | Vitest for rules, Playwright for core flows |
| Persistence | None for P0 |
| Backend | None for P0 |

## Why React Web

P0のゲーム進行はローカル状態で完結する。サーバー永続化、認証、マルチプレイ、セーブ/ロードはP0外である。

React Webを選ぶ理由:

- デザインカンプがWeb UIとして作られている
- 資料探索UIと会議UIをコンポーネントとして分解しやすい
- TypeScriptでシナリオID、証拠ID、フラグ更新を型付けできる
- ルール判定をUIから独立させてテストできる
- Playtest用に静的ホスティングしやすい

Next.jsはP0では採用しない。SSR、API routes、ルーティング規模が必要になってから再検討する。

## Architecture Goals

この設計で守りたいこと:

- 1ステージを最後まで遊べる
- UIとルール判定を分離する
- シナリオ本文をUIコンポーネントに埋め込まない
- P0仕様とデザインカンプの両方に追従できる
- P1以降でステージ追加やJSON/YAML化に移れる
- カンプHTMLの静的構造をそのまま移植しない

## Non-Goals

P0では次を設計対象外にする。

- ユーザーアカウント
- セーブ/ロード
- 複数ステージ管理
- サーバーAPI
- 多言語化
- モバイル最適化
- CMS/シナリオエディタ
- 実時間タイマーによる強制進行
- 汎用ノベルゲームエンジン化

## Layering

アプリは次のレイヤに分ける。

```text
src/
  scenario/
    P0ステージの静的データ
  domain/
    型、ID、GameState、ルール判定
  app/
    reducer、アプリ起動、画面遷移
  ui/
    Reactコンポーネント
  styles/
    design tokens, common styles
```

依存方向:

```text
ui -> app -> domain
      app -> scenario
```

`domain` は `scenario` に直接依存しない。`app` がscenario dataを読み込み、必要に応じてdomain関数へ引数として渡す。

### scenario layer

役割:

- Stage定義
- Character定義
- Document定義
- EvidenceCard定義
- MeetingRound定義
- DeliveryOption定義
- Ending copy

初期はTypeScriptファイルとして持つ。

例:

```text
src/scenario/stage-go-no-go-payment-v2/
  index.ts
  characters.ts
  documents.ts
  evidence.ts
  rounds.ts
  endings.ts
```

### domain layer

役割:

- 型定義
- 初期状態生成
- 証拠取得ルール
- 会議アクション解決
- 最終判断選択肢の解放判定
- Ending判定
- ResultSummary生成

ここはReactに依存しない。

### app layer

役割:

- `useReducer` のreducer
- UIイベントからdomain actionへの変換
- 現在画面の選択
- 開発用デバッグ情報の管理

### ui layer

役割:

- 画面表示
- クリック/選択などの入力
- 選択中状態の見せ方
- カンプに基づくレイアウトとビジュアル

UIコンポーネントは、判定条件を直接持たない。例えば「Great選択肢を出すか」はUIではなくdomain/app layerで決める。

## Proposed Directory Structure

```text
src/
  main.tsx
  App.tsx

  app/
    gameReducer.ts
    gameActions.ts
    selectors.ts
    useGame.ts

  domain/
    ids.ts
    types.ts
    initialState.ts
    evidenceRules.ts
    meetingRules.ts
    finalDecisionRules.ts
    endingRules.ts
    resultSummary.ts
    meetingLog.ts

  scenario/
    goNoGoPaymentV2/
      index.ts
      characters.ts
      documents.ts
      evidence.ts
      rounds.ts
      endings.ts

  ui/
    screens/
      PrologueScreen.tsx
      ExplorationScreen.tsx
      MeetingScreen.tsx
      ResultScreen.tsx
    exploration/
      DesktopShell.tsx
      Dock.tsx
      DocumentWindow.tsx
      EvidenceTray.tsx
      EvidenceAcquiredModal.tsx
    meeting/
      ParticipantBar.tsx
      MeetingLogPanel.tsx
      TargetPhraseList.tsx
      EvidenceSelector.tsx
      DeliverySelector.tsx
      FinalDecisionModal.tsx
    result/
      EndingBanner.tsx
      FactList.tsx
      RelationshipSummary.tsx
      BiasReflection.tsx
    common/
      AppFrame.tsx
      Avatar.tsx
      Button.tsx

  styles/
    tokens.css
    base.css
```

## Runtime Flow

P0の実行フロー:

```text
App boot
  -> load static scenario
  -> create initial GameState
  -> show Prologue
  -> enter Exploration
  -> acquire evidence cards
  -> if evidence count >= 2, allow meeting start
  -> lock exploration
  -> play Meeting R1-R4
  -> show R5 final decision modal
  -> decide ending
  -> show Result
```

## App Phase

`GameState.phase` は画面遷移を制御する。

```ts
type GamePhase =
  | 'prologue'
  | 'exploration'
  | 'meeting'
  | 'finalDecision'
  | 'result';
```

P0ではURLルーティングを使わない。1画面アプリとして、`phase` で表示コンポーネントを切り替える。

理由:

- セーブ/ロードがない
- 途中URL共有が不要
- 状態の単一性を保ちやすい

## Data Strategy

初期はTypeScript構造化データにする。

理由:

- ID参照の型安全性を優先する
- シナリオ構造がまだ変わり得る
- P0内では編集者向け外部ファイル化より実装安定性が重要

ただし、各scenarioファイルは純データに寄せる。React componentや関数を混ぜない。

将来JSON/YAML化したいデータ:

- Documents
- EvidenceCards
- Characters
- MeetingRounds
- Ending copy

将来もTypeScriptに残す可能性が高いもの:

- Rule evaluators
- Complex condition predicates
- ResultSummary generation

## Styling Strategy

`styles/tokens.css` にデザインREADMEのカラートークンを移す。

方針:

- グローバルにCSS variablesを定義
- コンポーネントごとにCSS Modulesを使う
- カンプ由来のinline styleを直接持ち込まない

P0ではCSS-in-JSは使わない。

理由:

- カンプのスタイル量が多い
- CSS variablesとの相性がよい
- 静的ホスティングとビルドを単純に保てる

## Testing Strategy

優先度:

1. Rule unit tests
2. Reducer tests
3. Core Playwright flows
4. Visual regressionはP0後

Vitestで必ず確認するもの:

- 証拠2枚未満では会議開始できない
- 証拠2枚以上で会議開始できる
- R4コンボで `rollback_risk_resolved` / `feature_flag_resolved` / `qa_ally` が立つ
- Tech Lead敵化時は分割リリースが解放されない
- Good条件で分割リリースが解放される
- Great条件で明文化選択肢が解放される
- 全面リリースは常にBad
- 全面延期はNormal

Playwrightで確認するもの:

- Prologueから探索へ進める
- 資料を開き、行クリックで証拠を取得できる
- 証拠2枚取得後に会議を開始できる
- R1-R5を最後まで進められる
- Great pathでGreat Resultに到達できる

## Accessibility Baseline

P0で最低限守ること:

- 主要ボタンはbutton要素にする
- 選択状態は色だけでなく枠/下線/ラベルでも分かるようにする
- キーボードフォーカスを消さない
- クリック可能な資料行はhover/focusの両方で反応する
- カラートークンはコントラストを維持する

完全なキーボード操作最適化はP0後でよいが、HTMLとして破綻しない構造にする。

## Build and Deployment

P0は静的ビルドで配布できる形にする。

```text
npm run dev
npm run build
npm run preview
```

バックエンドがないため、GitHub Pages、Netlify、Vercelなどに静的配布できる。

## Open Risks

| Risk | Mitigation |
|---|---|
| カンプ再現に時間を使いすぎる | 先にルールと通しプレイを実装する |
| UIにルールが散る | domain layerに判定を集約する |
| シナリオデータが巨大化する | P0は1ステージ固定、外部化を急がない |
| タイマーが読み体験を邪魔する | 初期は表示のみ、強制しない |
| P1要素が混ざる | P0正本の除外項目を実装チェックリストに入れる |
