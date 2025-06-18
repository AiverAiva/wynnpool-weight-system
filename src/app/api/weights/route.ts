import { connectToDB } from "@/lib/mongodb";
import { sendToWebhook } from "@/lib/send-to-webhook";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];

    if (!token?.sub || !allowedIds.includes(token.sub)) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
    }

    const data = await req.json();

    const required = ["item_name", "item_id", "weight_name", "weight_id", "identifications"];
    if (!required.every((key) => key in data)) {
        return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { weightData } = await connectToDB();
    const existing = await weightData.findOne({ weight_id: data.weight_id });

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

    if (newWeight.weight_name !== "test") {
        await sendToWebhook({
            action: "created",
            author: token.name || token.sub,
            item_id: newWeight.item_id,
            weight_name: newWeight.weight_name,
            weight_id: newWeight.weight_id,
            diff: Object.fromEntries(
                Object.entries(newWeight.identifications).map(([k, v]) => [k, { new: v as number }])
            ),
        });
    }
    await weightData.insertOne(newWeight);
    return new Response(JSON.stringify({ success: true }), { status: 201 });
}
