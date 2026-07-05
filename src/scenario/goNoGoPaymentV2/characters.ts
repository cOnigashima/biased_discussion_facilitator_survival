import type { CharacterDefinition } from '../../domain/types';

export const characters = [
  {
    id: 'pm_saeki',
    displayName: '佐伯',
    roleLabel: 'PM',
    stance: 'Go寄り。納期と説明負担を守りたい。',
    avatar: {
      kind: 'css_bird_placeholder',
      label: 'セキセイ',
      colorToken: '#b7c78e',
    },
  },
  {
    id: 'techlead_kurose',
    displayName: '黒瀬',
    roleLabel: 'Tech Lead',
    stance: 'Go寄り。設計判断を守りたい。',
    avatar: {
      kind: 'css_bird_placeholder',
      label: 'ハヤブサ',
      colorToken: '#a9b6cc',
    },
  },
  {
    id: 'sales_kiritani',
    displayName: '桐谷',
    roleLabel: 'Sales',
    stance: '顧客約束を守りたい。',
    avatar: {
      kind: 'css_bird_placeholder',
      label: 'オカメ',
      colorToken: '#d8c298',
    },
  },
  {
    id: 'qa_mimura',
    displayName: '三村',
    roleLabel: 'QA',
    stance: '全面停止寄り。品質と顧客影響を守りたい。',
    avatar: {
      kind: 'css_bird_placeholder',
      label: 'フクロウ',
      colorToken: '#c0b2d4',
    },
  },
  {
    id: 'cto_sakaki',
    displayName: '榊',
    roleLabel: 'CTO',
    stance: '最終判断。速度と重大事故回避の両立を見ている。',
    avatar: {
      kind: 'css_bird_placeholder',
      label: 'イヌワシ',
      colorToken: '#9aa8ba',
    },
  },
  {
    id: 'player',
    displayName: '自分',
    roleLabel: 'Senior Engineer',
    stance: '資料と発言のズレを整理する。',
    avatar: {
      kind: 'player_placeholder',
      label: '自分',
      colorToken: '#ec7a4f',
    },
  },
] satisfies CharacterDefinition[];
