import { connectToDB } from "@/lib/mongodb";

export async function GET() {
    const { verifiedItems } = await connectToDB()
    const db = await verifiedItems
    const items = await db.find().sort({ timestamp: -1 }).limit(100).toArray();
    return new Response(JSON.stringify(items), { status: 200 });
}

export async function POST(req: Request) {
    const { verifiedItems } = await connectToDB()
    const db = await verifiedItems
    const body = await req.json();

    // Basic validation
    if (!body.itemName || !body.originalString || !body.owner) {
        return new Response(JSON.stringify({ error: "Missing required fields." }), { status: 400 });
    }

    await db.insertOne(body);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
