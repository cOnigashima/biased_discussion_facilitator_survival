import type { EvidenceCardDefinition } from '../../domain/types';

export const evidenceCards = [
  {
    id: 'jira_bug_418_repro',
    title: 'Jira BUG-418',
    shortTitle: 'BUG-418',
    sourceDocumentId: 'pira_bug_418',
    kind: 'primary',
    factSummary:
      'BUG-418で、tax_category=nullの場合にmigration後のcheckoutが500になるとQAが報告している。',
  },
  {
    id: 'ci_legacy_failure',
    title: 'CI失敗ログ',
    shortTitle: 'CI失敗',
    sourceDocumentId: 'ci_checkout_v2_failure',
    kind: 'primary',
    factSummary:
      'legacy_plan=true かつ tax_category=null のケースでCheckoutV2MigrationSpecが失敗している。',
  },
  {
    id: 'staging_500_log',
    title: 'staging障害ログ',
    shortTitle: 'staging 500',
    sourceDocumentId: 'staging_500_log',
    kind: 'primary',
    factSummary:
      'stagingで legacy_plan=true / tax_category=null のcheckoutが500を返している。',
  },
  {
    id: 'customer_email_scope',
    title: '顧客メール',
    shortTitle: '顧客メール',
    sourceDocumentId: 'customer_email_scope',
    kind: 'primary',
    factSummary:
      '顧客が今月中に必要としているのは請求書出力で、新決済フロー全体ではない。',
  },
  {
    id: 'rollback_procedure',
    title: 'ロールバック手順',
    shortTitle: 'Rollback',
    sourceDocumentId: 'rollback_procedure',
    kind: 'primary',
    factSummary:
      'customer_data_migrationは本番write後に完全ロールバックできない。',
  },
  {
    id: 'feature_flag_design',
    title: 'Feature Flag設計',
    shortTitle: 'Feature Flag',
    sourceDocumentId: 'feature_flag_design',
    kind: 'primary',
    factSummary:
      'checkout UI と invoice export は個別に制御できる。customer_data_migrationは自動rollbackできない。',
  },
  {
    id: 'pr_tax_category_comment',
    title: 'PRコメント',
    shortTitle: 'PRコメント',
    sourceDocumentId: 'pr_tax_category_comment',
    kind: 'support',
    factSummary:
      'PRでlegacy customerのtax_category=nullに対する参照エラー懸念が事前に指摘されていた。',
  },
  {
    id: 'past_incident_report',
    title: '過去障害報告',
    shortTitle: '過去障害',
    sourceDocumentId: 'past_incident_report',
    kind: 'support',
    factSummary:
      '過去にstaging警告をflaky扱いし、本番で請求処理失敗が起きた。ただし原因は今回と同一ではない。',
  },
  {
    id: 'cpu_spike_log',
    title: 'CPUスパイクログ',
    shortTitle: 'CPUスパイク',
    sourceDocumentId: 'cpu_spike_log',
    kind: 'trap',
    factSummary:
      'stagingでCPUスパイクがあったが、原因は別チームの負荷テストだった。',
  },
] satisfies EvidenceCardDefinition[];
