// DEFECT: unguarded two-parameter dynamic route handler. This repository
// already writes handlers in this shape (app/api/dev-hq/approvals/[id]/
// approve/route.ts), so a one-parameter-only rule was blind to a shape that is
// in use here today.
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return Response.json({ id, body: await request.json() });
}
