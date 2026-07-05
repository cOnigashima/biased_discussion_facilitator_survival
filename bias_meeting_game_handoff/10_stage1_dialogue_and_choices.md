# Stage 1 Dialogue and Choices

## Battle UI Assumption

各ラウンドで以下を選ぶ。

```text
1. 狙う発言箇所
2. 使うカード
3. 出し方
```

出し方の例：

- 強く反論
- 比較質問
- 共感してから提示
- 退路提示
- 議事録にピン留め
- 味方に振る

## Round 1: PM 佐伯

### 発言

```text
PM 佐伯:
ここまで来て止めるのは現実的じゃないです。
前回も似た警告は出ましたけど、結局問題ありませんでしたよね。
```

### Targetable Phrases

| Phrase | Hidden Issue |
|---|---|
| ここまで来て | サンクコスト |
| 止めるのは現実的じゃない | 二択化、代替案不足 |
| 前回も似た警告 | 正常性、同一視 |
| 問題ありませんでした | 結果からの過信 |

### Choices

#### Choice A: バイアス名を指摘

```text
Player:
それは正常性バイアスです。
```

Effect:

```yaml
heat: +2
pm_defensiveness: +2
trust: -1
clarity: 0
```

PM Response:

```text
PM 佐伯:
バイアスとかの話ではなくて、現実的に明日出せるかの話をしています。
```

#### Choice B: 比較質問 with CI失敗ログ

```text
Player:
前回と今回の失敗条件を比較したいです。
前回はログイン周りのtimeoutでしたが、今回は legacy_plan=true の決済migrationで落ちています。
これを同じ警告として扱ってよいか、差分を確認しませんか？
```

Effect:

```yaml
clarity: +2
pm_confidence: -1
support: +1
same_as_last_time: resolved_partial
time: -1
```

PM Response:

```text
PM 佐伯:
……対象が違うなら、同じとは言い切れないですね。
```

#### Choice C: 強く反論 with CI失敗ログ

```text
Player:
同じではありません。今回のログを見れば分かります。
```

Effect:

```yaml
clarity: +1
heat: +1
pm_defensiveness: +1
pm_confidence: -1
```

PM Response:

```text
PM 佐伯:
そこまで断言するなら、何が違うのか説明してください。
```

#### Choice D: ピン留め

```text
System:
「前回も似た警告」を議事録にピン留めしました。
```

Effect:

```yaml
pinned_statements: [pm_same_as_last_time]
premise_lock_same_as_last_time: +1
```

Note:

後のTech Lead発言とCIログを組み合わせると強い。

#### Choice E: 放置

Effect:

```yaml
premise_lock_same_as_last_time: +2
momentum: release
```

Minute Draft Adds:

```text
- 前回と同様の軽微な警告と認識。
```

## Round 2: Tech Lead 黒瀬

### 発言

```text
Tech Lead 黒瀬:
このテストは前から不安定です。
実装の問題というより、テスト側の問題だと思います。
```

### Targetable Phrases

| Phrase | Hidden Issue |
|---|---|
| 前から不安定 | flaky扱いの根拠が弱い |
| 実装の問題ではない | 条件付き実バグの可能性を除外している |
| テスト側の問題 | 責任をテストへ移している |

### Choices

#### Choice A: CIログ + 条件確認

```text
Player:
flakyかどうかを見るなら、失敗条件が散っているかを確認したいです。
CIでは legacy_plan=true かつ tax_category=null のケースで揃っています。
これは不安定なテストというより、特定条件の実バグではありませんか？
```

Effect:

```yaml
clarity: +2
techlead_confidence: -2
flaky_test: resolved_partial
support: +1
```

Tech Lead Response:

```text
Tech Lead 黒瀬:
その条件に寄っているなら、追加確認は必要ですね。
```

#### Choice B: CIログ + 退路提示

```text
Player:
設計全体を問題にしたいわけではないです。
ただ、legacy顧客の tax_category=null だけ条件漏れしている可能性を見たいです。
```

Effect:

```yaml
clarity: +2
techlead_defensiveness: -1
techlead_confidence: -1
support: +1
```

Tech Lead Response:

```text
Tech Lead 黒瀬:
legacy条件に絞るなら、確認しましょう。
```

#### Choice C: PRコメントを突きつける

```text
Player:
PRでも同じ懸念が出ていますよね。これは設計ミスでは？
```

Effect:

```yaml
clarity: +2
heat: +2
techlead_defensiveness: +2
techlead_face_damage: +2
```

Tech Lead Response:

```text
Tech Lead 黒瀬:
そのコメントは通常フローの前提で回答しています。設計ミスと決めつけるのは違います。
```

#### Choice D: CPUスパイクログを出す

```text
Player:
stagingでCPUスパイクも出ています。
```

Effect:

```yaml
trust: -1
heat: +1
techlead_authority: +1
clarity: -1
```

Tech Lead Response:

```text
Tech Lead 黒瀬:
それは別チームの負荷テストです。今回のmigrationとは関係ありません。
```

#### Choice E: ピン留め済みPM発言 + CIログコンボ

Condition:

```yaml
requires: pinned.pm_same_as_last_time
```

```text
Player:
さきほど佐伯さんは「前回と同じ」と言いました。
黒瀬さんは「flaky」と見ています。
ただ、CIでは legacy_plan=true かつ tax_category=null で揃って落ちています。
前回と同じでも、ランダムなflakyでもなく、特定条件の実バグとして扱うべきではないでしょうか。
```

Effect:

```yaml
clarity: +3
support: +2
pm_confidence: -1
techlead_confidence: -2
momentum: split_candidate
```

## Round 3: Sales 桐谷

### 発言

