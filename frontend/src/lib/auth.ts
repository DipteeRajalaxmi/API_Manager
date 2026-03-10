import api from "./api";
import { AuthResponse } from "@/types/auth";

export const register = async (
    email: string,
    password: string,
    name: string,
    roleName: string = 'DEVELOPER'

): Promise<AuthResponse> =>{
    const response = await api.post<AuthResponse>('/api/auth/register',{email,password,name,roleName}) 
    return response.data
}

export const login = async(
    email: string,
    password: string,

): Promise<AuthResponse> =>{
    const response = await api.post<AuthResponse>('/api/auth/login',{email, password})
    return response.data
}

export const saveAuth = (data: AuthResponse)=>{
    localStorage.setItem('token' , data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user',JSON.stringify(data))
}

export const getUser = ():AuthResponse | null=>{
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
}

export const logout = ()=>{
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
}

export const isLoggedIn = (): boolean=>{
    return !! localStorage.getItem('token')
}