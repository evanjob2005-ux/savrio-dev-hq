// DEFECT: unguarded handler whose request parameter carries no type annotation.
//
// The rule used to require an explicit `Request` or `NextRequest` annotation to
// recognise a handler at all, so deleting one token made an unguarded route
// invisible to the rule rather than merely unflagged by it. That is the whole
// bypass: no import, no clever shape, one missing annotation.
export async function POST(request) {
  return Response.json({ received: await request.json() });
}
