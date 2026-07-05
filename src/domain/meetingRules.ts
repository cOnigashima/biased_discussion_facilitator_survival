import type { DeliveryId, EvidenceId, RoundId, TargetId } from './ids';
import type { ActionResolution, RuleResolution } from './types';

export type MeetingActionInput = {
  roundId: RoundId;
  targetId: TargetId;
  evidenceIds: EvidenceId[];
  deliveryId: DeliveryId;
};

function sameEvidence(actual: EvidenceId[], expected: EvidenceId[]): boolean {
  if (actual.length !== expected.length) {
    return false;
  }

  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();

  return sortedActual.every((evidenceId, index) => evidenceId === sortedExpected[index]);
}

function hasEvidence(actual: EvidenceId[], evidenceId: EvidenceId): boolean {
  return actual.length === 1 && actual[0] === evidenceId;
}

function makeResolution(rule: RuleResolution, input: MeetingActionInput): ActionResolution {
  const logEntries = [
    {
      id: `${input.roundId}-player`,
      roundId: input.roundId,
      text: rule.playerLog,
    },
    {
      id: `${input.roundId}-npc`,
      roundId: input.roundId,
      text: rule.npcLog,
    },
  ];

  if (rule.unresolvedLog) {
    logEntries.push({
      id: `${input.roundId}-unresolved`,
      roundId: input.roundId,
      text: rule.unresolvedLog,
    });
  }

  return {
    outcome: rule.outcome,
    flagPatch: rule.flagPatch ?? {},
    meetingBreakdownRiskDelta: rule.meetingBreakdownRiskDelta ?? 0,
    logEntries,
    roundCompleted: true,
  };
}

function fallback(input: MeetingActionInput): RuleResolution {
  if (input.evidenceIds.length === 0) {
    return {
      outcome: 'neutral',
      playerLog: 'プレイヤーは、追加確認の必要性を質問した。',
      npcLog: 'このラウンドでは、資料に基づく事実確認までは行われなかった。',
    };
  }

  return {
    outcome: 'neutral',
    playerLog: 'プレイヤーは資料を示し、発言の前提を確認した。',
    npcLog: '参加者は、提示された資料と発言箇所の関係を追加で確認することにした。',
    unresolvedLog: 'このラウンドでは、主要な論点の整理までは進まなかった。',
  };
}

function resolveRound1(input: MeetingActionInput): RuleResolution {
  if (input.deliveryId === 'direct_objection') {
    return {
      outcome: 'hostile',
      meetingBreakdownRiskDelta: 1,
      playerLog: 'プレイヤーは、前回と同じではないと強く反論した。',
      npcLog: '佐伯は、止める場合の説明責任が残ると返した。',
    };
  }

  if (
    input.targetId === 'r1_target_same_as_last_time' &&
    input.deliveryId === 'comparison_question' &&
    (hasEvidence(input.evidenceIds, 'ci_legacy_failure') ||
      hasEvidence(input.evidenceIds, 'past_incident_report'))
  ) {
    return {
      outcome: 'partial_success',
      flagPatch: {
        pmCostPressureUnderstood: true,
      },
      playerLog: 'プレイヤーは、前回と今回の失敗条件を比較したいと質問した。',
      npcLog: '佐伯は、対象条件が違うなら同じとは言い切れないと認めた。',
    };
  }

  if (input.evidenceIds.length === 0 && input.deliveryId === 'no_evidence_soften') {
    return {
      outcome: 'neutral',
      playerLog: 'プレイヤーは、まず確認事項として前回との差分を置いた。',
      npcLog: '佐伯は、短時間で確認できる範囲なら会議中に整理したいと答えた。',
    };
  }

  return fallback(input);
}

