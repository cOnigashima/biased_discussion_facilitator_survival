# Handoff: Bias Meeting Game — P0（決済v2 Go/No-Go 会議）

## Overview
「資料探索 ＋ 会議バトル」型のブラウザゲームの P0（第1ステージ）UI 一式。プレイヤーはシニアエンジニアとして、明日リリース予定の「決済v2」の資料に潜む違和感を見つけ（探索）、会議で発言に刺し（会議バトル）、**全面Go / 全面Stop の二択を「必要機能だけの段階リリース」に軌道修正する**。

検証したい核となる快感は次の1点だけ：

```
資料から違和感を見つける → 会議発言に刺す → 全面Go / 全面Stop を分割リリースへ軌道修正する
```

バイアス名当て・論破ゲーム・教育教材ではない。プレイヤーは現場資料と会議発言のズレを読み、相手の利害を壊しすぎずに意思決定を変える。

---

## About the Design Files
このバンドルの `.dc.html` ファイルは **HTMLで作られたデザインリファレンス（プロトタイプ）** です。見た目と意図した挙動を示すもので、そのまま本番コードとして貼り付けるものではありません。

タスクは、これらのHTMLデザインを **対象コードベースの既存環境（React / Vue / Svelte など）とそのパターン・ライブラリで作り直すこと**。まだ環境がなければ、このプロジェクトに最適なフレームワークを選定して実装してください。ゲームの状態遷移・分岐ロジックの契約は `p0-spec.md`（正本仕様）に固定されています。**実装時は必ず `p0-spec.md` を一次資料として参照**し、本READMEはUI/ビジュアル/画面対応の解説として使ってください。

### ファイル一覧
- `Bias Meeting Game カンプ.dc.html` — **メイン成果物**。全画面（コア4 ＋ 探索アプリ8 ＋ 会議Round4 ＋ リザルト4）が縦に並んだ高忠実カンプ。ブラウザで直接開ける（`support.js` が同階層に必要）。
- `support.js` — カンプを描画するためのランタイム。**中身は触らない／実装対象ではない**。HTMLを開くために同梱しているだけ。
- `p0-spec.md` — **正本仕様**。画面の役割・証拠カード・ラウンド構成・フラグ・分岐条件・エンド分類の契約。
- `Bias Meeting Game デザインコンセプト.dc.html` — 配色/フォント探索の記録（参考）。
- `Bias Meeting Game ワイヤーフレーム.dc.html` — 初期ワイヤー（参考、最新はカンプが優先）。

### 開き方
`Bias Meeting Game カンプ.dc.html` を `support.js` と同じフォルダに置いてブラウザで開く。各画面は 1360×860 の固定キャンバスで、左上のラベル（`SCREEN 01`, `APP · CI`, `SCREEN 03 · R3` など）で識別できる。

---

## Fidelity
**High-fidelity（hifi）**。最終的な配色・タイポグラフィ・余白・密度・インタラクションの見た目を確定したモックアップ。ピクセル忠実に、対象コードベースの既存ライブラリ/パターンで作り直すことを想定。

ただし **静的カンプ**であることに注意：各「状態」は別々の画面として並べてある（例：探索の取得前/取得後、会議の各Round、リザルトの4エンド）。実際のアプリでは 1 つのコンポーネント階層が状態に応じてこれらを切り替える。状態遷移の配線は未実装で、`p0-spec.md` のフラグ条件に従って実装する。

---

## デザインシステム（全画面共通）

### タイポグラフィ
Google Fonts から3ファミリー。用途を固定して使う。
- **Zen Maru Gothic**（400/500/700）— 見出し・画面タイトル・大きなラベル。丸ゴシックで柔らかい印象。
- **IBM Plex Sans JP**（400/500/600/700）— 本文・UI テキスト・ボタン。
- **IBM Plex Mono**（400/500/600）— コード・ログ・タイムスタンプ・小さなキャプションラベル（`ROUND 02 / 05`, `PROLOGUE / 状況` など）・フラグ名。

代表サイズ（1360×860 キャンバス基準）：画面タイトル 30px / セクション見出し 20–22px / 会議の発言 15–16px / 本文 13–15px / ラベル 11–12px mono。**最小 11px 程度**（実装では相対単位に置き換え可）。

