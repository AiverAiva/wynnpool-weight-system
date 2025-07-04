"use client";

import { useEffect, useState } from "react";
import ItemIcon from "@/components/item-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import ItemModal from "@/components/item-modal";
import Link from "next/link";

type ItemEntry = [string, any];

interface IdentificationValue {
  min: number;
  raw: number;
  max: number;
}

interface Item {
  internalName: string;
  type: string;
  weaponType?: string;
  armourType?: string;
  armourMaterial?: string;
  icon?: {
    format: 'attribute' | 'legacy' | 'skin';
    value: any;
  };
  identifications?: Record<string, number | IdentificationValue>;
}

export default function MythicItemsPage() {
  const [groupedItems, setGroupedItems] = useState<Record<string, [string, Item][]>>({});
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/items/search", {
      method: "POST",
    })
      .then((res) => res.json())
      .then(async (data) => {
        const categorized: Record<string, ItemEntry[]> = {};

        // fetch weight counts
        const countsRes = await fetch("/api/weights/counts");
        const weightCounts = await countsRes.json();

        for (const [key, item] of Object.entries(data) as [string, Item][]) {
          const weightCount = weightCounts[item.internalName] ?? 0;
          (item as any).weightCount = weightCount; // 💡 store count in item

          if (item.type === "weapon") {
            const weaponCategory = item.weaponType || "other";
            if (!categorized[weaponCategory]) categorized[weaponCategory] = [];
            categorized[weaponCategory].push([key, item]);
          } else if (item.type === "armour") {
            if (!categorized["armour"]) categorized["armour"] = [];
            categorized["armour"].push([key, item]);
          }
        }

        setGroupedItems(categorized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching items:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex min-h-screen w-full items-center justify-center"><p className="font-mono text-2xl">Loading mythic items...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="mt-[80px]" />
      <main className="container mx-auto p-6 max-w-screen-lg duration-150">
        <span className="text-3xl text-red-600 font-bold">This page will be deprecated soon, head to <Link href="https://www.wynnpool.com/item/weight">wynnpool.com/item/weight</Link></span>
        <h1 className="text-3xl font-bold">If you have any questions about the weighting systems</h1>
        <h1 className="text-3xl font-bold">I encourage you to ask at: <Link className="font-bold cursor-pointer text-blue-500 hover:text-blue-700 transition-color duration-150" href='https://discord.gg/QZn4Qk3mSP'>Wynnpool Discord</Link></h1>
        {/* <h1 className="text-2xl font-bold">Mythic Items</h1> */}

        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mt-6">
            <h2 className="text-xl font-semibold capitalize mb-2">{category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {items.map(([key, item]) => (
                <div key={key}>
                  <div
                    onClick={() => setSelectedItem(item)}
                    role="button"
                    className="border p-2 rounded flex items-center gap-3 text-left hover:bg-muted transition w-full cursor-pointer"
                  >
                    <ItemIcon item={item} size={40} />
                    <strong>{item.internalName}</strong>
                  </div>

                  {selectedItem?.internalName === item.internalName && (
                    <ItemModal item={item} open={true} onClose={() => setSelectedItem(null)} />
                  )}
                </div>
              ))}

            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