function resolveRound2(input: MeetingActionInput): RuleResolution {
  if (hasEvidence(input.evidenceIds, 'cpu_spike_log')) {
    return {
      outcome: 'misuse',
      meetingBreakdownRiskDelta: 1,
      playerLog: 'プレイヤーはCPUスパイクログを示した。',
      npcLog:
        '黒瀬は、それは別チームの負荷テストであり、今回のmigrationとは関係が薄いと説明した。',
    };
  }

  if (
    input.targetId === 'r2_target_previously_unstable' &&
    hasEvidence(input.evidenceIds, 'ci_legacy_failure') &&
    (input.deliveryId === 'condition_check' || input.deliveryId === 'face_saving')
  ) {
    return {
      outcome: 'strong_success',
      flagPatch: {
        flakyResolved: true,
      },
      playerLog:
        'プレイヤーはCI失敗ログを示し、legacy_plan=true / tax_category=null の条件を確認した。',
      npcLog: '黒瀬は、legacy条件に絞った追加確認が必要だと認めた。',
    };
  }

  if (
    input.targetId === 'r2_target_previously_unstable' &&
    hasEvidence(input.evidenceIds, 'jira_bug_418_repro') &&
    input.deliveryId === 'condition_check'
  ) {
    return {
      outcome: 'strong_success',
      flagPatch: {
        flakyResolved: true,
      },
      playerLog:
        'プレイヤーはBUG-418を示し、stagingで再現している条件を確認した。',
      npcLog: '黒瀬は、単なる不安定テストではなく条件付きで確認する必要があると認めた。',
    };
  }

  if (
    input.targetId === 'r2_target_not_implementation' &&
    hasEvidence(input.evidenceIds, 'jira_bug_418_repro') &&
    input.deliveryId === 'face_saving'
  ) {
    return {
      outcome: 'strong_success',
      flagPatch: {
        flakyResolved: true,
      },
      playerLog:
        'プレイヤーはBUG-418を示し、legacy条件だけに絞って実装影響を確認したいと提案した。',
      npcLog: '黒瀬は、条件を絞った確認ならリリース判断前に扱えると答えた。',
    };
  }

  if (
    input.targetId === 'r2_target_not_implementation' &&
    hasEvidence(input.evidenceIds, 'staging_500_log') &&
    input.deliveryId === 'face_saving'
  ) {
    return {
      outcome: 'strong_success',
      flagPatch: {
        flakyResolved: true,
      },
      playerLog:
        'プレイヤーはstaging障害ログを示し、legacy条件で500が反復していることを確認した。',
      npcLog: '黒瀬は、同一条件で反復しているならflakyとは扱えないと答えた。',
    };
  }

  if (
    input.targetId === 'r2_target_not_implementation' &&
    hasEvidence(input.evidenceIds, 'pr_tax_category_comment') &&
    input.deliveryId === 'condition_check'
  ) {
    return {
      outcome: 'partial_success',
      flagPatch: {
        flakyResolved: true,
      },
      playerLog:
        'プレイヤーはPRコメントを示し、legacy customerのtax_category=null条件を確認した。',
      npcLog: '黒瀬は、事前指摘の条件をCIとstagingで照合する必要があると答えた。',
    };
  }

  if (
    input.targetId === 'r2_target_not_implementation' &&
    input.deliveryId === 'direct_objection' &&
    (hasEvidence(input.evidenceIds, 'pr_tax_category_comment') ||
      hasEvidence(input.evidenceIds, 'jira_bug_418_repro'))
  ) {
    return {
      outcome: 'hostile',
      flagPatch: {
        flakyResolved: true,
        techleadEnemy: true,
      },
      meetingBreakdownRiskDelta: 1,
      playerLog: 'プレイヤーは、実装側の見落としとして強く指摘した。',
      npcLog: '黒瀬は、設計判断を一方的に断定されたとして反発した。',
    };
  }

  return fallback(input);
}

function resolveRound3(input: MeetingActionInput): RuleResolution {
  if (input.deliveryId === 'accuse') {
    return {
      outcome: 'hostile',
      flagPatch: {
        salesEnemy: true,
      },
      meetingBreakdownRiskDelta: 1,
      playerLog: 'プレイヤーは、営業の約束の仕方に問題があったのではないかと指摘した。',
      npcLog: '桐谷は、先週の会議で今月中という話になっていたと反論した。',
    };
  }

  if (
    input.targetId === 'r3_target_this_month' &&
    hasEvidence(input.evidenceIds, 'customer_email_scope') &&
    input.deliveryId === 'scope_decomposition'
  ) {
    return {
      outcome: 'strong_success',
      flagPatch: {
        customerScopeResolved: true,
        salesAlly: true,
      },
      playerLog:
        'プレイヤーは顧客メールを示し、今月中に必要なのは請求書出力であることを確認した。',
      npcLog: '桐谷は、請求書出力だけ今月中に出せるなら説明できると答えた。',
    };
  }

  if (
    input.targetId === 'r3_target_losing_trust' &&
    hasEvidence(input.evidenceIds, 'customer_email_scope') &&
    input.deliveryId === 'interest_translation'
  ) {
    return {
      outcome: 'strong_success',
      flagPatch: {
        customerScopeResolved: true,
        salesAlly: true,
        salesPressureUnderstood: true,
      },
      playerLog:
        'プレイヤーは顧客メールを示し、顧客説明では必要機能の範囲を分けられると整理した。',
      npcLog: '桐谷は、顧客に約束した価値を守れるなら分割案を持ち帰れると答えた。',
    };
  }

  if (input.evidenceIds.length === 0 && input.deliveryId === 'direct_objection') {
    return {
      outcome: 'neutral',
      meetingBreakdownRiskDelta: 1,
      playerLog: 'プレイヤーは、事故リスクを理由に全面Goを避けたいと述べた。',
      npcLog: '桐谷は、顧客へ何をいつ出せるのかが分からなければ説明できないと答えた。',
    };
  }

  return fallback(input);
}

