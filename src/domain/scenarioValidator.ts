import type { DocumentDefinition, StageDefinition } from './types';
import { collectClickableLines } from './evidenceRules';

export type ScenarioValidationIssue = {
  code: string;
  message: string;
};

function issue(code: string, message: string): ScenarioValidationIssue {
  return { code, message };
}

function findDocument(stage: StageDefinition, documentId: string): DocumentDefinition | undefined {
  return stage.documents.find((document) => document.id === documentId);
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates];
}

export function validateStage(stage: StageDefinition): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = [];
  const evidenceIds = new Set(stage.evidenceCards.map((card) => card.id));
  const documentIds = new Set(stage.documents.map((document) => document.id));
  const endingIds = new Set(stage.endings.map((ending) => ending.id));
  const clickableLines = collectClickableLines(stage);

  findDuplicates(stage.documents.map((document) => document.id)).forEach((id) => {
    issues.push(issue('duplicate_document_id', `Duplicate document id: ${id}`));
  });

  findDuplicates(stage.evidenceCards.map((card) => card.id)).forEach((id) => {
    issues.push(issue('duplicate_evidence_id', `Duplicate evidence id: ${id}`));
  });

  findDuplicates(stage.meetingRounds.map((round) => round.id)).forEach((id) => {
    issues.push(issue('duplicate_round_id', `Duplicate meeting round id: ${id}`));
  });

  if (stage.evidenceCards.length !== 9) {
    issues.push(
      issue('evidence_count', `Expected 9 evidence cards, got ${stage.evidenceCards.length}.`),
    );
  }

  if (clickableLines.length !== 9) {
    issues.push(
      issue('clickable_line_count', `Expected 9 clickable evidence lines, got ${clickableLines.length}.`),
    );
  }

  const cardizedDocumentIds = new Set(clickableLines.map((line) => line.documentId));
  if (cardizedDocumentIds.size !== 9) {
    issues.push(
      issue('cardized_document_count', `Expected 9 cardized documents, got ${cardizedDocumentIds.size}.`),
    );
  }

  const pilack = findDocument(stage, 'pilack_release_check');
  if (!pilack) {
    issues.push(issue('pilack_missing', 'Pilack prologue document is missing.'));
  } else {
    const pilackEvidenceLines = pilack.lines.filter((line) => line.evidenceId);
    if (!pilack.isPrologueOnly || pilackEvidenceLines.length > 0) {
      issues.push(issue('pilack_evidence', 'Pilack must remain prologue-only and non-evidence.'));
    }
  }

  const piraHasBugLine = clickableLines.some(
    (line) => line.documentId === 'pira_bug_418' && line.evidenceId === 'jira_bug_418_repro',
  );
  if (!piraHasBugLine) {
    issues.push(issue('pira_bug_418_line', 'Pira must expose jira_bug_418_repro as a clickable line.'));
  }

  const cpuHasEvidence = stage.evidenceCards.some((card) => card.id === 'cpu_spike_log');
  const cpuHasLine = clickableLines.some(
    (line) => line.documentId === 'cpu_spike_log' && line.evidenceId === 'cpu_spike_log',
  );
  if (!cpuHasEvidence || !cpuHasLine) {
    issues.push(issue('cpu_trap_missing', 'CPU spike trap card and clickable line must both exist.'));
  }

  stage.evidenceCards.forEach((card) => {
    if (!documentIds.has(card.sourceDocumentId)) {
      issues.push(
        issue(
          'evidence_source_missing',
          `Evidence ${card.id} points to missing document ${card.sourceDocumentId}.`,
        ),
      );
    }
  });

  clickableLines.forEach((line) => {
    if (!evidenceIds.has(line.evidenceId)) {
      issues.push(
        issue('line_evidence_missing', `Line ${line.lineId} points to missing evidence ${line.evidenceId}.`),
      );
    }

    const card = stage.evidenceCards.find((evidence) => evidence.id === line.evidenceId);
    if (card && card.sourceDocumentId !== line.documentId) {
      issues.push(
        issue(
          'line_source_mismatch',
          `Line ${line.lineId} is in ${line.documentId}, but ${line.evidenceId} belongs to ${card.sourceDocumentId}.`,
        ),
      );
    }
  });

  stage.evidenceCards.forEach((card) => {
    const matchingLines = clickableLines.filter((line) => line.evidenceId === card.id);
    if (matchingLines.length !== 1) {
      issues.push(
        issue(
          'evidence_line_cardinality',
          `Evidence ${card.id} must have exactly one clickable line, got ${matchingLines.length}.`,
        ),
      );
    }
  });

  stage.meetingRounds.forEach((round) => {
    const statementLineIds = new Set(round.npcStatement.map((line) => line.id));

    round.targetPhrases.forEach((target) => {
      if (!statementLineIds.has(target.statementLineId)) {
        issues.push(
          issue(
            'target_statement_missing',
            `Target ${target.id} points to missing statement line ${target.statementLineId}.`,
          ),
        );
      }
    });

    if (round.id === 'round4_qa') {
      if (round.maxEvidenceSelectable !== 2) {
        issues.push(issue('round4_evidence_limit', 'Round 4 must allow exactly 2 evidence cards.'));
      }
      return;
    }

    if (round.id === 'round5_cto') {
      if (round.maxEvidenceSelectable !== 0) {
        issues.push(issue('round5_evidence_limit', 'Round 5 must not use evidence selection.'));
      }
      return;
    }

    if (round.maxEvidenceSelectable !== 1) {
      issues.push(issue('round_evidence_limit', `Round ${round.id} must allow exactly 1 evidence card.`));
    }
  });

  stage.finalDecisions.forEach((decision) => {
    if (!endingIds.has(decision.endingId)) {
      issues.push(
        issue('decision_ending_missing', `Decision ${decision.id} points to missing ending ${decision.endingId}.`),
      );
    }
  });

  return issues;
}

export function assertValidStage(stage: StageDefinition): void {
  const issues = validateStage(stage);

  if (issues.length > 0) {
    throw new Error(issues.map((entry) => `${entry.code}: ${entry.message}`).join('\n'));
  }
}
