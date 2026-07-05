# P0 Specification: Bias Meeting Game

## 目的

このSPECは、ソフトウェア開発組織を舞台にした「資料探索 + 会議バトル」ゲームのP0実装契約である。

既存の `bias_meeting_game_handoff/` は広い企画メモとして残し、このファイルではgrillで決めたP0の範囲だけを固定する。

## P0で検証する核

P0で検証する快感は次の1点に絞る。

```text
資料から違和感を見つける
→ 会議発言に刺す
→ 全面Go / 全面Stop の二択を分割リリースへ軌道修正する
```

P0は、バイアス名当て、論破ゲーム、教育教材ではない。プレイヤーは現場資料と会議発言のズレを読み、相手の利害を壊しすぎずに意思決定を変える。

## 対象ステージ

P0では第1ステージだけを作る。

```text
Stage: 決済v2 Go/No-Go会議
Role: シニアエンジニア
Situation:
  明日、checkout_v2、請求書出力、customer_data_migration をリリース予定。
  CI失敗、PRコメント、staging障害ログ、顧客メール、ロールバック手順にズレがある。
Main Goal:
  全面リリースでも全面延期でもなく、必要機能だけを段階リリースする判断へ落とす。
```

## P0の画面構成

UIの具体デザインは次段階で詰める。P0では画面の役割だけ固定する。

```text
1. Prologue / Slack導入
2. Exploration / 資料探索
3. Meeting / 会議バトル
4. Result / リザルト
```

探索UIと会議バトルUIの詳細デザインは、このSPECでは固定しない。

## P0から外すもの

次はP0では実装しない。

- ピン留めシステム
- 議事録修正フェーズ
- プレイ中のPremise Lockゲージ表示
- プレイ中のバイアス名表示
- 数値スコア表示
- 全ラウンド共通の汎用コマンド表
- Round 4以外の複数証拠コンボ
- クリア後フローチャート
- キャラ育成
- セーブ/ロード
- 複数ステージ
- UIポリッシュ、立ち絵、サウンド

## 探索パート仕様

### 役割

探索パートの役割は、会議で使う証拠カードをプレイヤー自身に見つけさせること。

探索で検証したい体験は、資料を読んで「この発言、資料とズレている」と気づくこと。

### 資料の開放

探索資料は最初から全て読める。

```text
Slack導入
Jira BUG-418
PR Comment
CI Log
Staging Log
Customer Email
Rollback Procedure
Feature Flag Design
Past Incident Report
CPU Spike Log
```

ただしSlackは導入資料であり、証拠カード化しない。

### 証拠カード取得

証拠カードは、資料中の怪しい行をクリックして取得する。

固定事項:

- 1資料1カード
- 行単位クリック
- 常時ハイライトなし
- ホバー時だけクリック可能であることが分かる
- 重要行と罠行は見た目で区別しない
- クリック後、その行は取得済み表示に変わる
- 取得時は短い事実説明だけ表示する
- 用途ヒントは表示しない

例:

```text
取得: CI失敗ログ
legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。
```

表示しない例:

```text
これはTech Leadのflaky主張を崩す証拠です。
```

### 会議開始条件

会議開始には、Slackを除く証拠カードを2枚以上取得している必要がある。

```text
最大取得可能カード: 8枚
会議開始ゲート: 証拠カード2枚以上
罠カードも枚数に含める
会議開始後は探索に戻れない
```

会議開始前には、探索に戻れなくなることを明示する。

## 証拠カード仕様

P0の証拠カードは主要5枚、補助/罠3枚で構成する。

### 主要カード

| ID | 名前 | 主な役割 |
|---|---|---|
| `ci_legacy_failure` | CI失敗ログ | flaky前提を崩す |
| `customer_email_scope` | 顧客メール | 顧客要求の範囲を確認する |
| `rollback_procedure` | ロールバック手順 | customer_data_migrationの危険性を示す |
| `feature_flag_design` | Feature Flag設計 | 分割リリース可能性を示す |
| `staging_500_log` | staging障害ログ | CI失敗ログより強い実環境証拠 |

### 補助/罠カード

| ID | 名前 | 扱い |
|---|---|---|
| `pr_tax_category_comment` | PRコメント | 使えるが高リスク。Greatには不向き |
| `past_incident_report` | 過去障害報告 | QAへの共感補助。単独では前提解決しない |
| `cpu_spike_log` | CPUスパイクログ | P0では完全な罠カード |

### PRコメントの扱い

PRコメントは、事前に懸念が出ていたことを示す強い材料だが、Tech Leadの面子を潰しやすい。

