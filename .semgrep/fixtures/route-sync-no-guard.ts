// DEFECT: non-async handler with no guard.
export function GET(request: Request) {
  return Response.json({ url: request.url });
}
