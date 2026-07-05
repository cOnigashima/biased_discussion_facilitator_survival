# Grilling Questions

Status: Draft v0  
Date: 2026-07-05

## Purpose

このドキュメントは、P0実装のシステム設計で決めるべき質問リストである。

ユーザーに都度大量の質問を投げないため、論点を一覧化し、各質問に推奨回答を添える。以後のターンでは、このリストから優先度順に数個ずつ決める。

## Round 1: Architecture Decisions

Decision status:

- Q1: Adopted. Vite + React + TypeScript.
- Q2: Adopted for P0. 初期はTypeScript構造化データ。
- Q3: Adopted for P0. `useReducer` + pure rules functions.
- Q4: Adopted for P0. 1360x860デスクトップUIをカンプ寄せ。
- Q5: Adopted for initial implementation. タイマーUIは表示、強制タイムアウトなし。
- Q6: Adopted for P0. 明示ルールテーブル方式。

### Q1. 技術スタックは何にするか

推奨回答:

Vite + React + TypeScript。

理由:

- 既存アプリコードがないため、軽量に始められる
- カンプがWeb UIなので相性がよい
- P0はSSRやバックエンドを必要としない
- ルール層をTypeScriptで型付けしやすい
- Playwrightで画面確認しやすい

代替:

- Next.js: ルーティングや公開基盤を早めに見据えるならあり。ただしP0には少し重い。
- Svelte: 軽量だが、チーム/将来の実装者のReact慣れを優先するならReactが無難。
- Ren'Py/Godot: 長期ゲーム化では候補だが、資料探索UIとWebカンプ再現には初手として重い。

### Q2. シナリオデータはどの形式で持つか

推奨回答:

まずはTypeScriptの構造化データとして持ち、Zodなどでスキーマ検証する。外部JSON/YAML化はP0が動いてからでよい。

理由:

- P0ではデータ構造がまだ変わる
- TypeScriptならID参照や分岐条件を壊しにくい
- JSON/YAMLを早期に正本化すると、スキーマ変更のたびに編集コストが上がる

ただし、設計上は将来JSON/YAMLへ切り出せる境界を作る。

### Q3. 状態管理はどうするか

推奨回答:

外部状態管理ライブラリを入れず、まずは `useReducer` + pure rules functions で実装する。

理由:

- P0の状態は1プレイセッション内で完結する
- 主要状態はフェーズ、取得証拠、ラウンド、選択中アクション、内部フラグ、会議ログに限定できる
- reducerをテストしやすい
- XStateなどの導入は、分岐が増えるP1以降で判断できる

### Q4. UIはどこまでカンプ忠実にするか

推奨回答:

P0実装では、レイアウト・密度・色・情報設計はカンプに寄せる。ただしピクセル完全一致より、状態遷移が壊れないコンポーネント分解を優先する。

理由:

- カンプはHigh-fidelityなので体験の方向性はほぼ確定している
- 一方で、HTMLは静的状態の縦積みであり、そのまま移植すると保守しづらい
- まず1360x860基準のデスクトップ体験を安定させるべき

### Q5. Roundタイマーは本当に実時間で動かすか

推奨回答:

最初の実装では、タイマーUIは表示するが、実時間で強制タイムアウトさせない。プレイテスト後に必要なら有効化する。

理由:

- P0の核は資料と発言のズレを読むこと
- 初回プレイヤーは資料理解に時間がかかる
- 強制タイムアウトは読み物ADVとしての検証を邪魔する可能性がある
- 仕様の受け入れ条件にはタイムアウトが明記されていない

### Q6. ルール判定は汎用スコア式にするか、明示テーブルにするか

推奨回答:

P0は明示テーブルにする。

理由:

- P0仕様はラウンドごとの意味が固定されている
- Good/Great条件はフラグ式で明確
- 「正しい証拠だが出し方が攻撃的」などの部分成功を個別に書きやすい
- 汎用スコア式にすると、意図しない抜け道や説明不能な判定が出やすい

## Round 2: Data and Rules

### Q7. EvidenceCardとDocumentLineをどう結びつけるか

推奨回答:

Document内に `lines` を持ち、証拠化できる行だけ `evidenceId` を持たせる。

実装イメージ:

```ts
type DocumentLine = {
  id: string;
  text: string;
  evidenceId?: EvidenceId;
  isTrap?: boolean;
};
```

UIは `evidenceId` の有無だけでクリック可能性を判定する。ただし常時ハイライトはしない。