```text
PRコメント + 設計ミスですよね
→ techlead_enemy = true

PRコメント + legacy条件だけ確認したい
→ techlead_enemy は立たない
→ ただし CI失敗ログ / staging障害ログ より弱い
```

### 過去障害報告の扱い

過去障害報告は、QAの懸念を理解する補助カードである。

```text
過去障害報告 + 共感
→ qa_enemy を避ける
→ meeting_breakdown_risk を抑える
→ qa_concern_understood = true
→ rollback_risk_resolved は立たない
→ qa_ally は単独では立たない
```

### staging障害ログの扱い

staging障害ログは、CI失敗ログより強いが探索で見つけにくいカードにする。

```text
CI失敗ログ:
  テスト上の条件付き再現を示す

staging障害ログ:
  実環境に近い場所で500が出ていることを示す
  flaky主張をより強く崩せる
```

### CPUスパイクログの扱い

CPUスパイクログはP0では完全な罠カード。

```text
取得はできる
会議開始ゲートの2枚には含まれる
どのラウンドで使っても前提解決しない
Round 2で使うとTech Leadに反撃される
meeting_breakdown_risk +1
場合によって support 相当の内部評価を下げる
```

## 会議バトル仕様

### ラウンド構成

P0の会議は5ラウンド固定。

```text
Round 1: PM 佐伯
  「前回と同じ」「ここまで来て止めるのは現実的ではない」

Round 2: Tech Lead 黒瀬
  「これはflaky test」

Round 3: Sales 桐谷
  「顧客には今月中と伝えている」

Round 4: QA 三村
  「全部止めるべき」

Round 5: CTO 榊
  最終判断
```

### 1ラウンド1アクション

Round 1からRound 4では、各ラウンド1アクションだけ行える。

1アクションは次の3段選択。

```text
1. 発言箇所
2. 証拠カード
3. 出し方
```

固定事項:

- 発言箇所は各ラウンド2から3個
- 出し方は各ラウンド3から4個
- 証拠カード欄には、所持カードに加えて「証拠なし」を選べる
- 出し方はラウンドごとの固定候補にする
- 全ラウンド共通コマンドにはしない

### 証拠なしの扱い

証拠なしでも会議中に発言はできる。

ただし、証拠なしでは前提解決フラグもAllyフラグも立たない。

```text
証拠なし + 良い出し方
→ enemy化を避ける
→ meeting_breakdown_risk を上げない
→ resolved は立たない
→ ally は立たない
```

### 部分成功

P0では部分成功を入れる。

#### 発言箇所がズレているが証拠は関連している

```text
enemy化を避ける
meeting_breakdown_risk は上げない
resolved は立たない
```

#### 証拠は正しいが出し方が攻撃的

```text
resolved は立つことがある
ただし enemy が立つ
meeting_breakdown_risk が上がる
```

例:

```text
Round 2:
CI失敗ログでflaky前提は崩れる。
ただし「設計ミスですよね」と攻めたため techlead_enemy = true。
```

#### 出し方は良いが証拠がない

```text
enemy化を避ける
resolved は立たない
ally は立たない
```

#### 発言箇所と出し方は良いが、証拠が補助カード

```text
Ally化はしない
敵化回避
補助評価フラグを立てる
```

例:

```text
Round 4:
過去障害報告 + 共感
→ qa_concern_understood = true
→ qa_ally = false
→ rollback_risk_resolved = false
```

## 内部状態

### 表示しない数値

P0では、プレイヤーに数値スコアを表示しない。

表示しない例:

```text
Safety: 80
Trust: 65
Clarity: 72
Heat: 4
```

内部判定にはフラグ条件式と補助スコアを使う。

### Heatの扱い

P0ではHeatを主システムから外す。

代わりに次を使う。

```text
sales_ally
qa_ally
techlead_enemy
sales_enemy
qa_enemy
meeting_breakdown_risk
```

`meeting_breakdown_risk` は、罵倒、責任追及、無関係な証拠、強引な論破で上がる。

`meeting_breakdown_risk` はGood解放条件には直接入れない。

```text
meeting_breakdown_risk >= 3:
  Great不可
  Good条件未達なら Bad: 会議決裂 に寄る
  Good条件達成済みなら Good は可能
  リザルトに「会議は荒れたが、分割案は通した」系の差分を出す
```

### 主要フラグ

P0で使う主要フラグ。

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

補助評価フラグの例。

```text
qa_concern_understood
pm_cost_pressure_understood
sales_pressure_understood
```

