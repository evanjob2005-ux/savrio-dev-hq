// DEFECT: unguarded handler that takes no request at all.
//
// A handler with no request parameter has nothing to hand the guard, so it
// cannot be guarded -- and a rule that identifies handlers by their request
// parameter cannot see it either. Being unguardable is not an exemption from
// needing a guard: this is still a reachable, unauthenticated route under
// app/api/dev-hq/internal/. The fix for such a handler is to accept the request
// and guard it, not to leave it parameterless.
export async function GET() {
  return Response.json({ ok: true });
}
