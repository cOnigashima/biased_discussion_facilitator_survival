export type StageId = 'go_no_go_payment_v2';

export type CharacterId =
  | 'pm_saeki'
  | 'techlead_kurose'
  | 'sales_kiritani'
  | 'qa_mimura'
  | 'cto_sakaki'
  | 'player';

export type DocumentId =
  | 'pilack_release_check'
  | 'pira_bug_418'
  | 'pr_tax_category_comment'
  | 'ci_checkout_v2_failure'
  | 'staging_500_log'
  | 'customer_email_scope'
  | 'rollback_procedure'
  | 'feature_flag_design'
  | 'past_incident_report'
  | 'cpu_spike_log';

export type DocumentKind =
  | 'pilack'
  | 'pira'
  | 'pr'
  | 'ci'
  | 'staging'
  | 'mail'
  | 'runbook'
  | 'feature_flag'
  | 'incident'
  | 'metrics';

export type DocumentLineId = string;

export type EvidenceId =
  | 'jira_bug_418_repro'
  | 'ci_legacy_failure'
  | 'customer_email_scope'
  | 'rollback_procedure'
  | 'feature_flag_design'
  | 'staging_500_log'
  | 'pr_tax_category_comment'
  | 'past_incident_report'
  | 'cpu_spike_log';

export type EvidenceKind = 'primary' | 'support' | 'trap';

export type RoundId =
  | 'round1_pm'
  | 'round2_techlead'
  | 'round3_sales'
  | 'round4_qa'
  | 'round5_cto';

export type DialogueLineId = string;

export type TargetId =
  | 'r1_target_sunk_cost'
  | 'r1_target_no_alternative'
  | 'r1_target_same_as_last_time'
  | 'r1_target_no_problem_last_time'
  | 'r2_target_previously_unstable'
  | 'r2_target_not_implementation'
  | 'r2_target_test_side'
  | 'r3_target_this_month'
  | 'r3_target_losing_trust'
  | 'r4_target_dangerous'
  | 'r4_target_everything'
  | 'r4_target_previous_incident';

export type DeliveryId =
  | 'comparison_question'
  | 'condition_check'
  | 'no_evidence_soften'
  | 'direct_objection'
  | 'face_saving'
  | 'scope_decomposition'
  | 'interest_translation'
  | 'accuse'
  | 'empathize_then_split'
  | 'split_proposal'
  | 'agree_full_stop';

export type FinalDecisionId =
  | 'full_release'
  | 'full_delay'
  | 'split_release'
  | 'split_release_with_governance';

export type EndingId = 'bad' | 'normal' | 'good' | 'great';
