'use client'

import Link from 'next/link'
import UserAuthDisplay from './user-auth-display'
import { ModeToggle } from './mode-toggle'
import { Label } from './ui/label'

export default function Navbar() {
    return (
        <header className="fixed top-4 inset-x-0 z-50 mx-auto max-w-5xl px-8 h-[60px] rounded-2xl bg-background/30 shadow-xs backdrop-blur backdrop-saturate-100 transition-colors">
            <div className="container flex justify-between items-center h-full px-4">
                <div className='flex'>
                    <div className="text-xl font-semibold tracking-tight">
                        Wynnpool Beta
                    </div>
                    <Label className='text-gray-500'>v0.1</Label>
                    <div className='text-md items-center h-full space-x-2 ml-4 my-auto'>
                        <Link href="https://www.wynnpool.com/" className="transition-colors text-primary hover:text-primary/70">
                            Home
                        </Link>
                        <Link href="/" className="transition-colors text-primary hover:text-primary/70">
                            Weight
                        </Link>
                        <Link href="/ranking" className="transition-colors text-primary hover:text-primary/70">
                            Ranking
                        </Link>
                    </div>
                </div>

                <nav className="flex gap-6 text-sm font-medium">
                    <ModeToggle />
                    <UserAuthDisplay />
                </nav>
            </div>
        </header>
    )
}
