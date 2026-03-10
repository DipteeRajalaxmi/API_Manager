export type AuthResponse = {
    token: string
    refreshToken: string
    email : string
    name: string
    role: string
    userId: number
    orgId: number | null
}

export type UserResponse = {
    userId: number
    email: string
    name: string
    role: string
    status: string
    orgId: number | null
    orgName: string | null
    createdAt: string
    lastLoginAt: string | null
}