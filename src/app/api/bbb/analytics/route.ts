import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyLessonSignature } from "@/lib/lesson-sync";
import { applyAnalytics } from "@/lib/lesson-stats";

/** BBB `meta_analytics-callback-url`: toplantı bitince Learning Analytics verisini POST eder. */
export async function POST(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get("lesson") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!lessonId || !sig || !verifyLessonSignature(lessonId, sig)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }
  await applyAnalytics(lessonId, payload as Parameters<typeof applyAnalytics>[1]);
  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true });
}
