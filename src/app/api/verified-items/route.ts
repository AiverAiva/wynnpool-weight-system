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

    // If owner is a name, fetch UUID from Mojang API
    if (typeof body.owner === "string") {
        //  && !body.owner.match(/^[0-9a-fA-F]{32}$/)
        try {
            const resp = await fetch(`https://api.mojang.com/users/profiles/minecraft/${body.owner}`);
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.id) {
                    body.owner = data.name; 
                    body.uuid = data.id
                }
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: "unknown owner" }), { status: 400 });
        }
    }

    await db.insertOne(body);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
