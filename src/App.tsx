import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { DeliveryId, DocumentId, EvidenceId, FinalDecisionId, TargetId } from './domain/ids';
import { canStartMeeting } from './domain/evidenceRules';
import { getAvailableFinalDecisions } from './domain/finalDecisionRules';
import { createInitialGameState } from './domain/initialState';
import type {
  CharacterDefinition,
  DialogueLine,
  DocumentDefinition,
  DocumentLine,
  EvidenceCardDefinition,
  GameState,
  MeetingLogEntry,
  MeetingRoundDefinition,
} from './domain/types';
import { createGameReducer } from './app/gameReducer';
import { goNoGoPaymentV2Stage } from './scenario/goNoGoPaymentV2';

const stage = goNoGoPaymentV2Stage;

function getCharacter(characterId: CharacterDefinition['id']) {
  return stage.characters.find((character) => character.id === characterId);
}

function getEvidence(evidenceId: EvidenceId): EvidenceCardDefinition {
  const evidence = stage.evidenceCards.find((card) => card.id === evidenceId);

  if (!evidence) {
    throw new Error(`Missing evidence: ${evidenceId}`);
  }

  return evidence;
}

function getDocument(documentId: DocumentId): DocumentDefinition {
  const document = stage.documents.find((entry) => entry.id === documentId);

  if (!document) {
    throw new Error(`Missing document: ${documentId}`);
  }

  return document;
}

function findRound(roundId?: MeetingLogEntry['roundId']) {
  return stage.meetingRounds.find((round) => round.id === roundId);
}

function getEndingCopy(endingId: NonNullable<GameState['ending']>) {
  const ending = stage.endings.find((entry) => entry.id === endingId);

  if (!ending) {
    throw new Error(`Missing ending: ${endingId}`);
  }

  return ending;
}

function formatRoundLabel(roundId?: string) {
  if (!roundId) {
    return '';
  }

  const match = roundId.match(/^round(\d)/);

  return match ? `R${match[1]}` : roundId;
}

function isClickableEvidenceLine(line: DocumentLine): line is DocumentLine & { evidenceId: EvidenceId } {
  return Boolean(line.evidenceId);
}

type AcquireEvidenceHandler = (
  documentId: DocumentId,
  line: DocumentLine & { evidenceId: EvidenceId },
) => void;

type GameDispatch = React.Dispatch<Parameters<ReturnType<typeof createGameReducer>>[1]>;
type MeetingSideTab = 'action' | 'minutes';

function getSelectedTargetLabel(round: MeetingRoundDefinition, targetId?: TargetId) {
  return round.targetPhrases.find((target) => target.id === targetId)?.phrase;
}

function getSelectedDeliveryLabel(round: MeetingRoundDefinition, deliveryId?: DeliveryId) {
  return round.deliveryOptions.find((delivery) => delivery.id === deliveryId)?.label;
}

function getSelectedEvidenceLabel(evidenceIds: EvidenceId[]) {
  if (evidenceIds.length === 0) {
    return '判断材料なし';
  }

  return evidenceIds.map((evidenceId) => getEvidence(evidenceId).shortTitle).join(' + ');
}

function renderStatementText({
  line,
  round,
  selectedTargetId,
  onSelectTarget,
}: {
  line: MeetingRoundDefinition['npcStatement'][number];
  round: MeetingRoundDefinition;
  selectedTargetId?: TargetId;
  onSelectTarget: (targetId: TargetId) => void;
}) {
  const targetsInLine = round.targetPhrases
    .map((target) => ({
      ...target,
      index: line.text.indexOf(target.phrase),
    }))
    .filter((target) => target.statementLineId === line.id && target.index >= 0)
    .sort((a, b) => a.index - b.index);

  if (targetsInLine.length === 0) {
    return line.text;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  targetsInLine.forEach((target) => {
    if (target.index > cursor) {
      nodes.push(line.text.slice(cursor, target.index));
    }

    nodes.push(
      <button
        key={target.id}
        className={`statement-target ${selectedTargetId === target.id ? 'selected' : ''}`}
        type="button"
        onClick={() => onSelectTarget(target.id)}
      >
        {target.phrase}
      </button>,
    );

    cursor = target.index + target.phrase.length;
  });

  if (cursor < line.text.length) {
    nodes.push(line.text.slice(cursor));
  }

  return nodes;
}

function AppFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="app-shell">
      <div className={`game-screen ${className ?? ''}`}>{children}</div>
    </main>
  );
}

function MenuBar({ title }: { title: string }) {
  return (
    <div className="menu-bar">
      <strong>◈ {title}</strong>
      <span>ファイル</span>
      <span>表示</span>
      <span>ウィンドウ</span>
      <time>リリース前夜 · 木 21:40</time>
      <span>◧ ▤ ⏻</span>
    </div>
  );
}

function Avatar({
  character,
  size = 'normal',
  active = false,
}: {
  character: CharacterDefinition;
  size?: 'small' | 'normal' | 'large';
  active?: boolean;
}) {
  return (
    <div
      className={`avatar avatar-${size} ${active ? 'avatar-active' : ''}`}
      style={{ '--avatar-color': character.avatar.colorToken } as React.CSSProperties}
    >
      {character.avatar.label}
    </div>
  );
}

function Dock({
  currentDocumentId,
  onOpenDocument,
  onOpenEvidence,
  evidenceOpen = false,
}: {
  currentDocumentId: DocumentId;
  onOpenDocument: (documentId: DocumentId) => void;
  onOpenEvidence?: () => void;
  evidenceOpen?: boolean;
}) {
  return (
    <nav className="dock" aria-label="資料アプリ">
      {stage.documents.map((document) => (
        <button
          key={document.id}
          className={`dock-icon ${document.id === currentDocumentId ? 'dock-icon-active' : ''}`}
          style={{ '--app-color': document.appColorToken } as React.CSSProperties}
          type="button"
          onClick={() => onOpenDocument(document.id)}
        >
          <span>{document.iconLabel}</span>
          {document.dockLabel}
        </button>
      ))}
      <div className="dock-divider" />
      <button
        className={`dock-memo ${evidenceOpen ? 'dock-memo-active' : ''}`}
        type="button"
        disabled={!onOpenEvidence}
        onClick={onOpenEvidence}
      >
        <span>✎</span>
        判断材料
      </button>
    </nav>
  );
}

function BottomCommentBar({
  label,
  text,
  action,
}: {
  label: string;
  text: string;
  action?: React.ReactNode;
}) {
  const player = getCharacter('player');

  if (!player) {
    return null;
  }

  return (
    <div className="comment-bar">
      <Avatar character={player} size="large" />
      <div className="comment-copy">
        <div className="comment-label">{label}</div>
        <div className="comment-text">{text}</div>
      </div>
      {action ? <div className="comment-action">{action}</div> : null}
    </div>
  );
}

function WindowChrome({
  document,
  children,
}: {
  document: Pick<DocumentDefinition, 'appLabel' | 'appColorToken' | 'title'>;
  children: React.ReactNode;
}) {
  return (
    <section className="document-window">
      <div className="window-titlebar">
        <span className="window-dot red" />
        <span className="window-dot yellow" />
        <span className="window-dot green" />
        <strong style={{ color: document.appColorToken }}>{document.appLabel}</strong>
        <span className="window-title">{document.title}</span>
      </div>
      {children}
    </section>
  );
}

type PrologueMessage =
  | {
      id: string;
      kind: 'bot';
      title: string;
      text: string;
      meta: string;
    }
  | {
      id: string;
      kind: 'character';
      speakerId: CharacterDefinition['id'];
      timestamp: string;
      text: string;
      emphasized?: boolean;
    };

const prologueMessages = [
  {
    id: 'ci-bot-failed',
    kind: 'bot',
    title: '● Build #1841 FAILED',
    text: 'CheckoutV2MigrationSpec (1 failure)',
    meta: 'branch main · 21:02 · view log',
  },
  {
    id: 'pm-saeki-go',
    kind: 'character',
    speakerId: 'pm_saeki',
    timestamp: '21:38',
    text: '明日の決済v2リリース、基本的にはGoで進めたいです。CIが少し赤いですが、前回も似たような警告はありましたし、最後は通ったので大丈夫だと思っています。',
  },
  {
    id: 'techlead-kurose-flaky',
    kind: 'character',
    speakerId: 'techlead_kurose',
    timestamp: '21:40',
    text: '決済周りの実装は大きな問題ないです。落ちているテストは以前から不安定なやつですね。リリース後の cleanup で対応できます。',
  },
  {
    id: 'qa-mimura-warning',
    kind: 'character',
    speakerId: 'qa_mimura',
    timestamp: '21:41',
    text: '今回の失敗は前回と違います。legacy_plan=true の顧客で同じ落ち方をしています。このまま出すのは危険です。',
    emphasized: true,
  },
  {
    id: 'sales-kiritani-deadline',
    kind: 'character',
    speakerId: 'sales_kiritani',
    timestamp: '21:43',
    text: '顧客には今月中に出すと伝えています。ここで延期になると説明がかなり厳しいです。',
  },
  {
    id: 'cto-sakaki-call',
    kind: 'character',
    speakerId: 'cto_sakaki',
    timestamp: '21:45',
    text: 'このまま流すには情報が足りないですね。10分だけ集まって、根拠ベースでGo/No-Goを決めましょう。',
  },
] satisfies PrologueMessage[];

const prologueMessageDelays = [800, 1700, 1800, 1800, 1800, 1600] as const;
const prologueCommentFocusDelay = 1000;

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <AppFrame className="start-screen">
      <MenuBar title="Release Judgment" />
      <section className="start-hero" aria-labelledby="start-title">
        <div className="start-copy">
          <p>Biased Discussion Facilitator Survival</p>
          <h1 id="start-title">Release Judgment</h1>
          <h2>決済移行前夜</h2>
          <span>あなたは決済チームのSenior Engineerです。</span>
          <p>
            明日の決済v2リリース可否を決める会議の前に、散らばった資料の怪しい箇所をクリックして判断材料を集める。
            声の大きさや空気に流されず、根拠を持って会議に臨み、よりよい落とし所へ議論を導きましょう！
          </p>
          <button className="primary-button start-button" type="button" onClick={onStart}>
            ▸ Startする！
          </button>
        </div>

        <aside className="start-brief" aria-label="状況メモ">
          <div>
            <span>Role</span>
            <strong>Senior Engineer / Payments</strong>
          </div>
          <div>
            <span>Incident Risk</span>
            <strong>checkout_v2 migration</strong>
          </div>
          <div>
            <span>Meeting</span>
            <strong>Go/No-Go 09:50</strong>
          </div>
          <div>
            <span>Objective</span>
            <strong>判断材料を集めて会議へ進む</strong>
          </div>
        </aside>
      </section>
    </AppFrame>
  );
}

function getPrologueTypingLabel(message?: PrologueMessage) {
  if (!message || message.kind === 'bot') {
    return null;
  }

  return getCharacter(message.speakerId)?.displayName ?? null;
}

function PrologueTypingIndicator({ label }: { label: string }) {
  return (
    <div className="typing-row">
      <span />
      {label} が入力中...
    </div>
  );
}

