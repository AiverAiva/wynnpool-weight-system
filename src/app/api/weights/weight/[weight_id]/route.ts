import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ weight_id: string }> }
) {
  const session = await getServerSession(authOptions);
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];

  if (!session?.user?.id || !allowedIds.includes(session.user.id)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const data = await req.json();

  const { _id, userId, ...rest } = data;

  const updateFields = {
    ...rest,
    description: data.description || "",
    timestamp: Date.now(),
  };

  const collection = await connectToDB();

  const result = await collection.updateOne(
    { weight_id: (await params).weight_id },
    { $set: updateFields }
  );

  if (result.matchedCount === 0) {
    return new Response(JSON.stringify({ error: "Weight not found" }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ weight_id: string }> }
) {
  const session = await getServerSession(authOptions);
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];

  if (!session?.user?.id || !allowedIds.includes(session.user.id)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const collection = await connectToDB();
  const result = await collection.deleteOne({ weight_id: (await params).weight_id });

  if (result.deletedCount === 0) {
    return new Response(JSON.stringify({ error: "Weight not found" }), { status: 404 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}