### Q8. Round actionの判定キーは何にするか

推奨回答:

`roundId + targetId + evidenceSelection + deliveryId` を判定キーにする。

理由:

- P0の3段選択に素直に対応する
- R4だけ `evidenceSelection` を配列にできる
- 「発言箇所はズレているが証拠は関連」などの部分成功を表現できる

### Q9. R4の複数証拠コンボはどう表現するか

推奨回答:

通常ラウンドは証拠1枚、R4だけ最大2枚を許可する。ルール層では `EvidenceSelection = EvidenceId[] | 'none'` として統一する。

P0で有効なGreat系コンボ:

```text
rollback_procedure + feature_flag_design
```

この組み合わせで以下を立てる。

```text
rollback_risk_resolved = true
feature_flag_resolved = true
qa_ally = true
```

### Q10. 会議ログはどこで生成するか

推奨回答:

ActionResolutionの結果としてルール層で生成する。

理由:

- 会議ログはリザルトにも使う
- UIコンポーネントにログ文を持たせると、判定と表示が分離して壊れやすい
- P0仕様ではログは「事実だけ」と明確なので、ルール結果として管理しやすい

### Q11. ResultSummaryは動的生成か、エンド別テンプレートか

推奨回答:

エンド別テンプレート + フラグ差分の挿入。

理由:

- Bad/Normal/Good/Greatの骨格は固定
- ただし未解決事実や関係結果はプレイ内容で変わる
- 完全動的生成より、読み物としての品質を担保しやすい

## Round 3: UI and UX

### Q12. モバイル対応はP0に入れるか

推奨回答:

P0では入れない。1360x860基準のデスクトップUIを優先する。

理由:

- 資料探索と会議ログの情報量が多い
- デザインカンプもデスクトップ固定
- モバイル最適化はUI再設計に近く、P0検証のコストを上げる

### Q13. 資料アプリは全て個別コンポーネントにするか

推奨回答:

共通 `DocumentWindow` + `document.kind` ごとの軽い表示差分にする。

理由:

- カンプ上は各アプリの見た目が異なる
- ただしP0の機能は「読む」「行をクリックして証拠化する」に集約できる
- 全アプリを完全個別実装すると工数が膨らむ

### Q14. 鳥アバターはどう扱うか

推奨回答:

P0ではカンプ通りCSSのプレースホルダーで実装する。

理由:

- 立ち絵はP0外
- 参加者の識別には十分
- 後で画像アセットに差し替えられる

### Q15. 証拠カード取得時のフィードバックはどうするか

推奨回答:

短い取得モーダル/トーストを表示し、用途ヒントは出さない。

表示する:

```text
取得: CI失敗ログ
legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。
```

表示しない:

```text
これはTech Leadのflaky主張を崩す証拠です。
```

## Round 4: Implementation Boundaries

### Q16. セーブ/ロードなしでリロード時はどうするか

推奨回答:

P0ではリロードで最初から。必要なら開発用にlocalStorageデバッグだけ後で入れる。

### Q17. テストはどこまで書くか

推奨回答:

ルール層のユニットテストを優先する。UIは主要導線だけPlaywrightで確認する。

最低限テストする導線:

- 証拠2枚未満では会議開始できない
- 証拠2枚以上で会議開始できる
- Great条件を満たすとGreat選択肢が出る
- Tech Lead敵化時は分割リリースが出ない
- 全面リリースは常にBad
- 全面延期はNormal
- R4コンボで `rollback_risk_resolved` と `feature_flag_resolved` と `qa_ally` が立つ

### Q18. P0の最初の実装マイルストーンは何にするか

推奨回答:

見た目より先に、最小UIでエンド分岐まで通す。

順序:

1. シナリオデータと型
2. reducer / rules
3. 探索で証拠取得
4. 会議5ラウンド
5. R5最終判断とエンド分岐
6. リザルト表示
7. カンプ寄せのUI作り込み

理由:

ゲームとして成立するかは、見た目より先に「選択がフラグと結末を変えるか」で確認できる。

## First Discussion Set

次のターンで最初に決める候補:

1. 技術スタックは `Vite + React + TypeScript` でよいか
2. シナリオデータは初期TS構造化データでよいか
3. 状態管理は `useReducer + pure rules` でよいか
4. タイマーは初期実装では強制しない方針でよいか
5. UIはデスクトップ1360x860優先でよいか
