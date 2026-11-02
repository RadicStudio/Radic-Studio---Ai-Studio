import { getSupabase } from "./supabase";

type BriefTurn = { role: "user" | "assistant"; text: string };

export type BriefResult =
  | { done: false; message: string }
  | { done: true; message: string; brief: string; package: string; package_reason: string };

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke("ai", {
    body,
    signal: AbortSignal.timeout(70_000),
  });
  if (error) {
    // supabase-js hides the function's JSON body behind a generic message; surface it.
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      const detail = await ctx
        .json()
        .then((j) => j?.error)
        .catch(() => null);
      if (detail) throw new Error(String(detail));
    }
    if (/abort|timeout/i.test(error.message ?? "")) {
      throw new Error("The assistant took too long to answer — please try again.");
    }
    throw new Error(error.message || "AI request failed");
  }
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

/** Public: next step of the smart-brief conversation. */
export function nextBriefTurn(messages: BriefTurn[]) {
  return call<BriefResult>({ action: "brief", messages });
}

/** Admin: portfolio copy from a cover image. */
export function describeWork(image_url: string, hints?: string) {
  return call<{ title: string; summary: string; description: string; alt: string; tags: string[] }>(
    {
      action: "describe",
      image_url,
      hints,
    },
  );
}

/** Admin: draft a reply to an inquiry. */
export function draftReply(inquiry: {
  name: string;
  email: string;
  budget_range: string | null;
  message: string;
}) {
  return call<{ subject: string; body: string }>({ action: "reply", inquiry });
}
