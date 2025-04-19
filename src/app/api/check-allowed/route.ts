import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];

  const allowed = session?.user?.id && allowedIds.includes(session.user.id);

  return new Response(JSON.stringify({ allowed }), { status: 200 });
}
