import { connectToDB } from "@/lib/mongodb";

export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const itemId = (await params).itemId;
  const { weightData } = await connectToDB();
  const weights = await weightData.find({ item_id: itemId }).toArray();
  return new Response(JSON.stringify(weights), { status: 200 });
}
