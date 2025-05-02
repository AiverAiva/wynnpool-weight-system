"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ItemIcon from "@/components/item-icon";
import ItemModal from "@/components/item-modal";
import SubmitRankingModal from "@/components/submit-ranking-modal"; // You will create this
import { useSession } from "next-auth/react";

export default function RankingPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [isAllowed, setIsAllowed] = useState(false);
    // const { data: session } = useSession();

    // const allowedIds = process.env.NEXT_PUBLIC_ITEM_RANKING_TEAM?.split(",") ?? [];
    // const isAllowed = session?.user?.id && allowedIds.includes(session.user.id);

    useEffect(() => {
        fetch("/api/check-ranking-access")
            .then(res => res.json())
            .then(data => setIsAllowed(data.allowed));
    }, []);

    useEffect(() => {
        fetch("/api/verified-items")
            .then((res) => res.json())
            .then((data) => setItems(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading)
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <p className="font-mono text-2xl">Loading verified items...</p>
            </div>
        );

    return (
        <div className="min-h-screen bg-background">
            <div className="mt-[80px]" />
            <main className="container mx-auto p-6 max-w-screen-lg duration-150">
                <h1 className="text-3xl font-bold mb-4">Verified Item Rankings</h1>

                {isAllowed && (
                    <div className="mb-4">
                        <Button onClick={() => setModalOpen(true)}>+ Submit Item</Button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((item, index) => (
                        <div key={index} className="border p-4 rounded">
                            <h3 className="font-semibold text-lg">{item.itemName}</h3>
                            <p className="text-sm text-muted-foreground">By: {item.owner}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(item.timestamp).toLocaleString()}
                            </p>
                            <pre className="mt-2 text-xs overflow-x-auto break-words">{item.originalString}</pre>
                        </div>
                    ))}
                </div>

                <SubmitRankingModal open={modalOpen} onClose={() => setModalOpen(false)} />
            </main>
        </div>
    );
}
