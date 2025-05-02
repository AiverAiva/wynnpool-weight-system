import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const allowedIds = process.env.ITEM_RANKING_TEAM?.split(",") ?? [];
  const allowed = token?.sub && allowedIds.includes(token.sub);
  return new Response(JSON.stringify({ allowed }), { status: 200 });
}