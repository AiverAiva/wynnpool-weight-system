import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];

  if (!session?.user?.id || !allowedIds.includes(session.user.id)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const data = await req.json();

  const required = ["item_name", "item_id", "weight_name", "weight_id", "identifications"];
  if (!required.every((key) => key in data)) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  const collection = await connectToDB();
  const existing = await collection.findOne({ weight_id: data.weight_id });

  if (existing) {
    return new Response(JSON.stringify({ error: "Weight already exists" }), { status: 409 });
  }

  const newWeight = {
    ...data,
    description: data.description || "",
    type: "Wynnpool",
    author: "Wynnpool Weight Team",
    timestamp: Date.now(),
  };

  await collection.insertOne(newWeight);
  return new Response(JSON.stringify({ success: true }), { status: 201 });
}
