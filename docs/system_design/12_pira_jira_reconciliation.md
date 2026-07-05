# Pira / Jira Reconciliation

Status: Accepted v1  
Date: 2026-07-05

## Purpose

Pira/Jira BUG-418をP0で証拠カード化するかどうかの再監査結果と、採用した解決方針をまとめる。

## Conclusion

Pira/Jiraは証拠カード化する。

P0正本の証拠カード一覧ではPira/Jiraはカードではない。一方で、デザインカンプ上のPira画面にはクリック可能な証拠行の表現がある。今回はカンプ優先で解決し、Pira/Jira BUG-418をP0証拠カードに追加する。

採用する差分:

- New Evidence ID: `jira_bug_418_repro`
- Source Document: `pira_bug_418`
- Acquisition copy: `BUG-418で、tax_category=nullの場合にmigration後のcheckoutが500になるとQAが報告している。`
- 証拠カード総数: 9枚
- CPU Spike Logは引き続き罠カードとして含める。

## Evidence for No-Card

Pira/Jiraをカード化しない根拠:

1. P0正本の証拠カード一覧にJira/Piraがない。

   P0正本の証拠カードは次の8枚。

   ```text
   ci_legacy_failure
   customer_email_scope
   rollback_procedure
   feature_flag_design
   staging_500_log
   pr_tax_category_comment
   past_incident_report
   cpu_spike_log
   ```

2. P0正本は `最大取得可能カード: 8枚` としている。

3. 旧data modelにもJira/Pira証拠はない。

   `bias_meeting_game_handoff/11_data_model.yaml` の `evidence:` は8枚で、Jira/Pira由来のカードは定義されていない。

4. デザインREADMEの探索アプリ説明では、Piraだけ `→ 証拠 xxx` が書かれていない。

   CI/PR/Staging/Mail/Rollbk/FFlag/過去には証拠IDが明示されている。

## Evidence for Card

Pira/Jiraをカード化する根拠:

1. P0正本の資料一覧には `Jira BUG-418` が含まれている。

2. P0正本には `1資料1カード` とある。

3. カンプHTMLの `APP · Pira` には、黄色背景・リング・`cursor:pointer` の行がある。

   対象文:

   ```text
   tax_category が null の場合に migration 後の checkout で 500
   ```

4. カンプHTMLのPira画面下部には `証拠が 2枚 そろった` と表示されている。

   ただし、このカウントは静的カンプ上の状態例であり、Piraクリック後の取得数を厳密に示すとは限らない。

5. デザインREADMEは `探索アプリ画面（証拠資料8種）` としてPiraを含めている。

## Additional Conflict: CPU

CPUスパイクログも衝突の原因。

- P0正本では `cpu_spike_log` が補助/罠カードとして明記されている。
- デザインREADMEでは `cpu_spike_log` はカンプ未描画、実装時に追加想定とある。
- つまり、メインカンプの探索アプリ8種はPiraを含み、CPUを含まない。
- しかしP0正本の証拠カード8枚はCPUを含み、Jira/Piraを含まない。

このため、次の3つは同時に満たせない。

```text
1. Slack以外の全資料を1資料1カードにする
2. 最大取得可能カードを8枚にする
3. CPUスパイクログを罠カードとして含める
```

## Resolution Options

### Option A: Spec-Authoritative / Rejected

P0正本の証拠カード一覧を優先する。

扱い:

- Pira/Jiraは読める文脈資料
- Pira/Jiraは証拠カード化しない
- CPUスパイクログを罠カードとして追加する
- 最大取得カードは8枚のまま

Pros:

- P0正本のフラグ/エンド条件と一致する
- 証拠カードIDが増えない
- CPU罠カード仕様を守れる

Cons:

- カンプ上のPiraクリック可能表現とズレる
- `1資料1カード` の文言とズレる
- Piraの黄色行を実装で消す/無効化する必要がある

### Option B: Design-Authoritative / Accepted

カンプのPiraクリック可能表現を優先する。

扱い:

- Pira/Jiraも証拠カード化する
- 新規証拠ID: `jira_bug_418_repro`
- 最大取得カードは9枚に修正する
- CPUも罠カードとして追加する

Pros:

- カンプの探索体験と一致する
- Slack以外の資料が1資料1カードに近い
- Piraの情報が会議で使いやすくなる

Cons:

- P0正本の最大8枚と証拠カード一覧を変更する必要がある
- `staging_500_log` と役割が重複する
- R2の証拠候補が増え、P0の絞り込みが弱くなる

Mitigation:

- Pira/JiraはR2専用のprimary証拠として扱い、攻撃的な出し方だけをリスク扱いにする。Good/Great必須条件そのものは増やさない。
- `staging_500_log` は実環境ログ、`jira_bug_418_repro` はQA再現とP2判断の文脈としてログ文を分ける。
- R2では証拠選択数は1枚のままにし、組み合わせ複雑度を増やさない。

### Option C: Pira as Non-Card Clickable Context / Rejected

Piraの行はクリック可能だが、証拠カードではなく文脈メモ扱いにする。

扱い:

- Piraクリックで短い気づきは出る
- 会議で選べる証拠カードには入らない
- 証拠枚数にも含めない

Pros:

- カンプのクリック表現を一部活かせる
- 証拠カード8枚は維持できる

Cons:

- P0正本にない中間概念が増える
- `証拠カード取得` の体験が曖昧になる
- 実装/説明が複雑になるためP0には不向き

## Implementation Contract

実装では次を正とする。

- `EvidenceId` unionに `jira_bug_418_repro` を含める。
- `pira_bug_418` のクリック可能行に `evidenceId='jira_bug_418_repro'` を付ける。
- Evidence Card一覧は9枚。
- Slack/Pilackだけは証拠カード化しない。
- CPU Spike Logはメインカンプ未描画でも追加し、罠カードとして取得可能にする。
- R2で `jira_bug_418_repro` を `condition_check` または `face_saving` で出した場合、`flakyResolved=true`。
- R2で `jira_bug_418_repro` を `direct_objection` で出した場合、`flakyResolved=true`, `techleadEnemy=true`, `meetingBreakdownRisk +1`。

## Remaining Spec Delta

この決定は、P0正本の以下を上書きする。

- 最大取得可能カード: 8枚 -> 9枚
- 証拠カード一覧: `jira_bug_418_repro` を追加

それ以外のP0条件、R4のみ2枚コンボ、Result分岐条件、CPU罠カード仕様は維持する。
