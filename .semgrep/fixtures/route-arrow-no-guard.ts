// DEFECT: const-arrow handler with no guard at all. Valid Next.js; invisible to
// a rule that only matches `export async function`.
export const POST = async (request: Request) => {
  return Response.json({ received: await request.json() });
};
