"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

interface VerifiedItem {
  itemName: string;
  identifications: Record<string, number>;
  originalString: string;
  owner: string;
  timestamp: number;
}

interface Weight {
  weight_id: string;
  weight_name: string;
  identifications: Record<string, number>;
  author: string;
  timestamp: number;
}

export default function ItemWeightedLB({ itemId, open, onClose }: { itemId: string; open: boolean; onClose: () => void }) {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [verifiedItems, setVerifiedItems] = useState<VerifiedItem[]>([]);

  useEffect(() => {
    if (!itemId || !open) return;

    fetch(`/api/weights/item/${itemId}`)
      .then(res => res.json())
      .then(setWeights)
      .catch(console.error);

    fetch(`/api/verified-items?item=${itemId}`)
      .then(res => res.json())
      .then(setVerifiedItems)
      .catch(console.error);
  }, [itemId, open]);

  const calculateScore = (item: VerifiedItem, weight: Weight) => {
    let score = 0;
    for (const [key, w] of Object.entries(weight.identifications)) {
      const value = item.identifications[key] || 0;
      score += w * value;
    }
    return score;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Leaderboard — {itemId}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={weights[0]?.weight_id} className="w-full mt-2">
          <TabsList>
            {weights.map((w) => (
              <TabsTrigger key={w.weight_id} value={w.weight_id}>{w.weight_name}</TabsTrigger>
            ))}
          </TabsList>

          {weights.map((w) => (
            <TabsContent key={w.weight_id} value={w.weight_id} className="mt-4">
              <div className="space-y-2">
                {verifiedItems
                  .map((item) => ({
                    item,
                    score: calculateScore(item, w),
                  }))
                  .sort((a, b) => b.score - a.score)
                  .map(({ item, score }, i) => (
                    <div key={i} className="border rounded px-4 py-2">
                      <div className="flex justify-between">
                        <strong>{item.owner}</strong>
                        <span className="text-sm text-muted-foreground">{score.toFixed(2)}%</span>
                      </div>
                      <pre className="text-xs mt-1 text-muted-foreground break-all">{item.originalString}</pre>
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
