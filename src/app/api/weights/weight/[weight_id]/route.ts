import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";
import { sendToWebhook } from "@/lib/send-to-webhook";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ weight_id: string }> }
) {
  const session = await getServerSession(authOptions);
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];
  const { weight_id } = await params;

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

  // Get the existing weight before updating
  const existing = await collection.findOne({ weight_id });
  if (!existing) {
    return new Response(JSON.stringify({ error: "Weight not found" }), { status: 404 });
  }

  const result = await collection.updateOne(
    { weight_id },
    { $set: updateFields }
  );

  if (result.modifiedCount === 0) {
    return new Response(JSON.stringify({ error: "Nothing changed" }), { status: 200 });
  }

  // Generate diff
  const diff = Object.fromEntries(
    Object.entries(data.identifications).reduce((acc, [key, newVal]) => {
      const oldVal = existing.identifications?.[key] ?? 0;
      if (oldVal !== newVal) {
        acc.push([key, { old: oldVal as number, new: newVal as number }]);
      }
      return acc;
    }, [] as [string, { old: number; new: number }][])
  );


  // Send webhook
  await sendToWebhook({
    action: "updated",
    author: session.user.name || session.user.id,
    item_id: updateFields.item_id,
    weight_name: updateFields.weight_name,
    weight_id,
    description: updateFields.description,
    diff,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ weight_id: string }> }
) {
  const session = await getServerSession(authOptions);
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];
  const { weight_id } = await params;

  if (!session?.user?.id || !allowedIds.includes(session.user.id)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const collection = await connectToDB();

  // Get the document before deletion
  const existing = await collection.findOne({ weight_id });
  if (!existing) {
    return new Response(JSON.stringify({ error: "Weight not found" }), { status: 404 });
  }

  const result = await collection.deleteOne({ weight_id });

  if (result.deletedCount === 0) {
    return new Response(JSON.stringify({ error: "Deletion failed" }), { status: 500 });
  }

  // Send webhook with full identifications
  await sendToWebhook({
    action: "deleted",
    author: session.user.name || session.user.id,
    item_id: existing.item_id,
    weight_name: existing.weight_name,
    weight_id,
    description: existing.description,
    diff: Object.fromEntries(
      Object.entries(existing.identifications).map(
        ([key, val]) => [key, { old: val as number }]
      )
    )
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}