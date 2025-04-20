import { connectToDB } from "@/lib/mongodb";

export async function GET() {
  const collection = await connectToDB();

  const results = await collection
    .aggregate([
      { $group: { _id: "$item_id", count: { $sum: 1 } } },
    ])
    .toArray();

  const countMap: Record<string, number> = {};
  for (const { _id, count } of results) {
    countMap[_id] = count;
  }

  return new Response(JSON.stringify(countMap), { status: 200 });
}
