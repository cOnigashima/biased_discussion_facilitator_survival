import { goNoGoPaymentV2Stage } from './scenario/goNoGoPaymentV2';
import { validateStage } from './domain/scenarioValidator';

const validationIssues = validateStage(goNoGoPaymentV2Stage);

export function App() {
  return (
    <main className="app-shell">
      <section className="summary-panel" aria-labelledby="app-title">
        <p className="eyebrow">P0 Prototype</p>
        <h1 id="app-title">{goNoGoPaymentV2Stage.title}</h1>
        <p>{goNoGoPaymentV2Stage.situation}</p>
        <dl className="summary-grid">
          <div>
            <dt>Documents</dt>
            <dd>{goNoGoPaymentV2Stage.documents.length}</dd>
          </div>
          <div>
            <dt>Evidence Cards</dt>
            <dd>{goNoGoPaymentV2Stage.evidenceCards.length}</dd>
          </div>
          <div>
            <dt>Rounds</dt>
            <dd>{goNoGoPaymentV2Stage.meetingRounds.length}</dd>
          </div>
          <div>
            <dt>Validation</dt>
            <dd>{validationIssues.length === 0 ? 'OK' : `${validationIssues.length} issues`}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