```text
営業 桐谷:
顧客には今月中に出すと伝えています。
ここで延期したら信用を失います。
```

### Choices

#### Choice A: 顧客メール + スコープ分解

```text
Player:
顧客メールでは、今月中に必要なのは請求書出力です。
新しい決済フロー全体は来月初旬でも問題ないとあります。
つまり、顧客約束を守る方法は「全部出す」以外にもあります。
```

Effect:

```yaml
clarity: +2
sales_trust: +1
support: +1
customer_needs_all_features: resolved
momentum: split_candidate
```

Sales Response:

```text
営業 桐谷:
請求書出力だけ出せるなら、説明はできます。
```

#### Choice B: 営業を責める

```text
Player:
それは営業が勝手に約束しただけですよね。
```

Effect:

```yaml
heat: +2
sales_defensiveness: +2
support: -1
momentum: blame
```

Sales Response:

```text
営業 桐谷:
勝手にではありません。先週の会議で今月中という話になっていました。
```

#### Choice C: 事故リスクで押す

```text
Player:
事故が起きたらもっと信用を失います。
```

Effect:

```yaml
clarity: +1
heat: +1
sales_defensiveness: +1
```

Sales Response:

```text
営業 桐谷:
それは分かります。でも延期の説明も現実に必要です。
```

## Round 4: QA 三村

### 発言

```text
QA 三村:
それでも危険です。全部止めるべきです。
前回もこういう軽視から障害になりました。
```

### Choices

#### Choice A: 共感 + リスク分割

```text
Player:
三村さんの懸念は正しいと思います。
ただ、止める対象を全部にする必要があるかは分けたいです。
ロールバック不能なのは customer_data_migration です。
請求書出力は切り戻せます。
```

Effect:

```yaml
qa_trust: +1
clarity: +2
support: +1
stop_everything: resolved_partial
rollback_risk: resolved_partial
momentum: split
```

QA Response:

```text
QA 三村:
migrationを止めるなら、その案ならレビューできます。
```

#### Choice B: 「過剰反応」と言う

```text
Player:
全部止めるのは過剰反応です。
```

Effect:

```yaml
heat: +2
qa_defensiveness: +2
qa_trust: -1
momentum: conflict
```

QA Response:

```text
QA 三村:
過剰反応で済むならいいですが、前回もそう言って本番で落ちました。
```

#### Choice C: QAに全面的に乗る

```text
Player:
三村さんの言う通り、全部止めましょう。
```

Effect:

```yaml
qa_trust: +1
sales_trust: -1
pm_defensiveness: +1
cto_satisfaction: -1
momentum: stop
```

Potential Ending:

- Normal: 全面延期

#### Choice D: Feature Flag + ロールバック手順で分割案

```text
Player:
checkout_v2 UIはfeature flagでoffにできます。
invoice exportは旧フォーマットに戻せます。
ただ、customer_data_migrationは完全ロールバック不可です。
なので、migrationは止める。invoice exportだけ段階リリースする案が現実的だと思います。
```

Effect:

```yaml
clarity: +3
support: +2
qa_trust: +1
sales_trust: +1
momentum: split
unlock: final_split_release
```

## Round 5: CTO 榊

### 発言

```text
CTO 榊:
では、結論としてどうしたいんですか？
```

### Final Choices

#### Choice A: 全面リリース

```text
Player:
予定通り全面リリースします。
```

Ending:

```yaml
ending: bad_full_release
```

#### Choice B: 全面延期

```text
Player:
安全を優先して全面延期します。
```

Ending:

```yaml
ending: normal_full_delay
```

#### Choice C: 分割リリース

Condition:

```yaml
requires:
  - customer_email_scope_used
  - rollback_risk_resolved
  - feature_flag_design_used
```

```text
Player:
今回は invoice export のみ段階リリースします。
checkout_v2 UI は feature flag off。
customer_data_migration は延期します。
```

Ending:

```yaml
ending: good_split_release
```

#### Choice D: 分割リリース + Go/No-Go基準化

Condition:

```yaml
requires:
  - split_release_unlocked
  - heat <= 3
  - support >= 4
  - clarity >= 7
  - minute_revision_success
```

```text
Player:
今回は invoice export のみ段階リリースします。
checkout_v2 UI は feature flag off。
customer_data_migration は延期します。
加えて、次回からロールバック不能な変更はGo/No-Go前に明示します。
同一条件で3回以上落ちるCIはflaky扱いしないルールにしたいです。
```

Ending:

```yaml
ending: great_split_release_with_rule
```

## Minute Revision Phase

### Bad-Leaning Draft

```text
自動議事録ドラフト:
- CI失敗は既知のflaky testと判断。
- 顧客都合により今月中のリリースが必要。
- QA懸念はあるが、影響範囲は限定的。
- 予定通りGo。
```

### Revision Targets

| Draft Phrase | Correct Evidence |
|---|---|
| 既知のflaky test | CI失敗ログ, staging障害ログ |
| 顧客都合により今月中のリリースが必要 | 顧客メール |
| 影響範囲は限定的 | ロールバック手順 |
| 予定通りGo | Feature Flag設計 + 分割案 |

### Great Revised Minute

```text
最終議事録:
- CI失敗は legacy_plan=true かつ tax_category=null で再現しており、flakyとは扱わない。
- 顧客が今月中に必要としているのは請求書出力であり、新決済フロー全体ではない。
- ロールバック不能なのは customer_data_migration である。
- 決定: invoice exportのみ段階リリース。
- checkout_v2 UI は feature flag off。
- customer_data_migration は延期。
- 次回以降、ロールバック不能な変更はGo/No-Go前に明示する。
- 同一条件で3回以上落ちるCIはflaky扱いしない。
```
