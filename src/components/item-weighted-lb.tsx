"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { calculateIdentificationRoll } from "@/lib/identification-utils"; // import helper
import { RolledItemDisplay } from "./item/RolledItemDisplay";
import { CombatItem } from "@/types/itemType";

interface Item {
  internalName: string;
}

interface VerifiedItem {
  itemName: string;
  owner: string;
  timestamp: number;
  originalString: string;
  identifications: Record<string, number>;
}

interface Weight {
  weight_name: string;
  weight_id: string;
  identifications: Record<string, number>;
}

interface IdentificationRange {
  min: number;
  raw: number;
  max: number;
}

export default function ItemWeightedLB({ item, open, onClose }: { item: Item; open: boolean; onClose: () => void }) {
  const [verifiedItems, setVerifiedItems] = useState<VerifiedItem[]>([]);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [idRanges, setIdRanges] = useState<Record<string, IdentificationRange>>({});
  const [selectedItem, setSelectedItem] = useState<CombatItem>()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item.internalName) return;
    setLoading(true);

    // Fetch weight definitions
    fetch(`/api/weights/item/${item.internalName}`)
      .then((res) => res.json())
      .then(setWeights)
      .catch(console.error);

    // Fetch all verified summaries
    fetch("/api/verified-items")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((entry: VerifiedItem) => entry.itemName === item.internalName);
        setVerifiedItems(filtered);
      })
      .catch(console.error);

    // Fetch full item data for identification ranges
    fetch(`https://api.wynnpool.com/item/${item.internalName}`)
      .then((res) => res.json())
      .then((full) => {
        setSelectedItem(full); // <-- Add this here
        setIdRanges(full.identifications || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [item]);

  function calculateScore(entry: VerifiedItem, weight: Weight): number {
    let total = 0;
    for (const [key, weightFactor] of Object.entries(weight.identifications)) {
      const inputVal = entry.identifications[key] ?? 0;
      const range = idRanges[key] as IdentificationRange;
      if (!range) continue;
      const { formattedPercentage } = calculateIdentificationRoll(key, range, inputVal);
      total += (formattedPercentage / 100) * weightFactor;
    }
    return total;
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <p className="text-center">Loading data...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ranking for {item.internalName}</DialogTitle>
        </DialogHeader>

        {weights.length === 0 ? (
          <p className="text-muted-foreground text-sm">No weight data available.</p>
        ) : (
          <Tabs defaultValue={weights[0]?.weight_id} className="w-full">
            <TabsList className="flex flex-wrap gap-2">
              {weights.map((w) => (
                <TabsTrigger key={w.weight_id} value={w.weight_id}>
                  <Popover>
                    <PopoverTrigger>
                      {w.weight_name}
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <h4 className="font-medium mb-1">Weight Info</h4>
                      <ul className="text-xs space-y-1">
                        {Object.entries(w.identifications).map(([key, factor]) => (
                          <li key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                            <span>{(factor * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                </TabsTrigger>
              ))}
            </TabsList>
            {weights.map((weight) => {
              const ranked = [...verifiedItems]
                .map((v) => ({ ...v, score: calculateScore(v, weight) }))
                .sort((a, b) => b.score - a.score);


              return (
                <TabsContent key={weight.weight_id} value={weight.weight_id}>
                  <div className="mt-4 space-y-3">
                    {ranked.map((entry, i) => {
                      const demoData = {
                        input: entry,
                        original: selectedItem
                      }

                      return (
                        <Popover key={entry.originalString}>
                          <PopoverTrigger asChild>
                            <div className="border rounded p-2 text-sm flex justify-between items-center cursor-pointer">
                              <span>
                                <strong>#{i + 1}</strong> {entry.owner}
                              </span>
                              <span className="font-mono">{(entry.score * 100).toFixed(2)}%</span>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-fit">
                            {/* @ts-ignore */}  
                            <RolledItemDisplay data={demoData} />

                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
