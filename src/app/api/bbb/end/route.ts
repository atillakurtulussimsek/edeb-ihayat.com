import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyLessonSignature } from "@/lib/lesson-sync";
import { finalizePollStats } from "@/lib/lesson-stats";

/** BBB `meta_endCallbackUrl`: toplantı bittiğinde çağrılır. */
export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get("lesson") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!lessonId || !sig || !verifyLessonSignature(lessonId, sig)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  await prisma.lesson.updateMany({ where: { id: lessonId, status: "LIVE" }, data: { status: "ENDED" } });
  await finalizePollStats(lessonId);
  revalidatePath("/dashboard");
  revalidatePath("/lessons");
  revalidatePath(`/lessons/${lessonId}`);
  return NextResponse.json({ ok: true });
}
