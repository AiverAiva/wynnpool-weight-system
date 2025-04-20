"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ItemIcon from "@/components/item-icon";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
    format: "attribute" | "legacy" | "skin";
    value: any;
  };
  identifications?: Record<string, number | IdentificationValue>;
}

interface Weight {
  _id?: string;
  item_name: string;
  item_id: string;
  weight_name: string;
  weight_id: string;
  type: string;
  author: string;
  timestamp: number;
  identifications: Record<string, number>;
}

interface Props {
  item: Item;
  open: boolean;
  onClose: () => void;
}

const STATIC_IDS = [
  "rawStrength",
  "rawDexterity",
  "rawAgility",
  "rawDefence",
  "rawIntelligence",
];

export default function ItemModal({ item, open, onClose }: Props) {
  const { data: session } = useSession();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [editableWeight, setEditableWeight] = useState<Weight | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!item?.internalName) return;
    fetch(`/api/weights/item/${item.internalName}`)
      .then((res) => res.json())
      .then((data) => setWeights(data))
      .catch(console.error)
  }, [item]);


  useEffect(() => {
    const checkPermission = async () => {
      const res = await fetch("/api/check-allowed", { cache: "no-store" });
      const { allowed } = await res.json();
      setIsAllowed(allowed);
    };

    if (session?.user?.id) checkPermission();
  }, [session]);

  const handleChangeWeight = (id: string, value: number) => {
    if (!editableWeight) return;
    setEditableWeight({
      ...editableWeight,
      identifications: {
        ...editableWeight.identifications,
        [id]: value,
      },
    });
  };

  const handleSubmit = async () => {
    if (!editableWeight || !session?.user?.id) return;

    const payload = {
      ...editableWeight,
      userId: session.user.id,
    };

    const method = weights.find((w) => w.weight_id === editableWeight.weight_id)
      ? "PATCH"
      : "POST";

    const res = await fetch(
      method === "PATCH"
        ? `/api/weights/weight/${editableWeight.weight_id}`
        : `/api/weights`,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      const updated = await fetch(`/api/weights/item/${item.internalName}`).then((r) => r.json());
      setWeights(updated);
      setEditableWeight(null);
    } else {
      console.error("Failed to save weight");
    }
  };

  const generateWeightId = (itemName: string) => {
    const suffix = Math.random().toString(36).substring(2, 10); // 8-char suffix
    return `wynnpool_${itemName.toLowerCase()}_${suffix}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ItemIcon item={item} size={40} />
            {item.internalName}
          </DialogTitle>
          <DialogDescription className="capitalize">
            {item.type}
          </DialogDescription>
        </DialogHeader>

        {/* Public Weights */}
        <div className="mt-4 space-y-2">
          <h3 className="text-base font-semibold">Existing Weights</h3>
          {weights.length === 0 && <p className="text-sm text-muted-foreground">No weights yet.</p>}
          {weights.map((weight) => {
            const total = Object.values(weight.identifications).reduce((sum, val) => sum + val, 0);

            return (
              <div
                key={weight.weight_id}
                className="border p-3 rounded-md space-y-1"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                        {weight.type}
                      </span>
                      {weight.weight_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {weight.author} — {new Date(weight.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {isAllowed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditableWeight(weight)}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {/* Percent breakdown */}
                <ul className="text-xs mt-2 grid grid-cols-2 gap-x-6">
                  {Object.entries(weight.identifications).map(([key, val]) => (
                    <li key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      <span>{(val * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-right mt-1 text-muted-foreground">
                  Total: {(total * 100).toFixed(1)}%
                </p>
              </div>
            );
          })}
        </div>

        {/* Editable Form */}
        {isAllowed && (
          <div className="mt-6 border-t pt-4 space-y-3">
            <h3 className="text-base font-semibold">
              {editableWeight ? "Edit Weight" : "Create New Weight"}
            </h3>

            {/* New weight creator */}
            {!editableWeight && (
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  setEditableWeight({
                    item_name: item.internalName,
                    item_id: item.internalName,
                    weight_name: "",
                    weight_id: generateWeightId(item.internalName), // auto-generated!
                    type: "Wynnpool",
                    author: "Wynnpool Weight Team",
                    timestamp: Date.now(),
                    identifications: {},
                  })
                }
              >
                + Add Weight
              </Button>
            )}

            {/* Form */}
            {editableWeight && (() => {
              const totalPercent = Object.values(editableWeight.identifications).reduce(
                (sum, val) => sum + (val || 0), 0
              );
              const isValidTotal = totalPercent <= 1 && totalPercent >= 0.999;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={editableWeight.weight_name}
                        onChange={(e) =>
                          setEditableWeight({
                            ...editableWeight,
                            weight_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>ID</Label>
                      <Input value={editableWeight.weight_id} disabled readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Identifications</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(item.identifications || {})
                        .filter((key) => !STATIC_IDS.includes(key))
                        .map((key) => {
                          const percent =
                            editableWeight.identifications[key] != null
                              ? Number((editableWeight.identifications[key] * 100).toFixed(2))
                              : "";

                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="capitalize w-28">
                                {key.replace(/([A-Z])/g, " $1")}
                              </span>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                inputMode="decimal"
                                className="w-full"
                                value={percent}
                                onChange={(e) => {
                                  const raw = e.target.value;

                                  // Allow empty input to reset
                                  if (raw === "") {
                                    handleChangeWeight(key, 0);
                                    return;
                                  }

                                  const val = parseFloat(raw);
                                  if (!isNaN(val)) {
                                    handleChangeWeight(key, parseFloat((val / 100).toFixed(4)));
                                  }
                                }}
                              />
                            </div>
                          );
                        })}

                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-right mt-1">
                    Total: {(totalPercent * 100).toFixed(2)}%
                  </p>
                  {!isValidTotal && (
                    <p className="text-sm text-destructive">Total must be 100%</p>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={() => setEditableWeight(null)}>Cancel</Button>
                    <Button disabled={!isValidTotal} onClick={handleSubmit}>Save</Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog >
  );
}
