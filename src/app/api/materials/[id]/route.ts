import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { id } = await ctx.params;
  const user = session.user;

  const m = await prisma.lessonMaterial.findFirst({
    where:
      user.role === "ADMIN"
        ? { id }
        : user.role === "TEACHER"
          ? { id, lesson: { teacherId: user.id } }
          : { id, lesson: { students: { some: { studentId: user.id } } } },
  });
  if (!m) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 });

  const inline = req.nextUrl.searchParams.get("inline") === "1" && /^(application\/pdf|image\/|video\/|audio\/)/.test(m.mimeType);
  const encoded = encodeURIComponent(m.name).replace(/'/g, "%27");
  return new NextResponse(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.mimeType,
      "Content-Length": String(m.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
