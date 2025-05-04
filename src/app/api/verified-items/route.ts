import { connectToDB } from "@/lib/mongodb";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const itemName = searchParams.get("itemName");

    const { verifiedItems } = await connectToDB();
    const db = await verifiedItems;

    const query = itemName ? { itemName } : {};
    const items = await db.find(query).sort({ timestamp: -1 }).toArray(); // remove `.limit(100)` if filtering by item

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
