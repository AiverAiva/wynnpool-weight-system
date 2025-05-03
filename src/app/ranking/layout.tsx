import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
}

export const metadata: Metadata = {
  title: "Wynnpool Item Ranking",
  description: "the item leaderboard for every mythic :D",
};

export default function RankingLayout({
    children, // will be a page or nested layout
}: {
    children: React.ReactNode
}) {
    return (
        <section>
            {children}
        </section>
    )
}