function PrologueScreen({ onStart }: { onStart: () => void }) {
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const [commentReady, setCommentReady] = useState(false);
  const [typingReady, setTypingReady] = useState(false);
  const allMessagesVisible = visibleMessageCount >= prologueMessages.length;
  const typingLabel = getPrologueTypingLabel(prologueMessages[visibleMessageCount]);

  useEffect(() => {
    if (allMessagesVisible) {
      return;
    }

    const delay = prologueMessageDelays[visibleMessageCount] ?? 2000;
    const timeoutId = window.setTimeout(() => {
      setVisibleMessageCount((count) => Math.min(count + 1, prologueMessages.length));
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [allMessagesVisible, visibleMessageCount]);

  useEffect(() => {
    setTypingReady(false);

    if (!typingLabel || allMessagesVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTypingReady(true);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [allMessagesVisible, typingLabel, visibleMessageCount]);

  useEffect(() => {
    if (!allMessagesVisible || commentReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCommentReady(true);
    }, prologueCommentFocusDelay);

    return () => window.clearTimeout(timeoutId);
  }, [allMessagesVisible, commentReady]);

  return (
    <AppFrame
      className={`prologue-screen ${
        commentReady ? 'prologue-comment-focus' : 'prologue-slack-focus'
      }`}
    >
      <MenuBar title="Pilack" />
      <WindowChrome
        document={{
          appLabel: 'Pilack',
          appColorToken: '#6b4e9e',
          title: 'Acme Payments / #release-check',
        }}
      >
        <div className="pilack-layout">
          <aside className="workspace-rail">
            <div className="workspace-active">A</div>
            <div>M</div>
            <div>個</div>
            <div>+</div>
          </aside>
          <aside className="channel-sidebar">
            <h2>Acme Payments</h2>
            <p>▾ チャンネル</p>
            <strong># release-check</strong>
            <span># payments-platform</span>
            <span># qa-signoff</span>
            <span># incidents</span>
            <p>▾ ダイレクトメッセージ</p>
            {stage.characters
              .filter((character) => character.id !== 'player')
              .map((character) => (
                <span key={character.id}>● {character.displayName}（{character.roleLabel}）</span>
              ))}
          </aside>
          <section className="pilack-main">
            <header className="channel-header">
              <h1># release-check</h1>
              <span>決済v2リリースの最終確認</span>
            </header>
            <div className="message-stream">
              <div className="date-chip">今日</div>
              {prologueMessages.slice(0, visibleMessageCount).map((message) => {
                if (message.kind === 'bot') {
                  return (
                    <article key={message.id} className="bot-message prologue-message">
                      <strong>{message.title}</strong>
                      <span>{message.text}</span>
                      <small>{message.meta}</small>
                    </article>
                  );
                }

                const character = getCharacter(message.speakerId);

                if (!character) {
                  return null;
                }

                return (
                  <article
                    key={message.id}
                    className={`chat-message prologue-message ${
                      message.emphasized ? 'warning-message' : ''
                    }`}
                  >
                    <Avatar character={character} size="small" />
                    <div>
                      <div className="message-meta">
                        <strong>{character.displayName}</strong>
                        <span>{character.roleLabel}</span>
                        <time>{message.timestamp}</time>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="prologue-typing-slot" aria-live="polite">
              {typingLabel && typingReady ? (
                <PrologueTypingIndicator key={`typing-slot-${visibleMessageCount}`} label={typingLabel} />
              ) : null}
            </div>
          </section>
        </div>
      </WindowChrome>
      <Dock
        currentDocumentId="pilack_release_check"
        onOpenDocument={() => undefined}
      />
      <BottomCommentBar
        label="PROLOGUE / 状況"
        text="明日、決済v2をリリース予定。CIは赤いのに、PMもTech LeadもGo寄りだ。本当にそれでいいのだろうか？？ 会議の前に、資料を当たっておこう。"
        action={
          <button className="primary-button" type="button" disabled={!commentReady} onClick={onStart}>
            {commentReady ? '▸ 資料を調べる' : '会話を確認中...'}
          </button>
        }
      />
    </AppFrame>
  );
}

function DocumentWindow({
  document,
  state,
  onAcquire,
  onOpenDocument,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
  onOpenDocument?: (documentId: DocumentId) => void;
}) {
  if (document.id === 'pilack_release_check') {
    return (
      <WindowChrome document={document}>
        <PilackDocumentContent state={state} />
      </WindowChrome>
    );
  }

  const showStandardHeader =
    document.id !== 'pira_bug_418' &&
    document.id !== 'pr_tax_category_comment' &&
    document.id !== 'staging_500_log' &&
    document.id !== 'customer_email_scope' &&
    document.id !== 'rollback_procedure' &&
    document.id !== 'feature_flag_design' &&
    document.id !== 'past_incident_report' &&
    document.id !== 'cpu_spike_log';

  return (
    <WindowChrome document={document}>
      <div className={`document-body document-${document.kind}`}>
        {showStandardHeader ? (
          <header className="document-header" style={{ borderColor: document.appColorToken }}>
            <span className="document-icon" style={{ color: document.appColorToken }}>
              {document.iconLabel}
            </span>
            <div>
              <h1>{document.title}</h1>
              <p>{document.appLabel} · release materials</p>
            </div>
          </header>
        ) : null}
        <DocumentAppContent
          document={document}
          state={state}
          onAcquire={onAcquire}
          onOpenDocument={onOpenDocument}
        />
      </div>
    </WindowChrome>
  );
}

function DocumentTextLine({ line }: { line: DocumentLine }) {
  return (
    <div className={`document-line line-${line.style ?? 'normal'}`}>
      {line.speakerId ? (
        <span className="line-speaker">{getCharacter(line.speakerId)?.displayName}</span>
      ) : null}
      <span>{line.text}</span>
    </div>
  );
}

function DocumentEvidenceLine({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`document-line evidence-line line-${line.style ?? 'normal'} ${
        acquired ? 'evidence-line-acquired' : ''
      }`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      {line.speakerId ? (
        <span className="line-speaker">{getCharacter(line.speakerId)?.displayName}</span>
      ) : null}
      <span>{line.text}</span>
      {acquired ? <strong>取得済み</strong> : null}
    </button>
  );
}

function DocumentLineEntry({
  document,
  line,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  if (!isClickableEvidenceLine(line)) {
    return <DocumentTextLine line={line} />;
  }

  return (
    <DocumentEvidenceLine
      document={document}
      line={line}
      acquired={state.acquiredEvidence.includes(line.evidenceId)}
      onAcquire={onAcquire}
    />
  );
}

function GenericDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <div className="document-lines">
      {document.lines.map((line) => (
        <DocumentLineEntry
          key={line.id}
          document={document}
          line={line}
          state={state}
          onAcquire={onAcquire}
        />
      ))}
    </div>
  );
}

function PiraEvidenceSnippet({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`pira-evidence-snippet ${acquired ? 'pira-evidence-snippet-acquired' : ''}`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      {acquired ? '取得済み: ' : null}
      {line.text}
    </button>
  );
}

function PiraDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find((line) => line.id === 'pira_tax_null_checkout_500');
  const qaCharacter = getCharacter('qa_mimura');
  const techLeadCharacter = getCharacter('techlead_kurose');

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);

  return (
    <div className="pira-app-layout">
      <header className="pira-product-bar">
        <strong>
          <span>{document.iconLabel}</span>
          Pira
        </strong>
        <button type="button">PAY · payments</button>
        <nav aria-label="Pira sections">
          <span>Summary</span>
          <span>Board</span>
          <span>Backlog</span>
          <span className="pira-tab-active">Issues</span>
        </nav>
        <div className="pira-toolbar-spacer" />
        <span className="pira-search">⌕ search</span>
        <span className="pira-create">＋ Create</span>
      </header>

      <div className="pira-content">
        <aside className="pira-sidebar" aria-label="Pira navigation">
          <h2>PLANNING</h2>
          <span>▦ Board</span>
          <span>≣ Backlog</span>
          <span>◷ Sprint (Release W40)</span>
          <h2>ISSUES</h2>
          <strong>◉ BUG-418</strong>
          <span>My open issues</span>
          <span>Reported by me</span>
          <span>Recently updated</span>
          <h2>EPICS</h2>
          <span>▸ Payments v2 移行</span>
          <span>▸ 請求書出力 刷新</span>
        </aside>

        <main className="pira-issue-main">
          <div className="pira-breadcrumb">
            PAY / <span>BUG-418</span>
          </div>
          <section className="pira-issue-grid">
            <article className="pira-issue-body">
              <h1>legacy_plan=true の顧客で checkout_v2 が失敗する</h1>
              <div className="pira-issue-meta">
                <span className="pira-status-open">● OPEN</span>
                <span className="pira-priority">↑ Priority P2</span>
                <small>担当: 黒瀬 · 報告: 三村</small>
              </div>

              <section className="pira-section">
                <h2>説明</h2>
                <p>
                  checkout_v2 の migration 後、一部の legacy 顧客で決済処理が 500 になる。
                  再現条件を切り分け中。invoice export と UI は feature flag 管理下。
                </p>
              </section>

              <section className="pira-section pira-activity">
                <h2>アクティビティ / コメント</h2>
                <article className="pira-comment">
                  {qaCharacter ? <Avatar character={qaCharacter} size="small" /> : null}
                  <div>
                    <header>
                      <strong>三村</strong>
                      <span className="pira-role-qa">QA</span>
                      <time>2時間前</time>
                    </header>
                    <p>
                      staging で3回再現しました。
                      <PiraEvidenceSnippet
                        document={document}
                        line={evidenceLine}
                        acquired={acquired}
                        onAcquire={onAcquire}
                      />
                      になります。
                    </p>
                  </div>
                </article>

                <article className="pira-comment">
                  {techLeadCharacter ? <Avatar character={techLeadCharacter} size="small" /> : null}
                  <div>
                    <header>
                      <strong>黒瀬</strong>
                      <span className="pira-role-techlead">Tech Lead</span>
                      <time>1時間前</time>
                    </header>
                    <p>
                      既存データの揺れによるものです。リリース後の cleanup で対応可能なので、
                      P2 のままで問題ないと思います。
                    </p>
                  </div>
                </article>
              </section>
            </article>

            <aside className="pira-detail-card" aria-label="BUG-418 details">
              <header>詳細</header>
              <dl>
                <div>
                  <dt>担当者</dt>
                  <dd>黒瀬</dd>
                </div>
                <div>
                  <dt>報告者</dt>
                  <dd>三村</dd>
                </div>
                <div>
                  <dt>ラベル</dt>
                  <dd>
                    <span>payments</span>
                    <span className="pira-label-warn">legacy</span>
                  </dd>
                </div>
                <div>
                  <dt>Sprint</dt>
                  <dd>Release W40</dd>
                </div>
                <div>
                  <dt>Fix version</dt>
                  <dd>v2.0.0</dd>
                </div>
                <div>
                  <dt>関連</dt>
                  <dd>
                    <a>relates to BUG-390</a>
                    <small>(flaky?)</small>
                  </dd>
                </div>
              </dl>
              <footer>作成 3日前 · 更新 2時間前</footer>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

function PrEvidenceComment({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`pr-review-evidence ${acquired ? 'pr-review-evidence-acquired' : ''}`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      {acquired ? '取得済み: ' : null}
      {line.text}
    </button>
  );
}

function PrDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find((line) => line.id === 'pr_legacy_tax_null_review');
  const qaCharacter = getCharacter('qa_mimura');
  const techLeadCharacter = getCharacter('techlead_kurose');

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);

  return (
    <div className="pr-app-layout">
      <header className="pr-header">
        <div className="pr-title-row">
          <h1>
            invoice export v2 のフォーマット対応 <span>#312</span>
          </h1>
          <strong>● OPEN</strong>
        </div>
        <div className="pr-branch-row">
          <span>
            <b>黒瀬</b> が <em>feat/invoice-v2</em> → <em>main</em> にマージしたい
          </span>
          <span className="pr-check-failing">● Checks: 1 failing</span>
        </div>
        <nav className="pr-tabs" aria-label="Pull request sections">
          <span>Conversation</span>
          <span>
            Commits <small>3</small>
          </span>
          <span>
            Checks <small className="pr-tab-danger">1</small>
          </span>
          <span className="pr-tab-active">
            Files changed <small>4</small>
          </span>
        </nav>
      </header>

      <div className="pr-content">
        <aside className="pr-file-tree" aria-label="Changed files">
          <h2>CHANGED FILES</h2>
          <strong>
            checkout_v2.rb <span>+12</span>
            <em>-3</em>
          </strong>
          <span>
            invoice_export.rb <small>+40</small>
          </span>
          <span>
            2024..._migration.rb <small>+22</small>
          </span>
          <span>
            checkout_v2_spec.rb <small>+18</small>
          </span>
          <h2>1 unresolved</h2>
          <p>checkout_v2.rb:88 に未解決の会話</p>
        </aside>

        <main className="pr-diff-view">
          <h2>app/services/checkout_v2.rb</h2>
          <section className="pr-diff-card" aria-label="checkout_v2.rb diff">
            <div className="pr-code-line pr-code-context">
              <span>85</span>
              <code>def apply_tax(order)</code>
            </div>
            <div className="pr-code-line pr-code-add">
              <span>+86</span>
              <code>category = order.tax_category</code>
            </div>
            <div className="pr-code-line pr-code-remove">
              <span>-87</span>
              <code>rate = order.tax_category.rate</code>
            </div>
            <div className="pr-code-line pr-code-add">
              <span>+88</span>
              <code>
                rate = category.rate <b># ← tax_category が null だと落ちる</b>
              </code>
            </div>

            <section className="pr-inline-thread" aria-label="Inline review thread">
              <article className="pr-review-comment">
                {qaCharacter ? <Avatar character={qaCharacter} size="small" /> : null}
                <div>
                  <header>
                    <strong>三村</strong>
                    <span className="pr-role-reviewer">Reviewer</span>
                    <time>3日前</time>
                  </header>
                  <PrEvidenceComment
                    document={document}
                    line={evidenceLine}
                    acquired={acquired}
                    onAcquire={onAcquire}
                  />
                </div>
              </article>

              <article className="pr-review-comment">
                {techLeadCharacter ? <Avatar character={techLeadCharacter} size="small" /> : null}
                <div>
                  <header>
                    <strong>黒瀬</strong>
                    <span className="pr-role-author">Author</span>
                    <time>3日前</time>
                  </header>
                  <p>
                    通常フローでは tax_category は必須なので問題ない想定です。古い顧客データは別途
                    cleanup で対応予定。
                  </p>
                  <footer>Author が Resolved にした</footer>
                </div>
              </article>
            </section>

            <div className="pr-code-line pr-code-context">
              <span>89</span>
              <code>order.subtotal * rate</code>
            </div>
            <div className="pr-code-line pr-code-context">
              <span>90</span>
              <code>end</code>
            </div>
          </section>
        </main>

        <aside className="pr-side-panel" aria-label="Pull request status">
          <section>
            <h2>Reviewers</h2>
            <p>
              <span className="pr-dot-warning" />
              三村 <em>コメント</em>
            </p>
          </section>
          <section>
            <h2>Checks</h2>
            <p className="pr-check-row-danger">
              ✕ CI / test <em>#1841</em>
            </p>
            <p className="pr-check-row-ok">✓ lint</p>
          </section>
          <div className="pr-merge-box">
            <strong>⚠ マージ不可</strong>
            <p>必須チェックが失敗しています</p>
            <span>Merge</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StagingEvidenceLogRow({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`staging-evidence-log ${acquired ? 'staging-evidence-log-acquired' : ''}`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      {acquired ? '取得済み: ' : null}
      POST /checkout 500 - NoMethodError: undefined method `rate` for nil
      <span>legacy_plan=true / tax_category=null</span>
    </button>
  );
}

function StagingDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find(
    (line) => line.id === 'staging_repeated_500_legacy_tax_null',
  );

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);

  return (
    <div className="staging-app-layout">
      <header className="staging-filter-bar">
        <strong>
          <span>{document.iconLabel}</span>
          Staging Logs
        </strong>
        <span className="staging-chip staging-chip-env">env: staging ▾</span>
        <span className="staging-chip staging-chip-error">status: 500</span>
        <span className="staging-chip">last 24h</span>
        <div className="staging-live">
          <i />
          Live tail
        </div>
      </header>

      <div className="staging-content">
        <aside className="staging-sidebar" aria-label="Staging log filters">
          <h2>ENVIRONMENTS</h2>
          <span>production</span>
          <strong>staging</strong>
          <span>preview</span>

          <h2>SERVICES</h2>
          <strong className="staging-service-active">◉ payments-api</strong>
          <span>invoice-worker</span>
          <span>migration-runner</span>

          <h2>SAVED</h2>
          <strong className="staging-error-filter">● 5xx errors</strong>
          <span>slow queries</span>

          <section className="staging-summary-card">
            <strong>直近24h</strong>
            <p>
              5xx: <b>14件</b>
              <br />
              CheckoutV2経由: <b>11件</b>
            </p>
          </section>
        </aside>

        <main className="staging-log-view">
          <div className="staging-log-header" aria-hidden="true">
            <span>Timestamp</span>
            <span>Level</span>
            <span>Message</span>
          </div>

          <div className="staging-log-list">
            <div className="staging-log-row">
              <time>21:31:04.882</time>
              <span className="staging-level staging-level-info">INFO</span>
              <p>POST /checkout 200 - plan=standard tax_category=std_10</p>
            </div>
            <div className="staging-log-row">
              <time>21:33:47.119</time>
              <span className="staging-level staging-level-warn">WARN</span>
              <p>CheckoutV2: tax_category missing for legacy_plan account #48213</p>
            </div>
            <div className="staging-log-row staging-log-row-error">
              <time>21:33:47.121</time>
              <span className="staging-level staging-level-error">ERROR</span>
              <p>
                <StagingEvidenceLogRow
                  document={document}
                  line={evidenceLine}
                  acquired={acquired}
                  onAcquire={onAcquire}
                />
              </p>
            </div>
            <div className="staging-stack-row">
              <span />
              <span />
              <p>at app/services/checkout_v2.rb:88:in `apply_tax`</p>
            </div>
            <div className="staging-log-row">
              <time>21:35:12.640</time>
              <span className="staging-level staging-level-error">ERROR</span>
              <p>POST /checkout 500 - 同上 (account #50934, legacy_plan=true)</p>
            </div>
            <div className="staging-log-row">
              <time>21:38:55.402</time>
              <span className="staging-level staging-level-error">ERROR</span>
              <p>POST /checkout 500 - 同上 (account #51120, legacy_plan=true)</p>
            </div>
            <div className="staging-log-row">
              <time>21:41:09.771</time>
              <span className="staging-level staging-level-info">INFO</span>
              <p>POST /checkout 200 - plan=standard tax_category=std_10</p>
            </div>
            <div className="staging-tail-note">
              <span />
              <span />
              <p>...同条件の 500 が計 11件（すべて legacy_plan=true / tax_category=null）</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MailEvidencePhrase({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`mail-evidence-phrase ${acquired ? 'mail-evidence-phrase-acquired' : ''}`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      {acquired ? '取得済み: ' : null}
      今月中に必要なのは、請求書出力（invoice export）の新フォーマット対応だけです。
    </button>
  );
}

function MailDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find((line) => line.id === 'mail_invoice_only_this_month');

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);

  return (
    <div className="mail-app-layout">
      <div className="mail-content">
        <aside className="mail-folder-sidebar" aria-label="Mail folders">
          <button type="button">✎ 作成</button>
          <strong>
            ✉ 受信 <span>3</span>
          </strong>
          <span>★ スター付き</span>
          <span>➤ 送信済み</span>
          <span>✎ 下書き</span>
          <h2>ラベル</h2>
          <p>
            <i className="mail-label-customer" />
            顧客対応
          </p>
          <p>
            <i className="mail-label-release" />
            リリース
          </p>
        </aside>

        <aside className="mail-thread-list" aria-label="Inbox messages">
          <header>
            受信トレイ <span>3件</span>
          </header>
          <article className="mail-thread-active">
            <div>
              <strong>田辺（GreenBooks社）</strong>
              <time>18:22</time>
            </div>
            <h2>Re: 決済v2 リリース時期のご相談</h2>
            <p>今月中に必要なのは請求書出力の対応でして...</p>
          </article>
          <article>
            <div>
              <strong>桐谷（社内 Sales）</strong>
              <time>16:40</time>
            </div>
            <h2>顧客に今月中と伝えてあります</h2>
            <p>先方には決済v2で調整済みなので...</p>
          </article>
          <article>
            <div>
              <strong>請求システム 通知</strong>
              <time>昨日</time>
            </div>
            <h2>月次請求バッチの実行予定</h2>
            <p>来月1日 02:00 に自動実行されます</p>
          </article>
        </aside>

        <main className="mail-message-view">
          <h1>Re: 決済v2 リリース時期のご相談</h1>
          <header className="mail-message-meta">
            <div className="mail-sender-avatar">田辺</div>
            <div>
              <strong>
                田辺 誠一 <span>&lt;tanabe@greenbooks.co.jp&gt;</span>
              </strong>
              <p>宛先: 自分, 桐谷 · 木 18:22</p>
            </div>
            <em>顧客対応</em>
          </header>

          <div className="mail-body-copy">
            <p>お世話になっております、GreenBooksの田辺です。</p>
            <p>
              決済v2のリリース時期についてですが、こちらの都合を正直にお伝えします。
              <br />
              <MailEvidencePhrase
                document={document}
                line={evidenceLine}
                acquired={acquired}
                onAcquire={onAcquire}
              />
              <br />
              月末の請求業務でどうしても新しい様式が要るためで、決済フロー全体（checkout）の刷新は、正直まだ急いでいません。
            </p>
            <p>
              むしろ決済まわりは、慎重に出していただいて構いません。こちらで困るのは請求書の様式だけなので、そこだけ間に合えば大丈夫です。
            </p>
            <p>
              よろしくお願いいたします。
              <br />
              田辺
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function RollbackEvidenceWarning({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`rollback-evidence-warning ${
        acquired ? 'rollback-evidence-warning-acquired' : ''
      }`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      {acquired ? '取得済み: ' : null}
      このマイグレーションは旧カラムを drop するため、実行後に完全な形へ戻す手段は無い。
    </button>
  );
}

function RollbackDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find((line) => line.id === 'rollback_migration_irreversible');

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);

  return (
    <div className="rollback-app-layout">
      <header className="rollback-breadcrumb-bar">
        <strong>
          <span>{document.iconLabel}</span>
          Runbook
        </strong>
        <span>payments</span>
        <i>/</i>
        <span>release</span>
        <i>/</i>
        <em>rollback-procedure.md</em>
        <time>最終更新 5日前 · 黒瀬</time>
      </header>

      <div className="rollback-content">
        <aside className="rollback-toc" aria-label="Runbook table of contents">
          <h2>目次</h2>
          <span>1. 概要</span>
          <span>2. 事前確認</span>
          <strong>3. 対象別ロールバック</strong>
          <span className="rollback-toc-child">3.1 checkout_v2 UI</span>
          <span className="rollback-toc-child">3.2 invoice export</span>
          <span className="rollback-toc-child rollback-toc-danger">3.3 data migration</span>
          <span>4. 連絡フロー</span>

          <section className="rollback-warning-card">
            <strong>⚠ 注意</strong>
            <p>
              3.3 のみ<b>不可逆</b>の操作を含みます
            </p>
          </section>
        </aside>

        <main className="rollback-document">
          <h1>ロールバック手順 — 決済v2 リリース</h1>
          <span className="rollback-section-label">3. 対象別ロールバック</span>

          <div className="rollback-step-list">
            <section className="rollback-step-card">
              <span className="rollback-badge rollback-badge-safe">可逆 ✓</span>
              <div>
                <h2>3.1 checkout_v2 UI</h2>
                <p>
                  Feature Flag <code>checkout_v2_ui</code> を off にするだけ。デプロイ不要で
                  即時に旧UIへ戻せる。
                </p>
              </div>
            </section>

            <section className="rollback-step-card">
              <span className="rollback-badge rollback-badge-safe">可逆 ✓</span>
              <div>
                <h2>3.2 invoice export</h2>
                <p>
                  出力フォーマットの追加のみ。旧フォーマットは残っており、フラグ off
                  で従来出力に戻る。データ破壊なし。
                </p>
              </div>
            </section>

            <section className="rollback-step-card rollback-step-danger">
              <span className="rollback-badge rollback-badge-danger">不可逆 ✕</span>
              <div>
                <h2>3.3 customer_data_migration</h2>
                <p>
                  <RollbackEvidenceWarning
                    document={document}
                    line={evidenceLine}
                    acquired={acquired}
                    onAcquire={onAcquire}
                  />
                </p>
                <p>
                  バックアップからの復元は「前日分まで」で、当日の書き込みは失われる。
                  checkout や invoice と違い、<b>フラグ off では戻せない</b>。一度出したら
                  取り消せない前提で Go/No-Go を判断すること。
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function FFlagEvidenceRow({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`fflag-table-row fflag-evidence-row ${
        acquired ? 'fflag-evidence-row-acquired' : ''
      }`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      <span className="fflag-key-cell">
        <strong>{acquired ? '取得済み: checkout_v2_ui' : 'checkout_v2_ui'}</strong>
        <small>新しい決済フロー画面 - invoice とは別フラグ</small>
      </span>
      <span className="fflag-positive-cell">なし（独立）</span>
      <span className="fflag-positive-cell">即 off 可</span>
      <span className="fflag-state-cell">
        <span className="fflag-toggle fflag-toggle-off">
          <i />
        </span>
      </span>
    </button>
  );
}

function FFlagDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find(
    (line) => line.id === 'fflag_independent_invoice_checkout',
  );

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);

  return (
    <div className="fflag-app-layout">
      <header className="fflag-toolbar">
        <strong>
          <span>{document.iconLabel}</span>
          Feature Flags
        </strong>
        <span className="fflag-chip fflag-project-chip">project: payments-api ▾</span>
        <span className="fflag-chip">env: production</span>
        <button type="button">＋ New flag</button>
      </header>

      <main className="fflag-content">
        <section className="fflag-summary">
          <div>
            <span>決済v2 リリース関連フラグ</span>
            <p>各フラグは独立して切り替え可能。ひとつ on にしても他は連動しない。</p>
          </div>
          <dl>
            <div>
              <dt>Production</dt>
              <dd>4 flags</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>21:40</dd>
            </div>
          </dl>
        </section>

        <section className="fflag-table" aria-label="Feature flag list">
          <div className="fflag-table-header" aria-hidden="true">
            <span>FLAG KEY</span>
            <span>依存</span>
            <span>ロールバック</span>
            <span>状態</span>
          </div>

          <div className="fflag-table-row">
            <span className="fflag-key-cell">
              <strong>invoice_export_v2</strong>
              <small>請求書出力の新フォーマット</small>
            </span>
            <span className="fflag-positive-cell">なし（独立）</span>
            <span className="fflag-positive-cell">即 off 可</span>
            <span className="fflag-state-cell">
              <span className="fflag-toggle fflag-toggle-on">
                <i />
              </span>
            </span>
          </div>

          <FFlagEvidenceRow
            document={document}
            line={evidenceLine}
            acquired={acquired}
            onAcquire={onAcquire}
          />

          <div className="fflag-table-row">
            <span className="fflag-key-cell">
              <strong>checkout_v2_tax_calc</strong>
              <small>税計算ロジック（CI失敗中の箇所）</small>
            </span>
            <span>checkout_v2_ui</span>
            <span className="fflag-positive-cell">即 off 可</span>
            <span className="fflag-state-cell">
              <span className="fflag-toggle fflag-toggle-off">
                <i />
              </span>
            </span>
          </div>

          <div className="fflag-table-row fflag-migration-row">
            <span className="fflag-key-cell">
              <strong>customer_data_migration</strong>
              <small>スキーマ移行 - フラグ管理外 / 一度実行すると戻せない</small>
            </span>
            <span>-</span>
            <span>不可逆</span>
            <span className="fflag-state-cell">
              <em>flag外</em>
            </span>
          </div>
        </section>

        <aside className="fflag-release-note">
          <strong>分割リリースが可能</strong>
          <span>
            invoice_export_v2 だけ on、checkout_v2_ui は off のまま出せる。migration は別途
            Go/No-Go 判断が必要。
          </span>
        </aside>
      </main>
    </div>
  );
}

function IncidentTimelineEvidence({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`incident-timeline-highlight ${
        acquired ? 'incident-timeline-highlight-acquired' : ''
      }`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      {acquired ? '取得済み: ' : null}
      QAが「legacy顧客で未検証」と事前に指摘したが、期限を理由に一括リリースを決定した。
    </button>
  );
}

function IncidentDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find((line) => line.id === 'incident_flaky_staging_warning');

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);

  return (
    <div className="incident-app-layout">
      <header className="incident-breadcrumb-bar">
        <strong>
          <span>{document.iconLabel}</span>
          Incidents
        </strong>
        <span>postmortem</span>
        <i>/</i>
        <em>INC-203</em>
        <time>4か月前 · resolved</time>
      </header>

      <div className="incident-content">
        <aside className="incident-sidebar" aria-label="過去のインシデント">
          <h2>過去のインシデント</h2>
          <article className="incident-list-card incident-list-card-active">
            <strong>INC-203</strong>
            <span>請求刷新 一括リリース障害</span>
          </article>
          <article className="incident-list-card">
            <strong>INC-188</strong>
            <span>決済タイムアウト</span>
          </article>
          <article className="incident-list-card">
            <strong>INC-142</strong>
            <span>webhook 重複送信</span>
          </article>

          <section className="incident-similarity-card">
            <strong>類似度</strong>
            <p>
              今回の状況と <b>高</b>：QAが事前に懸念を出していた点が共通
            </p>
          </section>
        </aside>

        <main className="incident-document">
          <h1>INC-203: 請求刷新の一括リリースで legacy 顧客に障害</h1>

          <div className="incident-pill-row">
            <span>Severity SEV-2</span>
            <strong>resolved</strong>
            <em>影響: legacy顧客 約120件 / 2時間</em>
          </div>

          <section>
            <h2>概要</h2>
            <p className="incident-summary-box">
              請求システム刷新を、機能を分割せず一括でリリース。移行対象外だった
              legacy 顧客のデータ形式で請求書生成が失敗し、月次請求が2時間停止した。
            </p>
          </section>

          <section>
            <h2>タイムライン（抜粋）</h2>
            <div className="incident-timeline">
              <div className="incident-timeline-row">
                <time>-3日</time>
                <span>
                  <IncidentTimelineEvidence
                    document={document}
                    line={evidenceLine}
                    acquired={acquired}
                    onAcquire={onAcquire}
                  />
                </span>
              </div>
              <div className="incident-timeline-row">
                <time>0:00</time>
                <span>リリース直後から legacy 顧客の請求書生成が 500。</span>
              </div>
              <div className="incident-timeline-row">
                <time>2:05</time>
                <span>全面ロールバックで復旧。当日の一部請求が再送対応に。</span>
              </div>
            </div>
          </section>

          <section>
            <h2>学び</h2>
            <p className="incident-learning">
              機能を分割せず一括で出したことが被害を広げた。QAの事前懸念は、期限との
              トレードオフとして扱われ、検証範囲の議論に至らなかった。
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

function CpuSpikeEvidenceRow({
  document,
  line,
  acquired,
  onAcquire,
}: {
  document: DocumentDefinition;
  line: DocumentLine & { evidenceId: EvidenceId };
  acquired: boolean;
  onAcquire: AcquireEvidenceHandler;
}) {
  return (
    <button
      className={`cpu-event-row cpu-event-evidence ${
        acquired ? 'cpu-event-evidence-acquired' : ''
      }`}
      type="button"
      disabled={acquired}
      onClick={() => onAcquire(document.id, line)}
    >
      <time>21:08</time>
      <span className="cpu-event-status cpu-event-status-warn">WARN</span>
      <span className="cpu-event-message">
        <strong>{acquired ? '取得済み: CPU 92% spike' : 'CPU 92% spike'}</strong>
        <small>原因は analytics-team の load-test-worker。checkout_v2 migration とは直接関係が薄い。</small>
      </span>
    </button>
  );
}

function CpuDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const evidenceLine = document.lines.find((line) => line.id === 'cpu_spike_load_test');

  if (!evidenceLine || !isClickableEvidenceLine(evidenceLine)) {
    return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  const acquired = state.acquiredEvidence.includes(evidenceLine.evidenceId);
  const chartPoints = [38, 41, 39, 44, 47, 52, 92, 88, 61, 43, 37, 36] as const;

  return (
    <div className="cpu-app-layout">
      <header className="cpu-toolbar">
        <strong>
          <span>{document.iconLabel}</span>
          Metrics
        </strong>
        <span className="cpu-chip cpu-chip-env">env: staging ▾</span>
        <span className="cpu-chip">service: payments-api</span>
        <span className="cpu-chip">window: last 30m</span>
        <div className="cpu-live-indicator">
          <i />
          Streaming
        </div>
      </header>

      <div className="cpu-content">
        <aside className="cpu-sidebar" aria-label="Metric navigation">
          <h2>DASHBOARDS</h2>
          <strong>▧ Resource usage</strong>
          <span>Latency / p95</span>
          <span>Error rate</span>
          <span>Checkout funnel</span>

          <h2>FILTERS</h2>
          <span>production</span>
          <strong className="cpu-filter-active">staging</strong>
          <span>payments-api</span>
          <span>invoice-worker</span>

          <section className="cpu-side-note">
            <strong>注記</strong>
            <p>同時刻に別チームの負荷テストが走っている。</p>
          </section>
        </aside>

        <main className="cpu-main">
          <section className="cpu-stat-grid" aria-label="Metric summary">
            <article>
              <span>CPU peak</span>
              <strong>92%</strong>
              <em>4 min</em>
            </article>
            <article>
              <span>Error rate</span>
              <strong>0.3%</strong>
              <em>no correlation</em>
            </article>
            <article>
              <span>Worker</span>
              <strong>analytics</strong>
              <em>load test</em>
            </article>
            <article>
              <span>Checkout impact</span>
              <strong>薄い</strong>
              <em>別原因</em>
            </article>
          </section>

          <section className="cpu-chart-panel" aria-label="CPU usage chart">
            <header>
              <div>
                <span>CPU usage / staging</span>
                <h2>21:08 に一時スパイク</h2>
              </div>
              <strong>max 92%</strong>
            </header>
            <div className="cpu-chart">
              {chartPoints.map((point, index) => (
                <span
                  key={`${point}-${index}`}
                  className={point >= 80 ? 'cpu-chart-bar cpu-chart-bar-spike' : 'cpu-chart-bar'}
                  style={{ height: `${point}%` }}
                >
                  <i>{point}%</i>
                </span>
              ))}
            </div>
            <div className="cpu-chart-axis">
              <span>20:56</span>
              <span>21:02</span>
              <strong>21:08</strong>
              <span>21:14</span>
              <span>21:20</span>
            </div>
          </section>

          <section className="cpu-event-panel" aria-label="Metric events">
            <header>
              <span>Timestamp</span>
              <span>Level</span>
              <span>Event</span>
            </header>
            <div className="cpu-event-row">
              <time>21:03</time>
              <span className="cpu-event-status cpu-event-status-ok">INFO</span>
              <span className="cpu-event-message">checkout_v2 migration dry-run started</span>
            </div>
            <CpuSpikeEvidenceRow
              document={document}
              line={evidenceLine}
              acquired={acquired}
              onAcquire={onAcquire}
            />
            <div className="cpu-event-row">
              <time>21:09</time>
              <span className="cpu-event-status cpu-event-status-info">INFO</span>
              <span className="cpu-event-message">
                load-test-worker / analytics-team started batch simulation
              </span>
            </div>
            <div className="cpu-event-row">
              <time>21:13</time>
              <span className="cpu-event-status cpu-event-status-ok">OK</span>
              <span className="cpu-event-message">CPU returned to baseline. Checkout 500 trend unchanged.</span>
            </div>
          </section>

          <aside className="cpu-relevance-note">
            <strong>今回の判断材料としては注意</strong>
            <span>CPU 異常は見えるが、発生源は別チームの負荷テスト。checkout_v2 の 500 と直接つながらない。</span>
          </aside>
        </main>
      </div>
    </div>
  );
}

function PilackDocumentContent({ state }: { state: GameState }) {
  return (
    <div className="pilack-layout pilack-explorer">
      <aside className="workspace-rail">
        <div className="workspace-active">A</div>
        <div>M</div>
        <div>個</div>
        <div>+</div>
        <div className="workspace-user">自分</div>
      </aside>

      <aside className="channel-sidebar pilack-sidebar">
        <div className="pilack-workspace-header">
          <h2>Acme Payments</h2>
          <span>✎</span>
        </div>

        <nav className="pilack-nav" aria-label="Pilack navigation">
          <span>≡ スレッド</span>
          <span>✉ DM</span>
          <span>@ メンション</span>
        </nav>

        <p>▾ チャンネル</p>
        <span># general</span>
        <strong># release-check</strong>
        <span># payments-platform</span>
        <span>
          # incidents <em>3</em>
        </span>
        <span># qa-signoff</span>

        <p>▾ ダイレクトメッセージ</p>
        {stage.characters
          .filter((character) => character.id !== 'player')
          .map((character) => (
            <span key={character.id} className="pilack-dm-row">
              <i />
              {character.displayName}（{character.roleLabel}）
            </span>
          ))}
      </aside>

      <section className="pilack-main">
        <header className="channel-header pilack-channel-header">
          <div>
            <h1>
              # release-check <span>☆</span>
            </h1>
            <p>決済v2リリースの最終確認</p>
          </div>
          <div className="pilack-header-tools" aria-label="channel tools">
            <span className="pilack-member-stack">
              <i />
              <i />
              <i />
            </span>
            <span>{stage.characters.length - 1}</span>
            <span>⌕</span>
            <span>ⓘ</span>
          </div>
        </header>

        <div className="message-stream pilack-document-stream">
          <div className="date-chip">今日</div>

          {prologueMessages.map((message) => {
            if (message.kind === 'bot') {
              return (
                <article key={message.id} className="pilack-bot-message">
                  <div className="pilack-bot-avatar">CI</div>
                  <div>
                    <div className="message-meta">
                      <strong>ci-bot</strong>
                      <span>APP</span>
                      <time>21:02</time>
                    </div>
                    <div className="bot-message">
                      <strong>{message.title}</strong>
                      <span>{message.text}</span>
                      <small>{message.meta}</small>
                    </div>
                  </div>
                </article>
              );
            }

            const character = getCharacter(message.speakerId);

            if (!character) {
              return null;
            }

            return (
              <article
                key={message.id}
                className={`chat-message ${message.emphasized ? 'warning-message' : ''}`}
              >
                <Avatar character={character} size="small" />
                <div>
                  <div className="message-meta">
                    <strong>{character.displayName}</strong>
                    <span>{character.roleLabel}</span>
                    <time>{message.timestamp}</time>
                  </div>
                  <p>{message.text}</p>
                  {message.id === 'pm-saeki-go' ? (
                    <div className="pilack-reactions">
                      <span>👍 2</span>
                      <span>💬 2件の返信</span>
                    </div>
                  ) : null}
                  {message.id === 'qa-mimura-warning' ? (
                    <div className="pilack-reactions">
                      <span>👀 1</span>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}

          <div className="typing-row">
            <span />
            榊 が入力中...
          </div>
        </div>

        <footer className="pilack-composer">
          <div className="pilack-composer-toolbar">
            <span>B</span>
            <span>I</span>
            <span>S</span>
            <span>リンク</span>
            <span>@</span>
          </div>
          <div className="pilack-composer-input">#release-check へメッセージを送信</div>
          <p>
            取得済み判断材料: <strong>{state.acquiredEvidence.length}</strong>
            枚。会議前に資料で裏取りする。
          </p>
        </footer>
      </section>

    </div>
  );
}

type CiJobStatus = 'failed' | 'passed' | 'skipped';

type CiAnnotation = {
  tone: 'danger' | 'normal';
  text: string;
};

type CiJob = {
  id: string;
  status: CiJobStatus;
  label: string;
  title: string;
  step: string;
  startedAt: string;
  duration: string;
  runner: string;
  matrix: string;
  retries: string;
  consoleIntro: string[];
  consoleOutro: string[];
  annotations: CiAnnotation[];
  artifacts: string[];
  environment: Array<[string, string]>;
  showEvidenceLog: boolean;
};

function CiDocumentContent({
  document,
  state,
  onAcquire,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
}) {
  const headingLine = document.lines.find((line) => line.style === 'heading');
  const logLines = document.lines.filter((line) => line.style !== 'heading');
  const ciJobs: CiJob[] = [
    {
      id: 'checkout-v2-migration',
      status: 'failed',
      label: 'CheckoutV2MigrationSpec',
      title: headingLine?.text ?? document.title,
      step: 'yarn test CheckoutV2MigrationSpec',
      startedAt: '21:06:14',
      duration: '4m 12s',
      runner: 'ubuntu-22.04',
      matrix: 'node 20 / jp',
      retries: '3 / 3',
      consoleIntro: [
        'Installing dependencies from cache... hit 87%',
        'Using fixture customer: legacy_2048 / locale=ja-JP',
      ],
      consoleOutro: ['Uploading junit.xml and retry metadata...'],
      annotations: [
        { tone: 'danger', text: '1 failing assertion in checkout tax line build.' },
        { tone: 'normal', text: '2 warnings from deprecation checks are unrelated.' },
      ],
      artifacts: ['junit-checkout-v2.xml', 'fixture-legacy_2048.json', 'retry-3-console.log'],
      environment: [
        ['PAYMENT_V2', 'enabled'],
        ['TAX_MIGRATION', 'dry-run'],
        ['DB snapshot', '2026-07-04 23:10'],
      ],
      showEvidenceLog: true,
    },
    {
      id: 'payment-unit',
      status: 'passed',
      label: 'payment_calculator',
      title: 'payment_calculator',
      step: 'yarn test payment_calculator',
      startedAt: '21:03:02',
      duration: '1m 18s',
      runner: 'ubuntu-22.04',
      matrix: 'node 20 / jp',
      retries: '0 / 1',
      consoleIntro: [
        'Running PaymentCalculatorSpec with 48 examples...',
        'tax rounding: standard plan / prorated monthly invoice passed',
        'discount stacking: coupon + campaign credit passed',
        'legacy compatibility: old tax category mapper passed',
        'Finished in 28.41 seconds, 48 examples, 0 failures',
      ],
      consoleOutro: ['Uploading coverage-payment.json...'],
      annotations: [
        { tone: 'normal', text: 'No failing assertions in this job.' },
        { tone: 'normal', text: 'Coverage changed +0.2% from previous run.' },
      ],
      artifacts: ['coverage-payment.json', 'payment-unit-junit.xml'],
      environment: [
        ['PAYMENT_V2', 'enabled'],
        ['TAX_MIGRATION', 'dry-run'],
        ['DB snapshot', '2026-07-04 23:10'],
      ],
      showEvidenceLog: false,
    },
    {
      id: 'invoice-export-e2e',
      status: 'passed',
      label: 'invoice_export_v2',
      title: 'invoice_export_v2',
      step: 'yarn e2e invoice_export_v2',
      startedAt: '21:04:21',
      duration: '2m 47s',
      runner: 'ubuntu-22.04',
      matrix: 'node 20 / jp',
      retries: '0 / 1',
      consoleIntro: [
        'Booting invoice export fixture set...',
        'account allowlist: acme-east, acme-west',
        'CSV formatter v2 snapshot matched',
        'PDF renderer smoke check passed',
        'Finished invoice_export_v2: 12 scenarios, 0 failures',
      ],
      consoleOutro: ['Uploading invoice-export-snapshots.zip...'],
      annotations: [
        { tone: 'normal', text: 'Snapshot update is not required.' },
        { tone: 'normal', text: 'This job does not exercise checkout_v2 session creation.' },
      ],
      artifacts: ['invoice-export-snapshots.zip', 'invoice-e2e-junit.xml'],
      environment: [
        ['INVOICE_EXPORT_V2', 'enabled'],
        ['ACCOUNT_ALLOWLIST', '2 accounts'],
        ['DB snapshot', '2026-07-04 23:10'],
      ],
      showEvidenceLog: false,
    },
    {
      id: 'lint-typecheck',
      status: 'passed',
      label: 'eslint / tsc',
      title: 'eslint / tsc',
      step: 'yarn lint && yarn tsc --noEmit',
      startedAt: '21:02:38',
      duration: '54s',
      runner: 'ubuntu-22.04',
      matrix: 'node 20 / jp',
      retries: '0 / 1',
      consoleIntro: [
        'eslint packages/payments --max-warnings=0',
        '0 errors, 0 warnings',
        'tsc --noEmit --pretty false',
        'Type check completed successfully',
      ],
      consoleOutro: ['No artifacts generated for lint-typecheck.'],
      annotations: [
        { tone: 'normal', text: 'Static checks passed.' },
        { tone: 'normal', text: 'Generated types are in sync.' },
      ],
      artifacts: ['eslint-report.json', 'tsbuildinfo-cache.txt'],
      environment: [
        ['NODE_OPTIONS', '--max-old-space-size=4096'],
        ['TS_VERSION', '5.6.3'],
        ['Cache key', 'payments-linux-node20'],
      ],
      showEvidenceLog: false,
    },
    {
      id: 'deploy-preview',
      status: 'skipped',
      label: 'preview deploy',
      title: 'preview deploy',
      step: 'deploy preview environment',
      startedAt: 'blocked',
      duration: '-',
      runner: 'n/a',
      matrix: 'n/a',
      retries: '-',
      consoleIntro: [
        'Skipped because required job checkout-v2-migration did not complete successfully.',
        'Preview URL was not created.',
      ],
      consoleOutro: ['No deployment artifacts were uploaded.'],
      annotations: [
        { tone: 'normal', text: 'Preview deploy waits for all test jobs.' },
        { tone: 'normal', text: 'This is a downstream effect, not the root failure.' },
      ],
      artifacts: ['deployment-summary.json'],
      environment: [
        ['Preview target', 'staging-shadow'],
        ['Deployment', 'skipped'],
        ['Reason', 'required check failed'],
      ],
      showEvidenceLog: false,
    },
  ];
  const [selectedJobId, setSelectedJobId] = useState('payment-unit');
  const selectedJob = ciJobs.find((job) => job.id === selectedJobId) ?? ciJobs[0];

  return (
    <div className="ci-app-layout">
      <aside className="ci-job-rail" aria-label="CI jobs">
        <div className="ci-workflow-title">
          <span>Workflow</span>
          <strong>release-check.yml</strong>
        </div>
        {ciJobs.map((job) => (
          <button
            key={job.id}
            className={`ci-job-item ci-job-${job.status} ${
              selectedJob.id === job.id ? 'ci-job-active' : ''
            }`}
            type="button"
            onClick={() => setSelectedJobId(job.id)}
          >
            <span />
            <strong>{job.label}</strong>
            <small>{job.status}</small>
          </button>
        ))}
      </aside>

      <section className="ci-run-view">
        <div className={`ci-run-banner ci-run-${selectedJob.status}`}>
          <div>
            <span>Build #1841</span>
            <h2>{selectedJob.title}</h2>
            <p>main · 8f3a91c · release-bot が 21:02 に開始</p>
          </div>
          <strong>{selectedJob.status}</strong>
        </div>

        <div className="ci-run-stats">
          <div>
            <span>Duration</span>
            <strong>{selectedJob.duration}</strong>
          </div>
          <div>
            <span>Runner</span>
            <strong>{selectedJob.runner}</strong>
          </div>
          <div>
            <span>Matrix</span>
            <strong>{selectedJob.matrix}</strong>
          </div>
          <div>
            <span>Retries</span>
            <strong>{selectedJob.retries}</strong>
          </div>
        </div>

        <div className="ci-log-panel">
          <header>
            <span>Step 4</span>
            <strong>{selectedJob.step}</strong>
            <time>{selectedJob.startedAt}</time>
          </header>
          <div className="ci-console">
            {selectedJob.consoleIntro.map((line) => (
              <div key={line} className="ci-console-line muted">
                {line}
              </div>
            ))}
            {selectedJob.showEvidenceLog
              ? logLines.map((line) => (
                  <DocumentLineEntry
                    key={line.id}
                    document={document}
                    line={line}
                    state={state}
                    onAcquire={onAcquire}
                  />
                ))
              : null}
            {selectedJob.consoleOutro.map((line) => (
              <div key={line} className="ci-console-line muted">
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="ci-detail-panel" aria-label="CI details">
        <section>
          <h3>Annotations</h3>
          {selectedJob.annotations.map((annotation) => (
            <p
              key={annotation.text}
              className={annotation.tone === 'danger' ? 'ci-annotation-danger' : undefined}
            >
              {annotation.text}
            </p>
          ))}
        </section>
        <section>
          <h3>Artifacts</h3>
          <ul>
            {selectedJob.artifacts.map((artifact) => (
              <li key={artifact}>{artifact}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Environment</h3>
          <dl>
            {selectedJob.environment.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </aside>
    </div>
  );
}

function DocumentAppContent({
  document,
  state,
  onAcquire,
  onOpenDocument,
}: {
  document: DocumentDefinition;
  state: GameState;
  onAcquire: AcquireEvidenceHandler;
  onOpenDocument?: (documentId: DocumentId) => void;
}) {
  if (document.id === 'pilack_release_check') {
    return <PilackDocumentContent state={state} />;
  }

  if (document.id === 'pira_bug_418') {
    return <PiraDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'pr_tax_category_comment') {
    return <PrDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'staging_500_log') {
    return <StagingDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'customer_email_scope') {
    return <MailDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'rollback_procedure') {
    return <RollbackDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'feature_flag_design') {
    return <FFlagDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'past_incident_report') {
    return <IncidentDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'cpu_spike_log') {
    return <CpuDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  if (document.id === 'ci_checkout_v2_failure') {
    return <CiDocumentContent document={document} state={state} onAcquire={onAcquire} />;
  }

  return <GenericDocumentContent document={document} state={state} onAcquire={onAcquire} />;
}

function EvidenceOverlay({
  evidenceIds,
  onClose,
}: {
  evidenceIds: EvidenceId[];
  onClose: () => void;
}) {
  return (
    <aside className="evidence-overlay" aria-label="判断材料メモ">
      <div className="evidence-overlay-header">
        <div>
          <span>Evidence Memo</span>
          <h2>判断材料メモ</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="判断材料メモを閉じる">
          ×
        </button>
      </div>
      {evidenceIds.length === 0 ? (
        <p>まだ判断材料はない。</p>
      ) : (
        <div className="evidence-card-stack">
          {evidenceIds.map((evidenceId) => {
            const evidence = getEvidence(evidenceId);

            return (
              <article key={evidence.id} className="mini-evidence-card">
                <strong>{evidence.shortTitle}</strong>
                <span>{evidence.factSummary}</span>
              </article>
            );
          })}
        </div>
      )}
    </aside>
  );
}

function EvidenceModal({
  evidenceId,
  onClose,
}: {
  evidenceId: EvidenceId;
  onClose: () => void;
}) {
  const evidence = getEvidence(evidenceId);
  const player = getCharacter('player');

  return (
    <div className="modal-backdrop">
      <section className="acquired-modal" role="dialog" aria-modal="true">
        <div className="modal-kicker">判断材料を追加</div>
        <div className="evidence-acquired-heading">
          <div>
            <h2>{evidence.title}</h2>
            <p>{evidence.factSummary}</p>
          </div>
          <strong>メモ追加</strong>
        </div>
        <div className="player-reaction">
          {player ? <Avatar character={player} size="large" /> : null}
          <div>
            <span>自分の所感</span>
            <p>この資料の事実関係を判断材料メモに残した。会議では発言内容と照らして確認する。</p>
          </div>
        </div>
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onClose}>
            メモに入れる
          </button>
        </div>
      </section>
    </div>
  );
}

function StartMeetingModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="acquired-modal" role="dialog" aria-modal="true">
        <div className="modal-kicker">会議開始</div>
        <h2>探索を終了して会議へ進む</h2>
        <p>会議開始後は資料探索へ戻れない。手元の判断材料だけで5ラウンドを進める。</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            探索を続ける
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            会議を開始
          </button>
        </div>
      </section>
    </div>
  );
}

function getExplorationComment({
  document,
  acquiredCount,
  meetingReady,
}: {
  document: DocumentDefinition;
  acquiredCount: number;
  meetingReady: boolean;
}) {
  if (document.id === 'pilack_release_check') {
    return {
      label: 'Pilack / release-check',
      text: `PilackではGo寄りの前提とQAの懸念が食い違っている。CI、Pira、顧客メールで裏取りしたい。判断材料は${acquiredCount}枚。`,
    };
  }

  if (document.id === 'pira_bug_418') {
    return {
      label: 'Pira / BUG-418',
      text:
        '黒瀬さんは「cleanup で後から対応」と書いてるけど、三村さんは同じ条件で staging で3回も再現させている。本当に P2 で後回しにしていい問題か？',
    };
  }

  if (document.id === 'pr_tax_category_comment') {
    return {
      label: 'PR / #312',
      text:
        'レビューで tax_category=null の参照エラーが指摘されていた。それを「通常フローでは必須」で Resolved にして流している。今CIで落ちている条件と同じだ。',
    };
  }

  if (document.id === 'staging_500_log') {
    return {
      label: 'Staging / Log Explorer',
      text: `CIだけじゃない。staging の実環境で 500 が11件、全部 legacy_plan=true / tax_category=null。判断材料は${acquiredCount}枚。`,
    };
  }

  if (document.id === 'customer_email_scope') {
    return {
      label: 'Mail / Customer email',
      text:
        '顧客が今月中に必要としているのは、請求書出力の新フォーマット対応だ。決済フロー全体は急いでいないと書かれている。',
    };
  }

  if (document.id === 'feature_flag_design') {
    return {
      label: 'FFlag / Feature Flag設計',
      text:
        'Feature Flagは invoice_export_v2、checkout_v2_ui、customer_data_migration で独立している。',
    };
  }

  if (document.id === 'rollback_procedure') {
    return {
      label: 'Rollbk / rollback-procedure.md',
      text: `checkout と invoice は戻せる。でも customer_data_migration だけは不可逆だ。全部まとめて出す判断は危ない。判断材料は${acquiredCount}枚。`,
    };
  }

  if (document.id === 'past_incident_report') {
    return {
      label: '議事録 / 過去障害報告',
      text:
        '過去障害では、staging警告とQAの事前懸念が残ったまま一括リリースされ、翌朝に障害化している。',
    };
  }

  if (document.id === 'cpu_spike_log') {
    return {
      label: 'CPU / Metrics',
      text:
        'CPUスパイクの原因メモには、別チームの負荷テストと記録されている。',
    };
  }

  return {
    label: 'EXPLORATION / 資料探索',
    text: meetingReady
      ? `判断材料が${acquiredCount}枚そろった。会議で使う材料はこのメモに残っている。`
      : `判断材料は${acquiredCount}枚。会議へ進むには、資料から最低2枚の判断材料を拾っておきたい。`,
  };
}

function ExplorationScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Parameters<ReturnType<typeof createGameReducer>>[1]>;
}) {
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showEvidenceOverlay, setShowEvidenceOverlay] = useState(false);
  const document = getDocument(state.currentDocumentId);
  const meetingReady = canStartMeeting(state);
  const explorationComment = getExplorationComment({
    document,
    acquiredCount: state.acquiredEvidence.length,
    meetingReady,
  });

  return (
    <AppFrame>
      <MenuBar title={document.appLabel} />
      <div className="exploration-desktop">
        <DocumentWindow
          document={document}
          state={state}
          onOpenDocument={(documentId) => dispatch({ type: 'OPEN_DOCUMENT', documentId })}
          onAcquire={(documentId, line) =>
            dispatch({
              type: 'ACQUIRE_EVIDENCE',
              evidenceId: line.evidenceId,
              documentId,
              lineId: line.id,
            })
          }
        />
        {showEvidenceOverlay ? (
          <EvidenceOverlay
            evidenceIds={state.acquiredEvidence}
            onClose={() => setShowEvidenceOverlay(false)}
          />
        ) : null}
      </div>
      <Dock
        currentDocumentId={state.currentDocumentId}
        onOpenDocument={(documentId) => dispatch({ type: 'OPEN_DOCUMENT', documentId })}
        onOpenEvidence={() => setShowEvidenceOverlay(true)}
        evidenceOpen={showEvidenceOverlay}
      />
      <BottomCommentBar
        label={explorationComment.label}
        text={explorationComment.text}
        action={
          <button
            className="primary-button"
            type="button"
            disabled={!meetingReady}
            onClick={() => setShowStartConfirm(true)}
          >
            ▸ 会議を開始
          </button>
        }
      />
      {state.lastAcquiredEvidenceId ? (
        <EvidenceModal
          evidenceId={state.lastAcquiredEvidenceId}
          onClose={() => dispatch({ type: 'DISMISS_EVIDENCE_MODAL' })}
        />
      ) : null}
      {showStartConfirm ? (
        <StartMeetingModal
          onCancel={() => setShowStartConfirm(false)}
          onConfirm={() => {
            setShowStartConfirm(false);
            dispatch({ type: 'START_MEETING' });
          }}
        />
      ) : null}
    </AppFrame>
  );
}

function ParticipantBar({ activeSpeakerId }: { activeSpeakerId: CharacterDefinition['id'] }) {
  return (
    <div className="participant-bar">
      {stage.characters.map((character) => {
        const active = character.id === activeSpeakerId;

        return (
          <div key={character.id} className={`participant ${active ? 'participant-active' : ''}`}>
            <Avatar character={character} size="small" active={active} />
            <div className="participant-copy">
              <strong>{character.displayName}</strong>
              <span>{character.roleLabel}</span>
            </div>
            {active ? <em>発言中</em> : null}
          </div>
        );
      })}
    </div>
  );
}

function MeetingDialogueMessage({
  line,
  round,
  selectedTargetId,
  onSelectTarget,
  current = false,
}: {
  line: DialogueLine;
  round?: MeetingRoundDefinition;
  selectedTargetId?: TargetId;
  onSelectTarget?: (targetId: TargetId) => void;
  current?: boolean;
}) {
  const speaker = getCharacter(line.speakerId);
  const lineHasTarget = round?.targetPhrases.some((target) => target.statementLineId === line.id);
  const isCurrentTargetLine = Boolean(current && round && lineHasTarget && onSelectTarget);
  const messageText =
    isCurrentTargetLine && round && onSelectTarget
      ? renderStatementText({
          line,
          round,
          selectedTargetId,
          onSelectTarget,
        })
      : line.text;

  return (
    <article
      className={`meeting-message meeting-message-npc ${
        isCurrentTargetLine ? 'meeting-message-current' : 'meeting-message-context'
      }`}
    >
      {speaker ? <Avatar character={speaker} active={isCurrentTargetLine} /> : null}
      <div className="meeting-message-content">
        <div className="message-meta">
          <strong>{speaker?.displayName}</strong>
          <span>{speaker?.roleLabel}</span>
          {round ? <time>{formatRoundLabel(round.id)}</time> : null}
        </div>
        <p>{messageText}</p>
      </div>
    </article>
  );
}

function MeetingOpeningBlock() {
  return (
    <div className="meeting-round-block meeting-opening-block">
      <div className="meeting-round-separator">
        <span>START</span>
        <strong>会議開始 / アジェンダ確認</strong>
      </div>
      {stage.meetingOpening.map((line) => (
        <MeetingDialogueMessage key={line.id} line={line} />
      ))}
    </div>
  );
}

function MeetingRoundStatementMessage({
  state,
  round,
  dispatch,
  current = false,
}: {
  state: GameState;
  round: MeetingRoundDefinition;
  dispatch: GameDispatch;
  current?: boolean;
}) {
  return (
    <>
      {round.npcStatement.map((line) => (
        <MeetingDialogueMessage
          key={line.id}
          line={line}
          round={round}
          selectedTargetId={state.meeting.selectedTargetId}
          onSelectTarget={(targetId) => dispatch({ type: 'SELECT_TARGET', targetId })}
          current={current}
        />
      ))}
    </>
  );
}

function MeetingLogEntryMessage({ entry }: { entry: MeetingLogEntry }) {
  const round = findRound(entry.roundId);
  const isPlayer = entry.id.endsWith('-player') || entry.id === 'final-decision';
  const isNpc = entry.id.endsWith('-npc');
  const isUnresolved = entry.id.endsWith('-unresolved');
  const character = isPlayer
    ? getCharacter('player')
    : isNpc && round
      ? getCharacter(round.speakerId)
      : undefined;

  if (!character) {
    return (
      <article
        className={`meeting-message meeting-message-system ${
          isUnresolved ? 'meeting-message-unresolved' : ''
        }`}
      >
        <div className={`meeting-system-marker ${isUnresolved ? 'meeting-system-marker-muted' : ''}`}>
          {isUnresolved ? '?' : '!'}
        </div>
        <div className="meeting-message-content">
          <div className="message-meta">
            <strong>{isUnresolved ? '未整理メモ' : '会議メモ'}</strong>
            <span>{formatRoundLabel(entry.roundId)}</span>
          </div>
          <p>{entry.text}</p>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`meeting-message meeting-message-log ${
        isPlayer ? 'meeting-message-player' : 'meeting-message-npc'
      }`}
    >
      <Avatar character={character} active={false} />
      <div className="meeting-message-content">
        <div className="message-meta">
          <strong>{character.displayName}</strong>
          <span>{isPlayer ? '自分の発言' : '相手の反応'}</span>
          <time>{formatRoundLabel(entry.roundId)}</time>
        </div>
        <p>{entry.text}</p>
      </div>
    </article>
  );
}

function MeetingRoundSeparator({
  round,
  current = false,
}: {
  round: MeetingRoundDefinition;
  current?: boolean;
}) {
  return (
    <div className={`meeting-round-separator ${current ? 'meeting-round-live' : ''}`}>
      <span>{current ? 'NOW' : formatRoundLabel(round.id)}</span>
      <strong>{round.title}</strong>
    </div>
  );
}

function MeetingLog({
  state,
  round,
  dispatch,
}: {
  state: GameState;
  round: MeetingRoundDefinition;
  dispatch: GameDispatch;
}) {
  const streamRef = useRef<HTMLDivElement>(null);
  const completedRounds = stage.meetingRounds.slice(0, state.meeting.currentRoundIndex);

  useEffect(() => {
    if (state.meeting.currentRoundIndex === 0 && state.meeting.logEntries.length === 0) {
      streamRef.current?.scrollTo({ top: 0 });
      return;
    }

    streamRef.current?.scrollTo({
      top: streamRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [round.id, state.meeting.currentRoundIndex, state.meeting.logEntries.length]);

  return (
    <section className="meeting-log-panel" aria-label="会議タイムライン">
      <header className="meeting-stream-header">
        <div>
          <span>DISCUSSION STREAM</span>
          <h2>会議タイムライン</h2>
        </div>
        <strong>{state.meeting.logEntries.length} logs</strong>
      </header>
      <div className="meeting-stream" ref={streamRef}>
        <MeetingOpeningBlock />
        {completedRounds.map((completedRound) => {
          const entries = state.meeting.logEntries.filter(
            (entry) => entry.roundId === completedRound.id,
          );

          return (
            <div key={completedRound.id} className="meeting-round-block">
              <MeetingRoundSeparator round={completedRound} />
              <MeetingRoundStatementMessage
                state={state}
                round={completedRound}
                dispatch={dispatch}
              />
              {entries.map((entry) => (
                <MeetingLogEntryMessage key={entry.id} entry={entry} />
              ))}
            </div>
          );
        })}
        <div className="meeting-round-block">
          <MeetingRoundSeparator round={round} current />
          <MeetingRoundStatementMessage state={state} round={round} dispatch={dispatch} current />
        </div>
      </div>
    </section>
  );
}

function EvidenceSelector({
  state,
  round,
  dispatch,
}: {
  state: GameState;
  round: MeetingRoundDefinition;
  dispatch: GameDispatch;
}) {
  function toggleEvidence(evidenceId: EvidenceId) {
    const selected = state.meeting.selectedEvidenceIds;

    if (round.maxEvidenceSelectable === 1) {
      dispatch({ type: 'SELECT_EVIDENCE', evidenceIds: selected[0] === evidenceId ? [] : [evidenceId] });
      return;
    }

    const next = selected.includes(evidenceId)
      ? selected.filter((id) => id !== evidenceId)
      : [...selected, evidenceId];

    dispatch({ type: 'SELECT_EVIDENCE', evidenceIds: next });
  }

  const limitReached =
    round.maxEvidenceSelectable > 1 &&
    state.meeting.selectedEvidenceIds.length >= round.maxEvidenceSelectable;

  return (
    <div className="choice-group">
      <div className="choice-heading">
        <h3>2. 判断材料</h3>
        <span>
          {state.meeting.selectedEvidenceIds.length}/{round.maxEvidenceSelectable}
        </span>
      </div>
      <button
        className={`choice-button empty-evidence-choice ${
          state.meeting.selectedEvidenceIds.length === 0 ? 'selected' : ''
        }`}
        type="button"
        onClick={() => dispatch({ type: 'SELECT_EVIDENCE', evidenceIds: [] })}
      >
        判断材料なし
      </button>
      {state.acquiredEvidence.map((evidenceId) => {
        const evidence = getEvidence(evidenceId);
        const selected = state.meeting.selectedEvidenceIds.includes(evidenceId);
        const disabled = !selected && limitReached;

        return (
          <button
            key={evidence.id}
            className={`choice-button evidence-choice ${selected ? 'selected' : ''}`}
            type="button"
            disabled={disabled}
            onClick={() => toggleEvidence(evidence.id)}
          >
            <strong>{evidence.shortTitle}</strong>
            <span>{evidence.factSummary}</span>
          </button>
        );
      })}
    </div>
  );
}

function MeetingActionSummary({
  state,
  round,
}: {
  state: GameState;
  round: MeetingRoundDefinition;
}) {
  const targetLabel = getSelectedTargetLabel(round, state.meeting.selectedTargetId);
  const deliveryLabel = getSelectedDeliveryLabel(round, state.meeting.selectedDeliveryId);
  const evidenceLabel = getSelectedEvidenceLabel(state.meeting.selectedEvidenceIds);

  return (
    <div className="action-progress" aria-label="現在の選択">
      <div className="action-progress-step">
        <span>1 発言箇所</span>
        <strong className={targetLabel ? '' : 'pending'}>{targetLabel ?? '未選択'}</strong>
      </div>
      <div className="action-progress-step">
        <span>2 判断材料</span>
        <strong>{evidenceLabel}</strong>
      </div>
      <div className="action-progress-step">
        <span>3 出し方</span>
        <strong className={deliveryLabel ? '' : 'pending'}>{deliveryLabel ?? '未選択'}</strong>
      </div>
    </div>
  );
}

function MeetingActionPanel({
  state,
  round,
  dispatch,
}: {
  state: GameState;
  round: MeetingRoundDefinition;
  dispatch: GameDispatch;
}) {
  const canConfirm = Boolean(state.meeting.selectedTargetId && state.meeting.selectedDeliveryId);
  const choiceScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    choiceScrollRef.current?.scrollTo({ top: 0 });
  }, [round.id]);

  return (
    <div className="meeting-action-panel">
      <MeetingActionSummary state={state} round={round} />
      <div className="meeting-action-scroll" ref={choiceScrollRef}>
        <div className="choice-group">
          <h3>1. 狙う発言箇所</h3>
          {round.targetPhrases.map((target) => (
            <button
              key={target.id}
              className={`choice-button ${
                state.meeting.selectedTargetId === target.id ? 'selected' : ''
              }`}
              type="button"
              onClick={() => dispatch({ type: 'SELECT_TARGET', targetId: target.id })}
            >
              {target.phrase}
            </button>
          ))}
        </div>
        <EvidenceSelector state={state} round={round} dispatch={dispatch} />
        <div className="choice-group">
          <h3>3. 出し方</h3>
          {round.deliveryOptions.map((delivery) => (
            <button
              key={delivery.id}
              className={`choice-button ${
                state.meeting.selectedDeliveryId === delivery.id ? 'selected' : ''
              }`}
              type="button"
              onClick={() => dispatch({ type: 'SELECT_DELIVERY', deliveryId: delivery.id })}
            >
              {delivery.label}
            </button>
          ))}
        </div>
      </div>
      <button
        className="primary-button confirm-action"
        type="button"
        disabled={!canConfirm}
        onClick={() => dispatch({ type: 'CONFIRM_MEETING_ACTION' })}
      >
        {canConfirm ? 'この発言をする' : '発言箇所と出し方を選ぶ'}
      </button>
    </div>
  );
}

function buildMinuteItems(state: GameState) {
  const draft = [
    'アジェンダ: 明日の決済v2リリース可否を、全面Go/全面延期/範囲分割のどれで判断するか。',
    '対象範囲: checkout_v2、invoice_export_v2、customer_data_migration。',
    '顧客影響: 月末請求に関わるため、今月中に説明できる結論が必要。',
  ];

  if (state.meeting.currentRoundIndex >= 1 || state.flags.pmCostPressureUnderstood) {
    draft.push(
      state.flags.pmCostPressureUnderstood
        ? '前回と今回の警告は同一条件とは限らないため、差分確認が必要。'
        : 'PMは、前回も似た警告があったが問題なかったという見方でGo寄り。',
    );
  }

  if (state.meeting.currentRoundIndex >= 2 || state.flags.flakyResolved) {
    draft.push(
      state.flags.flakyResolved
        ? 'CI失敗はlegacy条件に絞って追加確認する扱い。'
        : 'Tech Leadは、CI失敗を既知の不安定テストとして扱っている。',
    );
  }

  if (state.meeting.currentRoundIndex >= 3 || state.flags.customerScopeResolved) {
    draft.push(
      state.flags.customerScopeResolved
        ? '顧客が今月中に必要としている範囲は請求書出力。'
        : 'Salesは、顧客に今月中と伝えているため延期に懸念がある。',
    );
  }

  if (state.meeting.currentRoundIndex >= 4 || state.flags.rollbackRiskResolved || state.flags.featureFlagResolved) {
    draft.push(
      state.flags.rollbackRiskResolved || state.flags.featureFlagResolved
        ? 'QA懸念は残るため、危険範囲と出せる範囲の切り分けが論点。'
        : 'QAは、過去障害の経緯も踏まえて全面停止寄り。',
    );
  }

  const unresolved = [
    !state.flags.flakyResolved ? 'CI失敗がflakyか条件付き再現か。' : undefined,
    !state.flags.customerScopeResolved ? '顧客が今月中に必要としている機能範囲。' : undefined,
    !state.flags.rollbackRiskResolved ? 'customer_data_migration のrollback可否。' : undefined,
    !state.flags.featureFlagResolved ? '請求書出力だけを分けて出せるか。' : undefined,
  ].filter((item): item is string => Boolean(item));

  return { draft, unresolved };
}

function MeetingActionHistory({ state }: { state: GameState }) {
  if (state.meeting.actionHistory.length === 0) {
    return <p>まだプレイヤー発言はない。</p>;
  }

  return (
    <div className="minutes-action-list">
      {state.meeting.actionHistory.map((action) => {
        const actionRound = stage.meetingRounds.find((entry) => entry.id === action.roundId);
        const targetLabel = actionRound
          ? getSelectedTargetLabel(actionRound, action.targetId)
          : action.targetId;
        const deliveryLabel = actionRound
          ? getSelectedDeliveryLabel(actionRound, action.deliveryId)
          : action.deliveryId;

        return (
          <article key={`${action.roundId}-${action.deliveryId ?? 'none'}`}>
            <strong>{formatRoundLabel(action.roundId)}</strong>
            <span>{targetLabel ?? '発言箇所なし'}</span>
            <small>
              {getSelectedEvidenceLabel(action.evidenceIds)} / {deliveryLabel ?? '出し方なし'}
            </small>
          </article>
        );
      })}
    </div>
  );
}

function MeetingMinutesPanel({ state }: { state: GameState }) {
  const { draft, unresolved } = buildMinuteItems(state);

  return (
    <div className="meeting-minutes-panel">
      <section>
        <h3>議事録ドラフト</h3>
        {draft.map((item) => (
          <p key={item}>・{item}</p>
        ))}
      </section>
      <section>
        <h3>未整理論点</h3>
        {unresolved.length === 0 ? (
          <p>主要論点は会議中に確認済み。</p>
        ) : (
          unresolved.map((item) => <p key={item}>・{item}</p>)
        )}
      </section>
      <section>
        <h3>プレイヤー介入</h3>
        <MeetingActionHistory state={state} />
      </section>
    </div>
  );
}

function MeetingSidePanel({
  state,
  round,
  dispatch,
}: {
  state: GameState;
  round: MeetingRoundDefinition;
  dispatch: GameDispatch;
}) {
  const [activeTab, setActiveTab] = useState<MeetingSideTab>('action');

  return (
    <aside className="meeting-side-panel">
      <div className="meeting-side-tabs" role="tablist" aria-label="会議サイドパネル">
        <button
          className={activeTab === 'action' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={activeTab === 'action'}
          onClick={() => setActiveTab('action')}
        >
          証拠 & アクション
        </button>
        <button
          className={activeTab === 'minutes' ? 'active' : ''}
          type="button"
          role="tab"
          aria-selected={activeTab === 'minutes'}
          onClick={() => setActiveTab('minutes')}
        >
          議事録
        </button>
      </div>
      <div className="meeting-side-body">
        {activeTab === 'minutes' ? (
          <MeetingMinutesPanel state={state} />
        ) : state.phase === 'meeting' ? (
          <MeetingActionPanel state={state} round={round} dispatch={dispatch} />
        ) : (
          <div className="meeting-action-panel muted-panel">
            <h3>最終判断</h3>
            <p>ここまでの会議ログと確認済みの事実をもとに、榊へ結論を返す。</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function FinalDecisionModal({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: GameDispatch;
}) {
  const availableDecisionIds = getAvailableFinalDecisions(stage.finalDecisions, state.flags);

  return (
    <div className="modal-backdrop meeting-modal-backdrop">
      <section className="decision-modal" role="dialog" aria-modal="true">
        <div className="modal-kicker">ROUND 05 / CTO 榊</div>
        <h2>では、結論としてどうしたいんですか？</h2>
        <div className="decision-list">
          {availableDecisionIds.map((decisionId) => {
            const decision = stage.finalDecisions.find((entry) => entry.id === decisionId);

            if (!decision) {
              return null;
            }

            return (
              <button
                key={decision.id}
                className="decision-button"
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'CHOOSE_FINAL_DECISION',
                    decisionId: decision.id as FinalDecisionId,
                  })
                }
              >
                <strong>{decision.title}</strong>
                <span>{decision.availability === 'always' ? '常時選択可' : '会議で解放'}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MeetingScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: GameDispatch;
}) {
  const round = stage.meetingRounds[state.meeting.currentRoundIndex] ?? stage.meetingRounds[0];

  return (
    <AppFrame>
      <div className="meeting-screen">
        <header className="meeting-header">
          <div>
            <span>ROUND {String(round.roundNumber).padStart(2, '0')} / 05</span>
            <h1>{round.title}</h1>
          </div>
          <strong>{state.flags.meetingBreakdownRisk >= 2 ? '空気が硬い' : '緊張しているが進行中'}</strong>
          <time>09:42</time>
        </header>
        <ParticipantBar activeSpeakerId={round.speakerId} />
        <div className="meeting-main">
          <MeetingLog state={state} round={round} dispatch={dispatch} />
          <MeetingSidePanel state={state} round={round} dispatch={dispatch} />
        </div>
        {state.phase === 'finalDecision' ? (
          <FinalDecisionModal state={state} dispatch={dispatch} />
        ) : null}
      </div>
    </AppFrame>
  );
}

function FactList({ state, kind }: { state: GameState; kind: 'confirmed' | 'missing' }) {
  const factMap = [
    ['flakyResolved', 'CI失敗が条件付き再現かflakyか'],
    ['customerScopeResolved', '顧客が必要としている機能範囲'],
    ['rollbackRiskResolved', 'migrationが不可逆であること'],
    ['featureFlagResolved', 'invoice exportだけを分割できること'],
  ] as const;
  const facts = factMap.filter(([flag]) =>
    kind === 'confirmed' ? state.flags[flag] : !state.flags[flag],
  );

  return (
    <div className={`fact-box fact-${kind}`}>
      <h3>{kind === 'confirmed' ? '確認できた事実' : '確認できなかった事実'}</h3>
      {facts.length === 0 ? (
        <p>なし</p>
      ) : (
        facts.map(([, text]) => <p key={text}>・{text}</p>)
      )}
    </div>
  );
}

function ResultScreen({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: GameDispatch;
}) {
  const ending = getEndingCopy(state.ending ?? 'normal');
  const decision = state.finalDecision
    ? stage.finalDecisions.find((entry) => entry.id === state.finalDecision)
    : undefined;

  return (
    <AppFrame>
      <div className={`result-screen result-${ending.id}`}>
        <header className="result-banner">
          <div className="ending-stamp">
            <span>STAGE 01</span>
            <strong>{ending.id.toUpperCase()}</strong>
          </div>
          <div>
            <span>ENDING</span>
            <h1>{ending.title}</h1>
            <p>{ending.description}</p>
          </div>
          <div className="ending-pills">
            {stage.endings.map((entry) => (
              <span key={entry.id} className={entry.id === ending.id ? 'active' : ''}>
                {entry.id.toUpperCase()}
              </span>
            ))}
          </div>
        </header>
        <div className="result-main">
          <section className="result-column">
            <article className="result-card">
              <h2>最終判断</h2>
              <p>{decision?.title ?? ending.finalDecisionLabel}</p>
            </article>
            <article className="result-card result-log">
              <h2>会議ログ</h2>
              {state.meeting.logEntries.map((entry) => (
                <p key={entry.id}>
                  <strong>{formatRoundLabel(entry.roundId)}</strong>
                  {entry.text}
                </p>
              ))}
            </article>
          </section>
          <section className="result-column result-side">
            <div className="fact-grid">
              <FactList state={state} kind="confirmed" />
              <FactList state={state} kind="missing" />
            </div>
            <article className="result-card">
              <h2>関係の結果</h2>
              <div className="relationship-pills">
                <span className={state.flags.salesAlly ? 'ally' : state.flags.salesEnemy ? 'enemy' : ''}>
                  桐谷 Sales → {state.flags.salesAlly ? '味方化' : state.flags.salesEnemy ? '反発' : '中立'}
                </span>
                <span className={state.flags.qaAlly ? 'ally' : state.flags.qaEnemy ? 'enemy' : ''}>
                  三村 QA → {state.flags.qaAlly ? '味方化' : state.flags.qaEnemy ? '反発' : '中立'}
                </span>
                <span className={state.flags.techleadEnemy ? 'enemy' : ''}>
                  黒瀬 Tech Lead → {state.flags.techleadEnemy ? '反発' : '敵化せず'}
                </span>
              </div>
            </article>
            {ending.greatRules ? (
              <article className="result-card rule-card">
                <h2>明文化したGo/No-Go基準</h2>
                {ending.greatRules.map((rule) => (
                  <p key={rule}>・{rule}</p>
                ))}
              </article>
            ) : (
              <article className="result-card rule-card">
                <h2>{ending.id === 'good' ? 'GREATまであと一歩' : '残ったもの'}</h2>
                <p>
                  {ending.id === 'good'
                    ? '分割判断には届いたが、次回も使える基準の明文化までは届かなかった。'
                    : '出す/止めるの二択から、機能範囲とリスク範囲を分ける余地が残った。'}
                </p>
              </article>
            )}
          </section>
        </div>
        <footer className="result-footer">
          <span>数値スコアではなく、確認できた事実と最終判断の整合性で振り返る。</span>
          <button className="primary-button" type="button" onClick={() => dispatch({ type: 'RESTART' })}>
            もう一度プレイ
          </button>
        </footer>
      </div>
    </AppFrame>
  );
}

export function App() {
  const reducer = useMemo(() => createGameReducer(stage), []);
  const [state, dispatch] = useReducer(reducer, stage, createInitialGameState);

  if (state.phase === 'title') {
    return <StartScreen onStart={() => dispatch({ type: 'START_PROLOGUE' })} />;
  }

  if (state.phase === 'prologue') {
    return <PrologueScreen onStart={() => dispatch({ type: 'START_EXPLORATION' })} />;
  }

  if (state.phase === 'exploration') {
    return <ExplorationScreen state={state} dispatch={dispatch} />;
  }

  if (state.phase === 'meeting' || state.phase === 'finalDecision') {
    return <MeetingScreen state={state} dispatch={dispatch} />;
  }

  return <ResultScreen state={state} dispatch={dispatch} />;
}
