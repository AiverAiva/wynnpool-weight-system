"use client";

import { useEffect, useState } from "react";
import ItemIcon from "@/components/item-icon";
import ItemWeightedLB from "@/components/item-weighted-lb";
import Link from "next/link";
import SubmitRankingModal from "@/components/submit-ranking-modal";
import { Button } from "@/components/ui/button";

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

type ItemEntry = [string, any];

export default function RankingPage() {
  const [groupedItems, setGroupedItems] = useState<Record<string, [string, Item][]>>({});
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    // check permission for submitting
    fetch('/api/check-ranking-access')
      .then(res => res.json())
      .then(data => setCanSubmit(data.allowed))
      .catch(() => setCanSubmit(false));

    // fetch items
    fetch("/api/items/search", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        const categorized: Record<string, ItemEntry[]> = {};


        for (const [key, item] of Object.entries(data) as [string, Item][]) {
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

  if (loading)
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p className="font-mono text-2xl">Loading rankings...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="mt-[80px]" />
      <main className="container mx-auto p-6 max-w-screen-lg duration-150">
        <span className="text-3xl text-red-600 font-bold">This page will be deprecated soon, head to <Link href="https://www.wynnpool.com/item/ranking">wynnpool.com/item/ranking</Link></span>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Mythic Weapon Rankings</h1>
            <h2 className="text-lg text-muted-foreground">
              Join our Discord to discuss or submit: {" "}
              <Link className="text-blue-500 hover:underline" href="https://discord.gg/QZn4Qk3mSP">
                Wynnpool Discord
              </Link>
            </h2>
          </div>
          {canSubmit && (
            <Button onClick={() => setModalOpen(true)}>
              + Submit Item
            </Button>
          )}
        </div>

        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mt-6">
            <h2 className="text-xl font-semibold capitalize mb-2">{category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {items.map(([key, item]) => (
                <div key={key}>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="border p-2 rounded flex items-center gap-3 text-left hover:bg-muted transition w-full"
                  >
                    <ItemIcon item={item} size={40} />
                    <strong>{item.internalName}</strong>
                  </button>
                  {selectedItem?.internalName === item.internalName && (
                    <ItemWeightedLB item={item} open={true} onClose={() => setSelectedItem(null)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {canSubmit && (
          <SubmitRankingModal open={modalOpen} onClose={() => setModalOpen(false)} />
        )}
      </main>
    </div>
  );
}