### カラートークン
```
/* 面・地 */
--desk:            #dcdae0   /* 一番外側の机の色（カンプの背景） */
--screen-grad:     radial-gradient(1200px 720px at 28% 6%, #eef3fb, #d7e1f0) /* デスクトップ壁紙 */
--app-bg:          #eef2f9   /* 会議・リザルト画面の地 */
--surface:         #ffffff
--surface-soft:    #f7f9fc   /* サイドバー・薄い面 */
--surface-softer:  #fbfcfe

/* インク（文字） */
--ink-900: #1b2735  /* 見出し */
--ink-700: #2c333d
--ink-600: #3a4454
--ink-500: #4a5464
--ink-400: #5a6576
--ink-300: #7b8798
--ink-200: #8a97a8
--ink-100: #aab3c0  /* 最も薄い補助文字 */

/* 罫線 */
--line:        #e2e8f1
--line-soft:   #eef2f9
--line-window: #cfd8e6
--line-input:  #d6deea

/* プライマリ（青＝システム/選択/決定） */
--blue-600: #2f68e0
--blue-700: #1f4db0  /* ボタン下の厚み影 */
--blue-tint: #eaf1fd
--blue-border: #cfe0fb

/* コーラル（プレイヤー「自分」・強調・PROLOGUE/取得ラベル） */
--coral-500: #ec7a4f
--coral-700: #c85e34
--coral-tint: #fdf0e9

/* teal（取得系・CI・Feature Flag・成功/味方） */
--teal-600: #2ba88c
--teal-700: #1f8a72
--teal-tint: #e6f6f0
--teal-border: #bfe6d8

/* danger（失敗・500・不可逆・敵化） */
--red-600: #c0392b
--red-500: #e0655a
--red-tint: #fdeceb
--red-tint2: #fdf3f2
--red-border: #f2c9c4

/* amber（staging・WARN・NORMALエンド） */
--amber-500: #e8a13a
--amber-700: #b5771a
--amber-ink: #c8901f
--amber-tint: #fdf6e9
--amber-border: #f2dbb0

/* クリック可能行 / 選択中ハイライト */
--pick-bg:   #fff3d6                 /* 取得可能な行・選択中の背景 */
--pick-ring: inset 0 0 0 1.5px #ffca5c
--select-underline: 2px solid #2f68e0 /* 会議で選択中の発言箇所 */
```

### アプリ固有色（探索の各資料アプリ）
各「アプリ」はドックとタイトルで固有色を持つ。ブランド製品は **P始まりの鳥名**、汎用ツールは一般語のまま。
| アプリ | 実在の元 | 表示名 | 固有色 | ドックアイコン |
|---|---|---|---|---|
| Pilack | Slack | Pilack | 紫 `#6b4e9e` | ◆ |
| Pira | Jira | Pira | 青 `#2f68e0` | ▤ |
| PR | (汎用) | PR | 藤 `#7a5ad0` | ⑃ |
| CI | (汎用) | CI | teal `#2ba88c` | ❯_ |
| Staging | (汎用) | Staging | 琥珀 `#e8a13a` | ▲ |
| Mail | (汎用) | Mail | 青 `#2f8fd0` | ✉ |
| Rollback | (汎用) | Rollbk | スレート `#5a6576` | ↩ |
| Feature Flag | (汎用) | FFlag | teal `#2ba88c` | ⚑ |
| 過去障害 | (汎用) | 過去 | コーラル `#c85e34` | ◷ |

命名規則：**ブランド製品だけ P始まりの鳥名**（Slack→Pilack, Jira→Pira）。他は一般語（CI / PR / Staging Log / Rollback / Feature Flag / 過去障害）のまま。

### 角丸・影・その他
```
--radius-screen: 14px   /* 画面キャンバス */
--radius-card:   12–14px
--radius-btn:    11–12px
--radius-chip:   16px（ピル）/ 9px（小タグ）
--radius-appicon: 13–15px

--shadow-screen: 0 24px 60px rgba(20,30,50,.28)
--shadow-window: 0 22px 50px rgba(20,30,50,.22)
--shadow-btn:    0 4px 0 #1f4db0   /* 厚みのあるチャンキーボタン */
--shadow-modal:  0 30px 70px rgba(15,22,35,.4)
```

