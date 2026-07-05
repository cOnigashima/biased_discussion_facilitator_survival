import type { EndingDefinition, FinalDecisionDefinition } from '../../domain/types';

export const finalDecisions = [
  {
    id: 'full_release',
    title: '全面リリース',
    availability: 'always',
    endingId: 'bad',
  },
  {
    id: 'full_delay',
    title: '全面延期',
    availability: 'always',
    endingId: 'normal',
  },
  {
    id: 'split_release',
    title: '分割リリース',
    availability: 'split_release_unlocked',
    endingId: 'good',
  },
  {
    id: 'split_release_with_governance',
    title: '分割リリース + Go/No-Go基準の明文化',
    availability: 'great_unlocked',
    endingId: 'great',
  },
] satisfies FinalDecisionDefinition[];

export const endings = [
  {
    id: 'bad',
    banner: 'danger',
    title: '強行リリース',
    finalDecisionLabel: '全面リリース',
    description:
      'checkout_v2とcustomer_data_migrationを含む全面リリースを選んだ。未確認の条件付き失敗が残ったまま本番へ進む。',
  },
  {
    id: 'normal',
    banner: 'warning',
    title: '全面延期',
    finalDecisionLabel: '全面延期',
    description:
      '重大事故は避けたが、顧客が今月中に必要としている範囲まで止める判断になった。',
  },
  {
    id: 'good',
    banner: 'success',
    title: '分割リリース',
    finalDecisionLabel: 'invoice exportのみ段階リリース',
    description:
      '危険なmigrationを止め、顧客に必要な請求書出力だけを段階リリースする判断に整理した。',
  },
  {
    id: 'great',
    banner: 'great',
    title: '分割リリース + ルール化',
    finalDecisionLabel: 'invoice exportのみ段階リリース + Go/No-Go基準明文化',
    description:
      '分割リリースに加えて、次回以降のGo/No-Goで使う確認基準まで合意した。',
    greatRules: [
      '同一条件で複数回落ちるCIはflaky扱いしない',
      'ロールバック不能なwrite/migrationはGo/No-Go前に明示する',
      '顧客要求は「期限」だけでなく「必要機能の範囲」まで確認する',
    ],
  },
] satisfies EndingDefinition[];
