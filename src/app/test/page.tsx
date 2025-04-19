"use client"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  const allowedIds = process.env.ALLOWED_IDS?.split(",") ?? [];

  if (!session || !allowedIds.includes(session.user.id)) {
    return <p className="text-red-500">Access Denied</p>;
  }

  return <div>✅ Welcome, authorized user!</div>;
}