### アバター（キャラ）システム
立ち絵は使わず、**鳥のプレースホルダ**で表現。`repeating-linear-gradient` の斜めストライプ円＋モノスペースの鳥名ラベル。実装では実イラストに差し替え可（枠と色だけ踏襲）。
- 佐伯 PM＝セキセイ（黄緑 `#b7c78e`）
- 黒瀬 Tech Lead＝ハヤブサ（青系 `#a9b6cc`）
- 桐谷 Sales＝オカメ（ベージュ `#d8c298`）
- 三村 QA＝フクロウ（藤 `#c0b2d4`）
- 榊 CTO＝イヌワシ（グレー `#9aa8ba`）
- プレイヤー「自分」＝コーラルの斜線ハッチ（枠 `#ec7a4f`）

会議で**発言中**のキャラは、枠を `#2f68e0`（2.5px）に強調＋下に「発言中」バッジ、他は `opacity:.5`。

---

## Screens / Views

全画面 1360×860。各アプリ画面（探索）は共通シェルを持つ：**メニューバー（上, 高さ30）→ アプリウィンドウ（top:40 left:26 width:1308 height:706, タイトルバー＋固有色）→ ドック（下, 全アプリ＋証拠メモ, アクティブは60px＋下ドット）→ コメント帯（最下, 高さ98, 「自分」の気づき＋証拠枚数＋会議を開始ボタン）**。

### コア画面

**1. SCREEN 01 — Prologue / Pilack（Slack導入）**
- 目的：状況と人物の初期スタンスを伝える。Slack風アプリ `Pilack` の #release-check チャンネルで、ci-bot 通知・PM佐伯のGo寄り発言・QA三村の懸念が流れる。最下部にPROLOGUEナレーション帯。
- レイアウト：ワークスペース列（66px, `#12161d`）→ チャンネル一覧 → メッセージ本体 → スレッド/リアクション。実アプリ密度。
- Slackは**導入資料**であり証拠カード化しない。

**2. SCREEN 02 — Exploration / 資料探索**
- 目的：デスクトップ上で資料アプリを開き、怪しい行をクリックして証拠カードを取得する探索ハブ。前面に CI Log ウィンドウ、背後に Pira。下にドック、最下部にコメント帯。
- 状態バリエーションが2枚：素の探索と、**取得確認ポップアップ**（暗幕＋中央カード「取得: CI失敗ログ」）。

**3. SCREEN 03 — Meeting / 会議バトル（Round 2 = 基準形）**
- 目的：ADVチャット型の会議。流れる発言ログ＋発言クリック＋右サイドバーで3段選択。Tech Lead黒瀬が「flaky」と主張する Round 2 を基準形として描画。
- レイアウト：ヘッダ（ROUND/空気/タイマー）→ 参加者バー（96px, 発言中を強調）→ 本体（左：ログ / 右336px：証拠＆アクション or 議事録タブ）。

**4. SCREEN 04 — Result / リザルト（GREATエンド例）**
- 目的：数値スコアを出さず、最終判断・会議ログ・確認できた/できなかった事実・関係の結果・（Great時）明文化ルール・自然言語の振り返り＋関連バイアス名を表示。
- レイアウト：エンドバナー（158px）→ 2カラム（左672px：最終判断＋会議ログ / 右：事実2枚＋関係＋明文化＋バイアス）→ フッタ。

### 探索アプリ画面（証拠資料8種）
各アプリは共通シェル＋固有色。**怪しい行は `--pick-bg`＋`--pick-ring` の黄色ハイライトでクリック可能を示す**（カンプでは代表行に既に適用。実装では常時ハイライトせず、ホバー時のみクリック可能と分かる挙動にする — `p0-spec.md`「探索パート仕様」参照）。

- **APP · CI** — ビルドログ。`CheckoutV2MigrationSpec` が `legacy_plan=true` かつ `tax_category=null` で失敗。→ 証拠 `ci_legacy_failure`（flaky前提を崩す）。
- **APP · Pira**（Jira）— BUG-418 詳細。三村が「stagingで3回再現／tax_category null で500」、黒瀬が「cleanupで後対応、P2のまま」。
- **APP · PR** — #312 差分＋インラインレビュー。三村が事前に null 参照を指摘 → 黒瀬が「通常フローでは必須」で Resolved。→ 証拠 `pr_tax_category_comment`（強いが高リスク）。
- **APP · Staging** — 実環境ログビューア。500が11件反復（全部 legacy_plan/tax_category null）。→ 証拠 `staging_500_log`（CIより強い実環境証拠）。
- **APP · Mail** — 顧客メール。「今月中に必要なのは請求書出力（invoice export）だけ／決済フロー全体は急いでいない」。→ 証拠 `customer_email_scope`（スコープ分解の鍵）。
- **APP · Rollbk** — Runbook。checkout/invoiceはフラグoffで可逆、**customer_data_migrationだけ不可逆**。→ 証拠 `rollback_procedure`。
- **APP · FFlag** — フラグ管理ダッシュボード。`invoice_export_v2` と `checkout_v2_ui` は独立on/off、migrationはフラグ外。→ 証拠 `feature_flag_design`（分割リリース可能性）。
- **APP · 過去** — ポストモーテム INC-203。過去も一括リリースでQAの事前懸念が期限に押し切られ事故。→ 証拠 `past_incident_report`（**補助カード**：QA共感に効くが単独で前提解決しない）。

