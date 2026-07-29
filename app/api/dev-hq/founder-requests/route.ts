import { NextResponse } from "next/server";
import {
  InvalidRequestError,
  badRequest,
  internalError,
  readJsonBody,
} from "@/app/api/dev-hq/_lib/route-errors";
import { createFounderRequest } from "@/lib/dev-hq/founder-request-service";
import type { FounderRequestInput, Priority } from "@/types/domain";

/**
 * The four values `Priority` admits. Listed here as a runtime value because the
 * type exists only at compile time and the request body does not (P2-34).
 */
const VALID_PRIORITIES: readonly Priority[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

/**
 * Upper bounds on the two free-text fields.
 *
 * Both are persisted unbounded today: `title` additionally becomes the project
 * name and is slugified into the project's slug, so an unbounded value is
 * written into four durable records by one request. The limits are deliberately
 * generous — they exist to bound what a single request can persist, not to
 * express a product rule about how long a title should be.
 */
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 10_000;

/**
 * Validate the founder request body (P2-34).
 *
 * `priority` was previously cast rather than checked, so any string reached
 * `taskRepository.createTask` and was persisted as the task's priority. That is
 * the same class of hole commit 9c1420f found in `decision`: a cast is not a
 * check, and the value it admits is durable. `Priority` is a closed set the UI
 * indexes directly (`PRIORITY_ACCENT[task.priority]`), so an unlisted value is
 * not merely odd data — it is a key with no entry.
 *
 * Normalisation is done once, here, so the value that is validated is the value
 * that is stored. Trimming after validating would let a field pass the length
 * check in one form and be persisted in another.
 */
function parseFounderRequest(body: unknown): FounderRequestInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return invalid("Request body must be a founder request object.");
  }
  const candidate = body as Partial<FounderRequestInput>;

  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const description =
    typeof candidate.description === "string"
      ? candidate.description.trim()
      : "";
  if (!title || !description) {
    return invalid("Title and description are required.");
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return invalid(
      `Title must be at most ${MAX_TITLE_LENGTH} characters; received ${title.length}.`,
    );
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return invalid(
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters; received ${description.length}.`,
    );
  }

  // Absent means the documented default. Present means it must be one of the
  // four, because a present-but-unlisted value is a caller mistake and silently
  // rewriting it to "Medium" would persist a priority nobody asked for.
  const priority = candidate.priority ?? "Medium";
  if (!VALID_PRIORITIES.includes(priority)) {
    return invalid(
      `Invalid priority. Expected one of ${VALID_PRIORITIES.join(", ")}.`,
    );
  }

  return { title, description, priority };
}

function invalid(message: string): never {
  throw new InvalidRequestError(message);
}

export async function POST(request: Request) {
  try {
    const input = parseFounderRequest(await readJsonBody<unknown>(request));
    const result = await createFounderRequest(input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return badRequest(error.message);
    }
    return internalError("POST /api/dev-hq/founder-requests", error);
  }
}
