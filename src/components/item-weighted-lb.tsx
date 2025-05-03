"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { calculateIdentificationRoll } from "@/lib/identification-utils";
import { RolledItemDisplay } from "./item/RolledItemDisplay";
import { CombatItem } from "@/types/itemType";
import { getRollPercentageString } from "@/lib/itemUtils";

interface Item { internalName: string; }

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
  const [selectedItem, setSelectedItem] = useState<CombatItem>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item.internalName) return;
    setLoading(true);

    fetch(`/api/weights/item/${item.internalName}`)
      .then((res) => res.json())
      .then(setWeights)
      .catch(console.error);

    fetch("/api/verified-items")
      .then((res) => res.json())
      .then((data) => {
        setVerifiedItems(data.filter((e: VerifiedItem) => e.itemName === item.internalName));
      })
      .catch(console.error);

    fetch(`https://api.wynnpool.com/item/${item.internalName}`)
      .then((res) => res.json())
      .then((full) => {
        setSelectedItem(full);
        setIdRanges(full.identifications || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [item]);

  function calculateScore(entry: VerifiedItem, weight?: Weight): number {
    // If no weight passed, compute average of all IDs
    const keys = Object.keys(entry.identifications).filter(k => !!idRanges[k]);
    if (!weight) {
      const sum = keys.reduce((acc, key) => {
        const { formattedPercentage } = calculateIdentificationRoll(key, idRanges[key], entry.identifications[key]);
        return acc + formattedPercentage;
      }, 0);
      return Math.trunc(sum / keys.length * 100) / 10000
    }
    // const total = ids.reduce((sum, id) => sum + id.percentage, 0);
    // return total / ids.length;
    // weighted
    return keys.reduce((acc, key) => {
      const inputVal = entry.identifications[key];
      const { formattedPercentage } = calculateIdentificationRoll(key, idRanges[key], inputVal);
      return acc + (formattedPercentage / 100) * (weight.identifications[key] || 0);
    }, 0);
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogTitle><p className="text-center">Loading data...</p></DialogTitle>
        </DialogContent>
      </Dialog>
    );
  }

  // Build tabs array: first "Overall", then each weight
  const tabs = [
    { weight_id: "overall", weight_name: "Overall" },
    ...weights.map(w => ({ weight_id: w.weight_id, weight_name: w.weight_name })),
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ranking for {item.internalName}</DialogTitle>
        </DialogHeader>

        {tabs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No weight data available.</p>
        ) : (
          <Tabs defaultValue={tabs[0].weight_id} className="w-full">
            <TabsList className="flex flex-wrap gap-2">
              {tabs.map(tab => {
                const weightObj = weights.find(w => w.weight_id === tab.weight_id);
                return (
                  <TabsTrigger key={tab.weight_id} value={tab.weight_id}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <span>{tab.weight_name}</span>
                      </PopoverTrigger>
                      {tab.weight_id !== "overall" && (
                        <PopoverContent className="w-80">
                          <h4 className="font-medium mb-1">Weight Info</h4>
                          <ul className="text-xs space-y-1">
                            {Object.entries(weightObj!.identifications).map(([key, factor]) => (
                              <li key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                                <span>{(factor * 100).toFixed(1)}%</span>
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      )}
                    </Popover>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabs.map(tab => {
              // Determine which weight object (or undefined for overall)
              const weightObj = weights.find(w => w.weight_id === tab.weight_id);

              // rank entries
              const ranked = verifiedItems
                .map(v => ({ ...v, score: calculateScore(v, weightObj) }))
                .sort((a, b) => b.score - a.score);

              return (
                <TabsContent key={tab.weight_id} value={tab.weight_id}>
                  <div className="mt-4 space-y-3">
                    {ranked.map((entry, i) => {
                      const demoData = { input: entry, original: selectedItem! };
                      return (
                        <Popover key={entry.originalString}>
                          <PopoverTrigger asChild>
                            <div className="border rounded p-2 text-sm flex justify-between items-center cursor-pointer">
                              <div className="flex space-x-2 items-center text-md">
                                <img
                                  src={`https://www.mc-heads.net/avatar/${entry.owner}`}
                                  alt={entry.owner}
                                  className="w-6 h-6"
                                />
                                <span>
                                  <strong>#{i + 1}</strong> {entry.owner}
                                </span>
                              </div>
                              <span className="font-mono">
                                {(entry.score * 100).toFixed(2)}%
                              </span>
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