補助評価フラグはGood/Great条件には直接使わない。会議ログ、リザルト、決裂リスク抑制に使う。

## Round別の役割

### Round 1: PM

Round 1はチュートリアル兼、会議の空気作り。

Good/Great必須ではない。

役割:

- 「前回と同じ」主張を崩せると後続が少し楽になる
- PMを責めると `meeting_breakdown_risk` が上がる
- 成功してもGood/Greatの必須条件にはしない

### Round 2: Tech Lead

Goodでは `techlead_enemy != true` が必須。

Greatではさらに `flaky_resolved = true` が必須。

```text
Good:
  techlead_enemy != true

Great:
  techlead_enemy != true
  flaky_resolved = true
```

### Round 3: Sales

Round 3はGood/Greatともに実質必須。

```text
Good:
  customer_scope_resolved = true
  sales_enemy != true
  sales_ally は、qa_ally が立っていれば必須ではない

Great:
  sales_ally = true
```

営業を責めずに顧客メールでスコープ分解できた場合、`sales_ally = true` が立つ。

営業の成功反応例:

```text
請求書出力だけ今月中に出せるなら、説明はできます。
むしろ「決済フロー全体を出します」と言い切らない方が安全ですね。
```

### Round 4: QA

Round 4はGood/Greatともに実質必須。

```text
Good:
  rollback_risk_resolved = true
  または
  feature_flag_resolved = true
  かつ qa_enemy != true

Great:
  qa_ally = true
  rollback_risk_resolved = true
  feature_flag_resolved = true
```

Round 4だけ、複数証拠カードの組み合わせを許可する。

```text
ロールバック手順 + Feature Flag設計
→ rollback_risk_resolved = true
→ feature_flag_resolved = true
→ qa_ally = true
```

他のラウンドでは複数証拠コンボを許可しない。

### Round 5: CTO

Round 5は最終判断。

常時表示する選択肢:

```text
全面リリース
全面延期
```

条件解放する選択肢:

```text
分割リリース
分割リリース + Go/No-Go基準明文化
```

未解放選択肢はグレー表示しない。解放済みの選択肢だけ表示する。

## 分岐条件

### 分割リリース解放条件

分割リリース選択肢は、次の条件を満たしたときだけ表示する。

```text
customer_scope_resolved = true
かつ
(rollback_risk_resolved = true または feature_flag_resolved = true)
かつ
(sales_ally = true または qa_ally = true)
かつ
techlead_enemy != true
かつ
sales_enemy != true
かつ
qa_enemy != true
```

Tech Leadを敵に回した場合、P0では分割リリース不可。

### 全面リリース

全面リリースを選んだ場合は、常にBad。

理由:

```text
全面リリースは、危険な customer_data_migration まで出す判断だから。
```

リザルト差分:

- flakyも顧客スコープも未解決なら、強行リリース事故
- 顧客スコープは解決したのに全面リリースなら、不要な範囲まで出して事故
- rollbackリスクを知っていたのに全面リリースなら、既知リスクを押し切った事故

### 全面延期

全面延期は基本Normal。

ただし `meeting_breakdown_risk` が高い場合は、Bad寄りのNormal差分にする。

例:

```text
Normal: 全面延期
事故は避けられたが、会議は責任追及に寄り、営業と開発の溝が深まった。
```

### 分割リリース

分割リリースを選べた場合は、常にGood以上。

理由:

```text
選択肢が表示された時点で、最低限の材料と合意が揃っているため。
```

### Great条件

Greatは、分割リリースに加えて、会議運営と制度化まで成功した場合。

Great選択肢は、条件が揃ったときだけ表示する。

Great条件:

```text
Good条件
かつ
sales_ally = true
かつ
qa_ally = true
かつ
techlead_enemy != true
かつ
flaky_resolved = true
かつ
rollback_risk_resolved = true
かつ
feature_flag_resolved = true
かつ
meeting_breakdown_risk < 3
```

Round 5で `分割リリース + Go/No-Go基準明文化` を選ぶと、`governance_rule_selected = true` になりGreat確定。

## Greatで明文化するルール

Greatでは、次の3本をまとめて提示する。

```text
1. 同一条件で複数回落ちるCIはflaky扱いしない
2. ロールバック不能なwrite/migrationはGo/No-Go前に明示する
3. 顧客要求は「期限」だけでなく「必要機能の範囲」まで確認する
```

3本から選ばせない。P0ではまとめて制度化する。

## 会議ログ仕様

### 役割

議事録修正フェーズは外す。

その代わり、会議ログをリアルタイムに読み取り専用で表示する。

