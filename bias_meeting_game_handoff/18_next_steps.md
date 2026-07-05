# Recommended Next Steps

## Immediate Next Step

第1ステージ「決済v2 Go/No-Go会議」のテキストプロトタイプを作る。

順番：

1. 探索資料を確定する。
2. 証拠カードを確定する。
3. 5ラウンドの会議を実装する。
4. エンディング判定を入れる。
5. プレイして、資料探索が面白いか確認する。
6. その後にピン留め、Premise Lock、議事録修正を足す。

## Suggested Implementation Plan

### Step 1: Static Text Prototype

- MarkdownまたはHTMLだけで、探索資料と会議選択肢を読む。
- 手動でルートを追える程度でもよい。

Goal:

- シナリオの流れが面白いか確認。

### Step 2: Interactive Web Prototype

- Reactなどで簡単なUIを作る。
- YAML/JSONから読み込む。
- 状態値を更新する。

Goal:

- 発言ターゲット、証拠、出し方の操作感を確認。

### Step 3: Add Meeting Minutes

- 発言をピン留めできる。
- 放置すると議事録に残る。
- 最後に議事録修正。

Goal:

- 議事録ベースの戦略性が面白いか確認。

### Step 4: Playtest

- エンジニア/PM/QA/SREに遊んでもらう。
- どこで「あるある」と感じたかを見る。
- どこで退屈したかを見る。

### Step 5: Second Stage Decision

第2ステージ候補：

1. ブリリアントジャーク対策
2. アーキテクチャレビュー
3. ポストモーテム裁判

推奨：第2ステージは **ブリリアントジャーク対策**。

理由：

- キャラが立つ。
- 単なる技術判断ではなく、人間関係と評価が絡む。
- Stage 1の「リリース判断」と違う面白さを検証できる。

## Questions to Discuss Next

1. 第1ステージのバトルを「発言箇所 → 証拠 → 出し方」の3段にするか。
2. ピン留めをMVPから入れるか、後から入れるか。
3. 議事録修正を第1ステージの締めにするか。
4. Heat/Clarity/SupportをUIで見せるか。
5. 探索資料は自動カード取得か、プレイヤーがハイライトするか。
6. 第1ステージのテキスト量をどれくらいにするか。
7. プレイヤーが完全に正解しなくてもGoodに行けるようにするか。
8. Great条件を厳しすぎないようにするにはどうするか。

## Concrete Codex Task Ideas

### Task A: Create a React Prototype

```text
Create a simple React/Next.js prototype for a text adventure meeting battle game.
Use the provided YAML data model.
Implement a document browser, evidence card list, meeting battle screen, global params, and ending calculation for Stage 1.
No styling polish needed. Focus on functionality.
```

### Task B: Convert YAML to JSON Content

```text
Convert 11_data_model.yaml and 12_flowchart_nodes.yaml into a clean JSON format suitable for a web game prototype.
Split into characters.json, evidence.json, claims.json, nodes.json, endings.json.
```

### Task C: Expand Stage 1 Script

```text
Using 09_stage1_go_no_go_spec.md and 10_stage1_dialogue_and_choices.md, expand every round into playable dialogue.
For each choice, include player line, NPC response, parameter effects, flags, and minute changes.
Keep the tone realistic for a software development Go/No-Go meeting.
```

### Task D: Implement Minute Revision

```text
Implement a minute revision phase where the player clicks an incorrect draft minute item and selects evidence to correct it.
Use the corrections defined in 12_flowchart_nodes.yaml.
```

## Recommended MVP Acceptance Criteria

The MVP is good enough for first testing when:

- It can be completed in 15〜20 minutes.
- It has at least 4 endings.
- At least 5 evidence cards matter.
- At least 1 trap evidence can be misused.
- At least 1 route rewards not immediately objecting.
- At least 1 route turns an apparent opponent into an ally.
- The player can end with a concrete decision, not just a score.

## Keep Open

Do not over-lock the game into a single genre yet. The strongest form may still be one of these:

- 逆転裁判寄りの発言突きつけADV
- ダンガンロンパ寄りの会議中タイミングバトル
- Detroit寄りのフローチャート分岐ADV
- Papers, Please寄りのドキュメント読解ゲーム
- 組織デバッグRPG

The first prototype should answer which direction has the strongest pull.
