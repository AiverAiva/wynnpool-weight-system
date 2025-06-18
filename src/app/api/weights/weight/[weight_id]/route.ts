import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/lib/mongodb";
import { sendToWebhook } from "@/lib/send-to-webhook";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ weight_id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];
  const { weight_id } = await params;

  if (!token?.sub || !allowedIds.includes(token.sub)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const data = await req.json();
  const { _id, userId, ...rest } = data;

  const updateFields = {
    ...rest,
    description: data.description || "",
    timestamp: Date.now(),
  };

  const { weightData } = await connectToDB();

  // Get the existing weight before updating
  const existing = await weightData.findOne({ weight_id });
  if (!existing) {
    return new Response(JSON.stringify({ error: "Weight not found" }), { status: 404 });
  }

  const result = await weightData.updateOne(
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
  if (updateFields.weight_name !== "test") {
    await sendToWebhook({
      action: "updated",
      author: token.name || token.sub,
      item_id: updateFields.item_id,
      weight_name: updateFields.weight_name,
      weight_id,
      description: updateFields.description,
      diff,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ weight_id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];
  const { weight_id } = await params;

  if (!token?.sub || !allowedIds.includes(token.sub)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const { weightData } = await connectToDB();

  // Get the document before deletion
  const existing = await weightData.findOne({ weight_id });
  if (!existing) {
    return new Response(JSON.stringify({ error: "Weight not found" }), { status: 404 });
  }

  const result = await weightData.deleteOne({ weight_id });

  if (result.deletedCount === 0) {
    return new Response(JSON.stringify({ error: "Deletion failed" }), { status: 500 });
  }

  // Send webhook with full identifications
  if (existing.weight_name !== "test") {
    await sendToWebhook({
      action: "deleted",
      author: token.name || token.sub,
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
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}