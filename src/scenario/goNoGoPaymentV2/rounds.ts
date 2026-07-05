import type { MeetingRoundDefinition } from '../../domain/types';

export const meetingRounds = [
  {
    id: 'round1_pm',
    roundNumber: 1,
    speakerId: 'pm_saeki',
    title: 'Round 1: PM 佐伯',
    npcStatement: [
      {
        id: 'r1_statement_1',
        speakerId: 'pm_saeki',
        text: 'ここまで来て止めるのは現実的じゃないです。',
      },
      {
        id: 'r1_statement_2',
        speakerId: 'pm_saeki',
        text: '前回も似た警告は出ましたけど、結局問題ありませんでしたよね。',
      },
    ],
    targetPhrases: [
      {
        id: 'r1_target_sunk_cost',
        phrase: 'ここまで来て',
        statementLineId: 'r1_statement_1',
      },
      {
        id: 'r1_target_no_alternative',
        phrase: '止めるのは現実的じゃない',
        statementLineId: 'r1_statement_1',
      },
      {
        id: 'r1_target_same_as_last_time',
        phrase: '前回も似た警告',
        statementLineId: 'r1_statement_2',
      },
      {
        id: 'r1_target_no_problem_last_time',
        phrase: '問題ありませんでした',
        statementLineId: 'r1_statement_2',
      },
    ],
    deliveryOptions: [
      {
        id: 'comparison_question',
        label: '前回との差分を確認する',
      },
      {
        id: 'condition_check',
        label: '今回の失敗条件を確認する',
      },
      {
        id: 'no_evidence_soften',
        label: 'まず確認事項として置く',
      },
      {
        id: 'direct_objection',
        label: '同じではないと強く反論する',
      },
    ],
    maxEvidenceSelectable: 1,
  },
  {
    id: 'round2_techlead',
    roundNumber: 2,
    speakerId: 'techlead_kurose',
    title: 'Round 2: Tech Lead 黒瀬',
    npcStatement: [
      {
        id: 'r2_statement_1',
        speakerId: 'techlead_kurose',
        text: 'このテストは前から不安定です。',
      },
      {
        id: 'r2_statement_2',
        speakerId: 'techlead_kurose',
        text: '実装の問題というより、テスト側の問題だと思います。',
      },
    ],
    targetPhrases: [
      {
        id: 'r2_target_previously_unstable',
        phrase: '前から不安定',
        statementLineId: 'r2_statement_1',
      },
      {
        id: 'r2_target_not_implementation',
        phrase: '実装の問題というより',
        statementLineId: 'r2_statement_2',
      },
      {
        id: 'r2_target_test_side',
        phrase: 'テスト側の問題',
        statementLineId: 'r2_statement_2',
      },
    ],
    deliveryOptions: [
      {
        id: 'condition_check',
        label: '失敗条件を確認する',
      },
      {
        id: 'face_saving',
        label: 'legacy条件だけに絞って確認する',
      },
      {
        id: 'direct_objection',
        label: '設計ミスとして指摘する',
      },
      {
        id: 'no_evidence_soften',
        label: '追加確認だけ提案する',
      },
    ],
    maxEvidenceSelectable: 1,
  },
  {
    id: 'round3_sales',
    roundNumber: 3,
    speakerId: 'sales_kiritani',
    title: 'Round 3: Sales 桐谷',
    npcStatement: [
      {
        id: 'r3_statement_1',
        speakerId: 'sales_kiritani',
        text: '顧客には今月中に出すと伝えています。',
      },
      {
        id: 'r3_statement_2',
        speakerId: 'sales_kiritani',
        text: 'ここで延期したら信用を失います。',
      },
    ],
    targetPhrases: [
      {
        id: 'r3_target_this_month',
        phrase: '今月中に出す',
        statementLineId: 'r3_statement_1',
      },
      {
        id: 'r3_target_losing_trust',
        phrase: '信用を失います',
        statementLineId: 'r3_statement_2',
      },
    ],
    deliveryOptions: [
      {
        id: 'scope_decomposition',
        label: '必要機能の範囲を分ける',
      },
      {
        id: 'interest_translation',
        label: '顧客説明に使える形へ言い換える',
      },
      {
        id: 'direct_objection',
        label: '事故リスクを強く押す',
      },
      {
        id: 'accuse',
        label: '営業の約束の仕方を責める',
      },
    ],
    maxEvidenceSelectable: 1,
  },
  {
    id: 'round4_qa',
    roundNumber: 4,
    speakerId: 'qa_mimura',
    title: 'Round 4: QA 三村',
    npcStatement: [
      {
        id: 'r4_statement_1',
        speakerId: 'qa_mimura',
        text: 'それでも危険です。全部止めるべきです。',
      },
      {
        id: 'r4_statement_2',
        speakerId: 'qa_mimura',
        text: '前回もこういう軽視から障害になりました。',
      },
    ],
    targetPhrases: [
      {
        id: 'r4_target_dangerous',
        phrase: '危険です',
        statementLineId: 'r4_statement_1',
      },
      {
        id: 'r4_target_everything',
        phrase: '全部止めるべき',
        statementLineId: 'r4_statement_1',
      },
      {
        id: 'r4_target_previous_incident',
        phrase: '前回もこういう軽視',
        statementLineId: 'r4_statement_2',
      },
    ],
    deliveryOptions: [
      {
        id: 'empathize_then_split',
        label: '懸念に共感してから分ける',
      },
      {
        id: 'split_proposal',
        label: '危険部分と出せる部分を分ける',
      },
      {
        id: 'agree_full_stop',
        label: '全面停止に乗る',
      },
      {
        id: 'direct_objection',
        label: '過剰反応として反論する',
      },
    ],
    maxEvidenceSelectable: 2,
  },
  {
    id: 'round5_cto',
    roundNumber: 5,
    speakerId: 'cto_sakaki',
    title: 'Round 5: CTO 榊',
    npcStatement: [
      {
        id: 'r5_statement_1',
        speakerId: 'cto_sakaki',
        text: 'では、結論としてどうしたいんですか？',
      },
    ],
    targetPhrases: [],
    deliveryOptions: [],
    maxEvidenceSelectable: 0,
  },
] satisfies MeetingRoundDefinition[];