（`cpu_spike_log`＝CPUスパイクログは P0 では完全な罠カード。カンプ未描画。実装時に追加想定。）

### 会議バトル Round 別（Round 3 / 4 / 5）
Round 1→4 は各ラウンド **1アクション ＝ 3段選択（発言箇所 → 証拠カード → 出し方）**。右サイドバーで選ぶ。

- **SCREEN 03 · R3（Sales 桐谷）** — 「顧客には今月中と伝えている」。顧客メールで「必要なのは請求書出力だけ」と範囲を切り分けると `sales_ally` を狙える。
- **SCREEN 03 · R4（QA 三村）** — 「全部止めるべき」。**このRoundだけ複数証拠コンボ可**（ロールバック手順 ＋ Feature Flag設計）。2枚が噛み合うと `rollback_risk_resolved`＋`feature_flag_resolved`＋`qa_ally`。サイドバーに「R4のみ 2枚コンボ可」バッジ。
- **SCREEN 03 · R5（CTO 榊 最終判断）** — 会議画面（榊が発言中・背景ログはぼかし）の上に **モーダルポップアップ**で最終判断を選ぶ。常時2択（全面リリース／全面延期）＋**解放された選択肢だけ**（分割リリース＝GOOD以上／分割＋Go-No-Go基準の明文化＝GREAT）。**未解放の判断はグレー表示せず、そもそも一覧に出さない**。

### リザルト差分（BAD / NORMAL / GOOD / GREAT）
SCREEN 04 と同じ2カラム骨格。エンドバナーの色・バッジ・最終判断・会議ログ決定・事実・関係・末尾ブロックが差し替わる。
- **SCREEN 04 · BAD** — 全面リリース。バナー赤 `#c0392b`／`FAILED`。legacy checkout 500・rollback困難・会議が責任追及。末尾＝「起きたこと」。
- **SCREEN 04 · NORMAL** — 全面延期。バナー琥珀 `#c8901f`／`SAFE`。事故回避だが出せた請求書まで止め、営業に説明負担と溝。末尾＝「残ったもの」。
- **SCREEN 04 · GOOD** — 分割リリース成功だが `qa_ally`・明文化に未到達。バナー緑 `#3a9a7e`。末尾＝「GREAT まであと一歩」の差分。
- **SCREEN 04 · GREAT** — 分割＋明文化。バナー teal `#2ba88c`／`CLEAR`。3本の Go/No-Go 基準を明文化表示。

---

## Interactions & Behavior

### 探索
- 資料は最初から全て読める。怪しい行を**クリックで取得**（1資料1カード）。
- **常時ハイライトなし。ホバー時だけクリック可能と分かる。重要行と罠行を見た目で区別しない。**
- 取得後その行は取得済み表示に変わり、**短い事実説明だけ**を出す（用途ヒントは出さない）。例：「legacy_plan=true かつ tax_category=null のケースで CheckoutV2MigrationSpec が失敗している。」
- Slackを除く証拠**2枚以上**で会議開始が解放。コメント帯に「証拠が N枚 そろった → ▸ 会議を開始」。**会議開始後は探索に戻れない**（開始前に明示）。

