import { connectToDB } from "@/lib/mongodb";

export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const itemId = (await params).itemId;
  const collection = await connectToDB();
  const weights = await collection.find({ item_id: itemId }).toArray();
  return new Response(JSON.stringify(weights), { status: 200 });
}
