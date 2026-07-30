// NULL ARM -- this file is CORRECT and must produce NO finding.
//
// The same component rendering the same untrusted text the safe way: as text,
// which React escapes. It mentions HTML in its identifiers and its prose so that
// a rule widened from the specific sink to "anything that says html" is caught
// here rather than shipping as a rule nobody can leave switched on.
export function AgentNotePanel({ note }: { note: string }) {
  const htmlSafeNote = note.trim();
  return <div className="agent-note-html-container">{htmlSafeNote}</div>;
}
