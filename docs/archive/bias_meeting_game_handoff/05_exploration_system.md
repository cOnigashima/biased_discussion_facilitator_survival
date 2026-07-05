# Exploration System

## Purpose

探索パートは、会議バトルのための武器を集めるだけでなく、プレイヤーに「資料のズレを読んでいる」感覚を与える部分。

プレイヤーは、開発現場にある複数の資料を読み、以下を見つける。

- 発言と資料の矛盾
- 事実と推測の混同
- リスクの見落とし
- 過去の懸念コメント
- 顧客要求の実際の範囲
- ロールバックできない変更
- 罠資料や無関係なログ
- キャラの利害と恐れ

## Document Types

| Document | What It Reveals | Gameplay Use |
|---|---|---|
| Slack | 温度感、圧力、言い訳、認識ズレ | 発言カード、人物利害 |
| Jira | 未解決チケット、優先度、コメント | リスクの実体、優先度の誤分類 |
| GitHub PR | 設計懸念、無視されたレビュー | Tech Leadや設計主張への証拠 |
| CI Log | flakyか再現性か | 技術的矛盾を撃つ |
| Staging Log | 実行時エラー、条件付き再現 | 実バグの根拠 |
| Customer Email | 顧客が本当に必要な範囲 | 営業圧の分解 |
| Rollback Procedure | 戻せる/戻せない変更 | Go/No-Goの核心 |
| Feature Flag Design | 分割リリース可能性 | 第三案の材料 |
| Past Incident Report | 似た兆候の軽視履歴 | 正常性バイアスへの材料 |
| Meeting Memo | 過去合意、未検証前提 | 議事録修正、後知恵対策 |
| 1on1 Memo | 不安、評価、摩擦 | EM編、ブリリアントジャーク編 |
| Proposal Deck | フレーミング、アンカリング | コンサル/顧問編 |

## Exploration Interaction Ideas

### Simple Reading

資料を読むだけ。重要箇所がハイライトされ、カードになる。

- Pros: 実装しやすい。MVP向き。
- Cons: 読むだけで退屈になる可能性。

### Manual Highlighting

プレイヤーが資料内の怪しい箇所を選んでカード化する。

```text
CIログの `legacy_plan=true` と `tax_category=null` を選ぶ
→ CI失敗ログカード生成
```

- Pros: 見つけた感が強い。謎解き感が増す。
- Cons: UI実装と判定が少し難しい。

### Link Two Documents

2つの資料を関連づける。

```text
PRコメント「tax_category が null の場合は？」
+ CIログ「tax_category=null で失敗」
→ 条件漏れカード生成
```

- Pros: 推理感が強い。バトル前から面白い。
- Cons: 作問が必要。

### Red Herring Handling

一見重要そうだが関係ない資料を混ぜる。

例：

- CPUスパイクログ
- 顧客の怒りメールだが別機能への怒り
- 古い障害報告だが原因が違う

## Card Types

| Type | Description | Example |
|---|---|---|
| Evidence | 会議で使える証拠 | CI失敗ログ |
| Context | キャラの背景を読む | QAが前回責められた1on1メモ |
| Premise | 論点になる前提 | 「顧客は全機能を必要としている」 |
| Trap | 関係が薄い資料 | CPUスパイクログ |
| Combo | 複数資料から生成 | PR懸念 + CI失敗 = 条件漏れ |

## Evidence Card Parameters

| Parameter | Meaning |
|---|---|
| relevance | どの発言に刺さるか |
| credibility | ソースとしての強さ |
| specificity | 具体性 |
| aggression | 出すと相手の面子を潰す度合い |
| ambiguity | 解釈余地 |
| misuse_risk | 間違って出したときの被害 |
| unlocks | 解放する論点/選択肢 |

## Stage 1 Documents

### Slack: `#release-check`

- PMは前回と今回を同一視している。
- Tech Leadはflaky扱いしている。
- QAはlegacy条件での再現を主張している。
- 営業は顧客約束を強く意識している。

### Jira: `BUG-418`

- P2扱いだが、実際は決済不能に近い可能性。
- QAはstagingで3回再現済み。
- Tech Leadはcleanupで対応可能と見ている。

### PR Comment

- 懸念は事前に出ていた。
- Authorは「通常フローでは必須」としているが、legacy顧客を見落としている可能性。

### CI Log

- `legacy_plan=true`, `tax_category=null`, `invoice_export_enabled=true` で失敗。
- flakyではなく条件付き再現の可能性。

### Customer Email

- 今月中に必要なのは請求書出力。
- 新決済フロー全体は来月初旬でもよい。
- 営業の「全部今月中」は過剰解釈。

### Rollback Procedure

- checkout_v2 UIはfeature flagでoff可。
- invoice exportは旧フォーマットへ切り戻し可。
- customer_data_migrationは完全ロールバック不可。
- 危険なのはmigration。

### Feature Flag Design

- checkout_v2 UIとinvoice exportを分けて制御可能。
- 第三案の材料。

### Past Incident Report

- 3か月前、似た兆候を軽視して障害。
- ただし原因が完全に同じではないため、雑に使うと反撃される。

### Red Herring: CPU Spike Log

- CPUスパイクがあるが今回のmigrationとは直接関係が薄い。
- 使うとTech Leadに「別チームの負荷テストです」と反撃される。

## Evidence Board UX

資料から拾ったカードをボードに並べる。

```text
[CI失敗ログ] ── related to ── [Tech Lead: flaky]
[顧客メール] ── contradicts ── [営業: 全機能が今月必要]
[ロールバック手順] ── unlocks ── [分割リリース案]
```

## Character Notes

人物ごとにメモが溜まる。

```text
PM 佐伯:
- リリースしたい
- 前回と今回を同一視
- 延期による評価低下を恐れている可能性

QA 三村:
- 前回障害で責められた
- 証拠は持っている
- ただし全面停止に寄りすぎ
```

## Exploration Risks

| Risk | Mitigation |
|---|---|
| 資料が長すぎる | MVPでは短文・要点中心 |
| 正解箇所が分かりにくい | 初回はハイライト補助あり |
| 罠が理不尽 | 罠にも「なぜ罠か」が後で分かるようにする |
| エンジニア以外に難しい | UI上で用語補足を入れる |
| エンジニアには簡単すぎる | 中盤以降はログや設計の関連付けを難しくする |