会議ログは、リザルトでそのまま振り返り表示する。

### 書く内容

会議ログは事実だけを書く。

書くもの:

- 誰が何を主張した
- プレイヤーが何を提示/質問した
- 何が確認された
- 何は確認されなかった
- 最終的にどの判断が選ばれた

書かないもの:

- 成功/失敗
- 危うい/まずいなどの誘導
- Premise Lock風の演出
- ゲーム側の判定文

例:

```text
黒瀬は、失敗しているテストを以前から不安定なものだと説明した。
プレイヤーはCI失敗ログを示し、legacy_plan=true / tax_category=null の条件を確認した。
黒瀬は、legacy条件に絞った追加確認が必要だと認めた。
```

未解決の場合も淡々と書く。

```text
桐谷は、顧客には今月中と伝えていると説明した。
このラウンドでは、顧客が必要としている機能範囲は確認されなかった。
```

### Premise Lockの扱い

P0ではPremise Lockをプレイ中システムとして見せない。

ゲージも数値も出さない。

未解決の前提は、会議ログとリザルトの「確認できなかった事実」に残す。

## リザルト仕様

### 表示するもの

リザルトでは、数値スコアを出さない。

表示する:

- Ending
- 最終判断
- 会議ログ
- 確認できた事実
- 確認できなかった事実
- 味方化/敵対の結果
- Great時に制度化されたルール
- 自然言語の振り返り
- 関連バイアス名

### 確認できた事実 / 確認できなかった事実

会議ログとは別に要約表示する。

例:

```text
確認できた事実:
- 顧客が今月中に必要としていたのは請求書出力だった。
- customer_data_migrationは完全ロールバック不可だった。

確認できなかった事実:
- CI失敗がflakyか、条件付き再現か。
- Feature Flagでどこまで分割できるか。
```

### バイアス名の扱い

バイアス名はプレイ中には出さない。

リザルトでは出してよい。

ただし、主見出しにはしない。まず自然言語の振り返りを書き、その下に関連バイアス名を添える。

例:

```text
判断を歪めた可能性のある前提:
- 前回と今回のCI失敗を同じ種類の警告として扱いかけた
  関連: 正常性バイアス / 確証バイアス

- 顧客の「今月中」という要望を、決済v2全体の期限として扱いかけた
  関連: アンカリング / フレーミング効果

- 過去障害の記憶から、すべて止める判断に寄りかけた
  関連: 利用可能性ヒューリスティック / 損失回避
```

## エンド一覧

### Bad

分類:

```text
全面リリース
または
Good条件未達かつ会議決裂リスクが高い
```

結果:

- legacy顧客のcheckoutが500になる
- rollbackが困難になる
- 会議が責任追及に寄る

### Normal

分類:

```text
全面延期
```

結果:

- 事故は避ける
- 顧客説明は重くなる
- PM/営業/開発の関係に差分が出る

### Good

分類:

```text
分割リリース
```

結果:

- invoice exportのみ段階リリース
- checkout_v2 UIは必要に応じてoff
- customer_data_migrationは延期
- 顧客約束と安全性を両立する

### Great

分類:

```text
分割リリース + Go/No-Go基準明文化
```

結果:

- Goodの結果に加えて、次回以降の判断基準が明文化される
- SalesとQAの両方を味方にできている
- Tech Leadを敵化していない
- flaky、rollback、feature flag、顧客スコープが整理されている

## P0受け入れ条件

P0は次を満たしたら最初の検証に出せる。

- Prologueで状況と人物の初期スタンスが分かる
- Slack以外の8資料を読める
- 資料の行クリックで証拠カードを取得できる
- 証拠カード2枚以上で会議を開始できる
- 会議開始後は探索に戻れない
- 5ラウンドを1アクションずつ進行できる
- 発言箇所、証拠カード、出し方の3段選択ができる
- Round 4で `ロールバック手順 + Feature Flag設計` コンボが使える
- Round 5で条件に応じた最終判断選択肢が表示される
- Bad / Normal / Good / Great に分岐する
- 会議ログが事実ログとして残る
- リザルトで、最終判断、確認できた事実、確認できなかった事実、関連バイアスを見られる

## 次段階で詰めるもの

このSPECでは次を意図的に未確定とする。

- 探索UIの具体的なレイアウト
- 会議バトルUIの具体的なレイアウト
- キャラ表示の有無
- 色、タイポグラフィ、ビジュアルトーン
- 実装技術選定
- YAML/JSONの最終スキーマ
- 各ラウンドの具体的な全選択肢テキスト
- 会議ログの全文
- リザルト文の全文

