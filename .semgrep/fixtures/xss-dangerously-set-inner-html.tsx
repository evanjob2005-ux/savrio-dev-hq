// DEFECT: renders untrusted text as raw HTML.
//
// The dev-hq-dangerously-set-inner-html rule had NO known-bad fixture and NO
// null arm, so under rule 1 of standards/CONTROL_VERIFICATION_STANDARD.md it had
// no acceptance evidence: DELETING THE RULE OUTRIGHT left the control green.
// This file and compliant-html-render.tsx are the pair that fixes that, and both
// are copied into each of the rule's two include roots (app/, components/).
//
// Mission Control renders agent- and model-produced text, which is exactly the
// untrusted input this sink turns into script execution.
export function AgentNotePanel({ note }: { note: string }) {
  return <div dangerouslySetInnerHTML={{ __html: note }} />;
}
