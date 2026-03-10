'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register, saveAuth } from '@/lib/auth'

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('DEVELOPER')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleRegister = async () => {
        setError('')
        setLoading(true)
        try {
            const data = await register(email, password, name, role)
            saveAuth(data)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">API Manager</h1>
                    <p className="text-gray-400 mt-2">Create your account</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">I am a</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
                        >
                            <option value="DEVELOPER">Developer — I want to use APIs</option>
                            <option value="API_PROVIDER">API Provider — I want to publish APIs</option>
                        </select>
                    </div>

                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-lg px-4 py-3 text-sm transition"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <p className="text-center text-gray-400 text-sm mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}