// components/ItemIcon.tsx
"use client";

import Image from "next/image";
import { FC } from "react";
import { cn } from "@/lib/utils"; // or just remove if not using className combiner

interface Item {
  internalName: string;
  type: string;
  armourType?: string;
  armourMaterial?: string;
  icon?: {
    format: "attribute" | "legacy" | "skin";
    value: string | { name: string };
  };
}

const getImageSrc = (item: Item): string => {
  if (item.icon) {
    if (item.icon.format === "attribute" || item.icon.format === "legacy") {
      const iconValue =
        typeof item.icon.value === "object"
          ? item.icon.value.name
          : item.icon.value.replace(":", "_");
      return `https://cdn.wynncraft.com/nextgen/itemguide/3.3/${iconValue}.webp`;
    }
    if (item.icon.format === "skin") {
      return `https://mc-heads.net/head/${item.icon.value}`;
    }
  } else if (item.type === "armour") {
    return `https://cdn.wynncraft.com/nextgen/itemguide/3.3/${item.armourMaterial}_${item.armourType}.webp`;
  }

  return `/icons/items/barrier.webp`; // fallback icon
};

const ItemIcon: FC<{ item: Item; size?: number; className?: string }> = ({
  item,
  size = 32,
  className,
}) => {
  const src = getImageSrc(item);

  return (
    <Image
      src={src}
      alt={item.internalName}
      width={size}
      height={size}
      style={{
        imageRendering: "pixelated",
      }}
      className={className}
    />
  );
};

export default ItemIcon;
