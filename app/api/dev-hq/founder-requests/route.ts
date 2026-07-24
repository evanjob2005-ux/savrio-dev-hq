import { NextResponse } from "next/server";
import { createFounderRequest } from "@/lib/dev-hq/founder-request-service";
import type { FounderRequestInput } from "@/types/domain";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FounderRequestInput;
    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        { error: "Title and description are required." },
        { status: 400 },
      );
    }

    const result = await createFounderRequest({
      title: body.title,
      description: body.description,
      priority: body.priority ?? "Medium",
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
