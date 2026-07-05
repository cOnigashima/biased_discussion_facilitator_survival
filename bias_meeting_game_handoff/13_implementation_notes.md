# Implementation Notes

## MVP Implementation Goal

第1ステージをテキストADVとして動かす。まずはゲームエンジンに依存しない軽量プロトタイプでよい。

## Recommended First Prototype

### Option A: Web Prototype

- React / Next.js
- YAML/JSONでシナリオ定義
- ローカル状態で進行
- 画面：探索資料、証拠ボード、会議、議事録、リザルト

Pros:

- Codexで実装しやすい。
- UIの試行錯誤が速い。
- 将来Web配布しやすい。

### Option B: Ren'Py

- ADVの文脈が強い。
- 分岐と会話が作りやすい。

Cons:

- 資料探索UIや証拠ボードを作ると少し重い。

### Option C: Godot

- UIも演出も自由。
- 長期プロダクト化には可能性あり。

Cons:

- 初回検証には重い。

推奨：まずは **Web Prototype**。

## Minimal Screens

### 1. Document Browser

左に資料リスト、右に本文。本文内の重要箇所をクリックするとカード化。

```text
[Slack] [Jira] [PR] [CI] [Customer Email] [Rollback]
```

### 2. Evidence Board

集めたカード一覧。

- title
- source
- short summary
- confidence / relevance
- notes

### 3. Meeting Battle Screen

```text
Current Speaker / Current Claim
Targetable Phrases
Evidence Cards
Actions
Meeting Params
Minutes Panel
```

### 4. Minute Revision Screen

自動議事録ドラフトの誤った箇所をクリックし、証拠を当てる。

### 5. Result Screen

- Ending
- Safety / Delivery / Trust / Clarity / Learning
- Used Evidence
- Missed Premises
- Unlocked Alternative Routes

## Suggested Data Architecture

```text
Scenario
├── Characters
├── Documents
├── Evidence Cards
├── Claims
├── Actions
├── Rounds / Nodes
├── Conditions
├── Effects
└── Endings
```

## TypeScript Type Draft

```ts
type ParamKey = 'heat' | 'clarity' | 'support' | 'time';
type Momentum = 'release' | 'stop' | 'split_candidate' | 'split' | 'blame' | 'conflict';

type GlobalState = {
  heat: number;
  clarity: number;
  support: number;
  time: number;
  momentum: Momentum;
  premiseLock: Record<string, number>;
  flags: Record<string, boolean>;
};

type Character = {
  id: string;
  name: string;
  role: string;
  stance: string;
  params: {
    confidence: number;
    defensiveness: number;
    face: number;
    anxiety: number;
    authority: number;
    trustToPlayer: number;
  };
  hiddenGoal: string;
  biases: string[];
};

type Evidence = {
  id: string;
  title: string;
  source: string;
  text: string;
  credibility: number;
  specificity: number;
  aggression: number;
  ambiguity: number;
  misuseRisk: number;
  relevance: Record<string, number>;
  unlocks?: string[];
};

type Claim = {
  id: string;
  speakerId: string;
  text: string;
  targetPhrases: TargetPhrase[];
};

type TargetPhrase = {
  phrase: string;
  issue: string;
  bestEvidence?: string;
  bestAction?: string;
};

type Choice = {
  id: string;
  label: string;
  requires?: Condition[];
  effects: Effect[];
  responseText?: string;
  nextNodeId: string;
};
```

## State Update Logic

A choice should:

1. Validate requirements.
2. Apply global parameter changes.
3. Apply character parameter changes.
4. Set flags.
5. Update premise lock or resolved nodes.
6. Append to meeting minutes.
7. Choose next node.

Pseudo-code:

```ts
function applyChoice(state: GameState, choice: Choice): GameState {
  if (!requirementsMet(state, choice.requires)) {
    return applyFailedChoice(state, choice);
  }

  const next = clone(state);
  for (const effect of choice.effects) {
    applyEffect(next, effect);
  }

  updateDerivedState(next);
  return next;
}
```

## Derived State Ideas

```ts
if (state.heat >= 5) state.flags.meetingBreakdown = true;
if (state.clarity >= 7 && state.support >= 4) state.flags.greatCandidate = true;
if (premiseLock.flaky_test >= 3) state.flags.flakyLocked = true;
```

## Minute System

### Draft Generation

Minute entries can be generated from unresolved or locked premises.

```ts
if (!resolved.flaky_test && premiseLock.flaky_test >= 2) {
  minutes.push('CI失敗は既知のflaky testと判断。');
}
```

### Revision

A revision is a pairing of draft phrase and evidence.

```ts
type MinuteCorrection = {
  draftPhraseId: string;
  evidenceId: string;
  successEffect: Effect[];
  failureEffect: Effect[];
};
```

## UI Details

### Targetable Phrase UI

発言内のターゲット可能箇所をspanで分ける。

```html
<span data-target="same_as_last_time">前回も似た警告</span>
```

### Evidence Drag/Click

MVPはクリック選択でよい。

1. Phraseをクリック。
2. Evidenceをクリック。
3. Actionをクリック。
4. Confirm。

### Meeting Params Display

最初は数値でよいが、将来的には自然言語表示。

```text
Heat: 2/5
Clarity: 4/8
Support: 3/5
Momentum: Release寄り → Split候補
```

## Prototype Content Loading

Use YAML/JSON files:

```text
/content/stages/go_no_go_payment_v2.yaml
/content/stages/go_no_go_payment_v2.documents.yaml
/content/stages/go_no_go_payment_v2.dialogue.yaml
```

## Testing Scenarios

1. Perfect path:
   - CI comparison
   - face-saving techlead response
   - customer email
   - rollback + feature flag
   - minute correction
   - Great ending

2. Bad release path:
   - ignore PM
   - accept flaky
   - accept customer full scope
   - ignore rollback
   - full release

3. Meeting breakdown path:
   - call biases directly
   - accuse Tech Lead
   - blame Sales
   - call QA overreaction

4. Full delay path:
   - agree with QA
   - do not scope customer requirement

## Implementation Backlog for MVP

P0:

- Load scenario JSON/YAML.
- Document browser.
- Evidence acquisition.
- 5-round meeting battle.
- Global params.
- Ending calculation.

P1:

- Pinned statements.
- Premise Lock.
- Minute revision.
- Relationship flags.
- Result breakdown.

P2:

- Flowchart screen.
- Better UI animations.
- Character portraits.
- Bias glossary unlocks.
- Save/load.

## Open Implementation Questions

- 手動ハイライトで証拠取得にするか、資料閲覧で自動取得にするか。
- バトルで「発言箇所」「証拠」「出し方」の3段選択を毎回やると重くないか。
- 議事録修正を毎ステージ入れるか、重要ステージだけにするか。
- パラメータをどこまでUIに出すか。
- フローチャートをクリア後に見せるか、常時見せるか。