### 会議バトル
- 各発言（NPC）バブルは**どれもクリック可能**（`cursor:pointer`＋ホバーで枠が反応）。上部に「どの発言もクリックして、狙う箇所を選べる」の案内。
- **選択中の発言箇所だけ**が青の下線ハイライト（`--select-underline`）で表示される（＝選択状態のみ可視、事前ハイライトはしない）。右サイドバー「狙う発言箇所」に選択中がミラーされる。
- 3段選択：発言箇所（各Round 2–3個）→ 証拠カード（所持カード＋「証拠なし」）→ 出し方（各Round 3–4個の固定候補）。「この発言をする」で確定。
- Round タイマー（`⏱ 0:24` ＋ コーラルのバー）。時間切れでそのRoundの発言機会は流れる。
- **コーチング文・用途ヒントは出さない**（「味方になる」等の誘導表示は不可）。ゲームは判定文を画面に出さず、会議ログには事実だけを淡々と書く。
- R5 は 3段選択ではなくモーダルでの最終判断選択。

### リザルト
- 数値スコアは非表示。事実・自然言語の振り返り・関連バイアス名（主見出しにはしない）で伝える。
- 会議ログは事実だけ（成功/失敗・危うい等の誘導語を書かない）。

---

## State Management

`p0-spec.md`「内部状態」「分岐条件」が契約。要点：

### 主要フラグ（bool、プレイヤーには数値/ゲージを見せない）
```
flaky_resolved, customer_scope_resolved, rollback_risk_resolved, feature_flag_resolved,
sales_ally, qa_ally, techlead_enemy, sales_enemy, qa_enemy,
meeting_breakdown_risk (整数), governance_rule_selected
```
補助評価フラグ（Good/Great条件には直接使わない。ログ/リザルト/決裂抑制に使う）：`qa_concern_understood`, `pm_cost_pressure_understood`, `sales_pressure_understood` など。

### 取得済み証拠（探索）
`ci_legacy_failure`, `customer_email_scope`, `rollback_procedure`, `feature_flag_design`, `staging_500_log`（主要5）／`pr_tax_category_comment`, `past_incident_report`, `cpu_spike_log`（補助・罠3）。会議開始ゲート＝罠含め2枚以上。

### 分割リリース解放条件（R5でこの選択肢を出す条件）
```
customer_scope_resolved
&& (rollback_risk_resolved || feature_flag_resolved)
&& (sales_ally || qa_ally)
&& techlead_enemy != true && sales_enemy != true && qa_enemy != true
```
Tech Lead を敵化した場合、P0では分割リリース不可。

### エンド分岐
- **全面リリース → 常に BAD**（危険な migration まで出すため）。未解決内容でリザルト差分。
- **全面延期 → 基本 NORMAL**（`meeting_breakdown_risk` 高なら Bad 寄りの Normal 差分）。
- **分割リリース → 常に Good 以上**（選択肢が出た時点で最低限の材料と合意が揃っている）。
- **Great** ＝ Good条件 ＋ `sales_ally && qa_ally && flaky_resolved && rollback_risk_resolved && feature_flag_resolved && techlead_enemy!=true && meeting_breakdown_risk < 3`。R5で「分割＋Go/No-Go基準の明文化」を選ぶと `governance_rule_selected=true` で Great 確定。
- `meeting_breakdown_risk >= 3`：Great不可。Good未達なら決裂寄り、Good達成済みなら「荒れたが分割は通した」差分。

Round別のGood/Great必須条件（R2 Tech Lead / R3 Sales / R4 QA など）は `p0-spec.md`「Round別の役割」を参照。

---

## Design Tokens
上記「デザインシステム」の**カラートークン／アプリ固有色／角丸・影／タイポグラフィ**節がトークンの一覧。スペーシングは 4px グリッド基準（実測：カード内 padding 13–20px、要素間 gap 6–16px、画面外周 padding 24–40px）。

## Assets
- フォント：Google Fonts（Zen Maru Gothic / IBM Plex Sans JP / IBM Plex Mono）。
- 画像アセットなし。アバターは CSS グラデーションのプレースホルダ（実イラストに差し替え可）。アイコンは記号グリフ（`◆ ▤ ⑃ ❯_ ▲ ✉ ↩ ⚑ ◷ ✎` 等）＝実装ではアイコンフォント/SVGに置換推奨。
- ブランド資産は使用していない（Slack/Jira等は Pilack/Pira など固有名にリネーム済み）。

## Files
- `Bias Meeting Game カンプ.dc.html` — 全画面の高忠実カンプ（実装の視覚的一次資料）。
- `p0-spec.md` — 状態遷移・分岐・エンドの契約（ロジックの一次資料）。
- `Bias Meeting Game デザインコンセプト.dc.html` / `Bias Meeting Game ワイヤーフレーム.dc.html` — 参考。
- `support.js` — カンプ描画用ランタイム（実装対象外）。
