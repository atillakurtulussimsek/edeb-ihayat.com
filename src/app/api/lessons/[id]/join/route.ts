import { NextResponse, type NextRequest } from "next/server";
import { getJoinUrl } from "@/lib/actions/lessons";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await getJoinUrl(id);
  if ("error" in r) {
    return NextResponse.redirect(new URL(`/lessons/${id}?error=${encodeURIComponent(r.error)}`, process.env.AUTH_URL ?? "http://localhost:3000"));
  }
  return NextResponse.redirect(r.url);
}
