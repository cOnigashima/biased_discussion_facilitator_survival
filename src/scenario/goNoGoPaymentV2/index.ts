import type { StageDefinition } from '../../domain/types';
import { characters } from './characters';
import { documents } from './documents';
import { endings, finalDecisions } from './endings';
import { evidenceCards } from './evidence';
import { meetingOpening, meetingRounds } from './rounds';

export const goNoGoPaymentV2Stage = {
  id: 'go_no_go_payment_v2',
  title: '決済v2 Go/No-Go会議',
  subtitle: 'Release Judgment: 決済移行前夜',
  playerRole: 'シニアエンジニア',
  situation:
    '明日、checkout_v2、請求書出力、customer_data_migrationをリリース予定。Jira、CI失敗、PRコメント、staging障害ログ、顧客メール、ロールバック手順にズレがある。',
  mainGoal:
    '全面リリースでも全面延期でもなく、必要機能だけを段階リリースする判断へ落とす。',
  characters,
  documents,
  evidenceCards,
  meetingOpening,
  meetingRounds,
  finalDecisions,
  endings,
} satisfies StageDefinition;

export {
  characters,
  documents,
  endings,
  evidenceCards,
  finalDecisions,
  meetingOpening,
  meetingRounds,
};
