'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, logout } from '@/lib/auth'
import { AuthResponse } from '@/types/auth'

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<AuthResponse | null>(null)

    useEffect(() => {
        const userData = getUser()
        if (!userData) {
            router.push('/login')
            return
        }
        setUser(userData)
    }, [])

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">API Manager</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">{user.email}</span>
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {user.role}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-white text-sm transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-2">Welcome, {user.name} 👋</h2>
                <p className="text-gray-400 mb-8">
                    Signed in as <strong className="text-white">{user.role}</strong>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Total APIs</p>
                        <p className="text-3xl font-bold">0</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Applications</p>
                        <p className="text-3xl font-bold">0</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Subscriptions</p>
                        <p className="text-3xl font-bold">0</p>
                    </div>
                </div>
            </div>
        </div>
    )
}