function resolveRound4(input: MeetingActionInput): RuleResolution {
  if (input.deliveryId === 'direct_objection') {
    return {
      outcome: 'hostile',
      flagPatch: {
        qaEnemy: true,
      },
      meetingBreakdownRiskDelta: 1,
      playerLog: 'プレイヤーは、全面停止は過剰反応ではないかと反論した。',
      npcLog: '三村は、懸念が軽く扱われているとして反発した。',
    };
  }

  if (
    input.targetId === 'r4_target_everything' &&
    input.deliveryId === 'empathize_then_split' &&
    sameEvidence(input.evidenceIds, ['rollback_procedure', 'feature_flag_design'])
  ) {
    return {
      outcome: 'strong_success',
      flagPatch: {
        rollbackRiskResolved: true,
        featureFlagResolved: true,
        qaAlly: true,
      },
      playerLog:
        'プレイヤーはロールバック手順とFeature Flag設計を示し、customer_data_migrationは止め、請求書出力だけ段階リリースする案を確認した。',
      npcLog: '三村は、migrationを止めるならその案をレビューできると答えた。',
    };
  }

  if (
    input.targetId === 'r4_target_dangerous' &&
    hasEvidence(input.evidenceIds, 'rollback_procedure') &&
    input.deliveryId === 'empathize_then_split'
  ) {
    return {
      outcome: 'partial_success',
      flagPatch: {
        rollbackRiskResolved: true,
      },
      playerLog:
        'プレイヤーはロールバック手順を示し、customer_data_migrationの不可逆性を確認した。',
      npcLog: '三村は、不可逆なwriteを止める必要があると答えた。',
    };
  }

  if (
    input.targetId === 'r4_target_everything' &&
    hasEvidence(input.evidenceIds, 'feature_flag_design') &&
    input.deliveryId === 'split_proposal'
  ) {
    return {
      outcome: 'partial_success',
      flagPatch: {
        featureFlagResolved: true,
      },
      playerLog:
        'プレイヤーはFeature Flag設計を示し、checkout UIとinvoice exportを個別に制御できることを確認した。',
      npcLog: '三村は、危険範囲と出せる範囲を分けて見ることには同意した。',
    };
  }

  if (
    input.targetId === 'r4_target_previous_incident' &&
    hasEvidence(input.evidenceIds, 'past_incident_report') &&
    input.deliveryId === 'empathize_then_split'
  ) {
    return {
      outcome: 'partial_success',
      flagPatch: {
        qaConcernUnderstood: true,
      },
      playerLog: 'プレイヤーは過去議事録を示し、staging警告を軽視した経緯を確認した。',
      npcLog: '三村は、今回も警告を軽視しないことが重要だと答えた。',
      unresolvedLog: 'ただし、この資料だけでは今回の危険範囲までは分解されなかった。',
    };
  }

  if (input.evidenceIds.length === 0 && input.deliveryId === 'agree_full_stop') {
    return {
      outcome: 'neutral',
      playerLog: 'プレイヤーは、QAの懸念に同意して全面停止の方向を確認した。',
      npcLog: '三村は、止める判断なら品質確認の時間を確保できると答えた。',
    };
  }

  return fallback(input);
}

export function resolveMeetingAction(input: MeetingActionInput): ActionResolution {
  if (input.roundId === 'round1_pm') {
    return makeResolution(resolveRound1(input), input);
  }

  if (input.roundId === 'round2_techlead') {
    return makeResolution(resolveRound2(input), input);
  }

  if (input.roundId === 'round3_sales') {
    return makeResolution(resolveRound3(input), input);
  }

  if (input.roundId === 'round4_qa') {
    return makeResolution(resolveRound4(input), input);
  }

  return makeResolution(fallback(input), input);
}
