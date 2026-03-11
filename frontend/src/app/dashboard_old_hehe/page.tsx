// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { getUser, logout } from '@/lib/auth'
// import { AuthResponse } from '@/types/auth'
// import api from '@/lib/api'

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface ApiItem {
//   apiId: number
//   apiName: string
//   version: string
//   description: string
//   status: 'draft' | 'published' | 'deprecated' | 'retired'
//   baseUrl: string
//   visibility: string
//   categoryName: string | null
//   createdByName: string
//   createdAt: string
//   updatedAt: string
//   endpoints: Endpoint[]
// }

// interface Endpoint {
//   endpointId: number
//   httpMethod: string
//   path: string
//   description: string
//   isAuthenticated: boolean
// }

// interface Category {
//   categoryId: number
//   categoryName: string
// }

// type View = 'overview' | 'my-apis' | 'create' | 'detail'

// const STATUS_CONFIG = {
//   draft:      { label: 'Draft',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
//   published:  { label: 'Published',  color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
//   deprecated: { label: 'Deprecated', color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)' },
//   retired:    { label: 'Retired',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
// }

// const METHOD_COLORS: Record<string, string> = {
//   GET: '#10b981', POST: '#3b82f6', PUT: '#f59e0b',
//   PATCH: '#8b5cf6', DELETE: '#ef4444', HEAD: '#6b7280', OPTIONS: '#6b7280',
// }

// // ── Main Component ─────────────────────────────────────────────────────────────
// export default function DashboardPage() {
//   const router = useRouter()
//   const [user, setUser] = useState<AuthResponse | null>(null)
//   const [view, setView] = useState<View>('overview')
//   const [apis, setApis] = useState<ApiItem[]>([])
//   const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null)
//   const [categories, setCategories] = useState<Category[]>([])
//   const [loading, setLoading] = useState(false)
//   const [actionLoading, setActionLoading] = useState<string | null>(null)
//   const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
//   const [endpointModal, setEndpointModal] = useState(false)
//   const [newEndpoint, setNewEndpoint] = useState({ httpMethod: 'GET', path: '', description: '', isAuthenticated: true })

//   // Create form state
//   const [form, setForm] = useState({
//     apiName: '', version: 'v1', description: '',
//     baseUrl: '', visibility: 'public', categoryId: '',
//   })

//   useEffect(() => {
//     const userData = getUser()
//     if (!userData) { router.push('/login'); return }
//     setUser(userData)
//     fetchMyApis()
//     fetchCategories()
//   }, [])

//   const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
//     setToast({ msg, type })
//     setTimeout(() => setToast(null), 3000)
//   }

//   const fetchMyApis = async () => {
//     setLoading(true)
//     try {
//       const res = await api.get('/api/apis/my')
//       setApis(res.data)
//     } catch { showToast('Failed to load APIs', 'error') }
//     finally { setLoading(false) }
//   }

//   const fetchCategories = async () => {
//     try {
//       const res = await api.get('/api/apis/categories')
//       setCategories(res.data)
//     } catch {}
//   }

//   const fetchApiDetail = async (apiId: number) => {
//     try {
//       const res = await api.get(`/api/apis/${apiId}`)
//       setSelectedApi(res.data)
//     } catch { showToast('Failed to load API details', 'error') }
//   }

//   const handleCreateApi = async () => {
//     if (!form.apiName || !form.baseUrl) { showToast('Name and Base URL are required', 'error'); return }
//     setActionLoading('create')
//     try {
//       await api.post('/api/apis', { ...form, categoryId: form.categoryId || null })
//       showToast('API created successfully!')
//       setForm({ apiName: '', version: 'v1', description: '', baseUrl: '', visibility: 'public', categoryId: '' })
//       fetchMyApis()
//       setView('my-apis')
//     } catch (e: any) {
//       showToast(e.response?.data?.message || 'Failed to create API', 'error')
//     } finally { setActionLoading(null) }
//   }

//   const handleLifecycle = async (apiId: number, action: 'publish' | 'deprecate' | 'retire') => {
//     setActionLoading(`${action}-${apiId}`)
//     try {
//       await api.patch(`/api/apis/${apiId}/${action}`)
//       showToast(`API ${action}ed successfully!`)
//       fetchMyApis()
//       if (selectedApi?.apiId === apiId) fetchApiDetail(apiId)
//     } catch (e: any) {
//       showToast(e.response?.data?.message || `Failed to ${action}`, 'error')
//     } finally { setActionLoading(null) }
//   }

//   const handleDeleteApi = async (apiId: number) => {
//     if (!confirm('Delete this API? This cannot be undone.')) return
//     setActionLoading(`delete-${apiId}`)
//     try {
//       await api.delete(`/api/apis/${apiId}`)
//       showToast('API deleted')
//       fetchMyApis()
//       if (selectedApi?.apiId === apiId) { setSelectedApi(null); setView('my-apis') }
//     } catch (e: any) {
//       showToast(e.response?.data?.message || 'Failed to delete', 'error')
//     } finally { setActionLoading(null) }
//   }

//   const handleAddEndpoint = async () => {
//     if (!selectedApi || !newEndpoint.path) { showToast('Path is required', 'error'); return }
//     setActionLoading('add-endpoint')
//     try {
//       await api.post(`/api/apis/${selectedApi.apiId}/endpoints`, newEndpoint)
//       showToast('Endpoint added!')
//       setEndpointModal(false)
//       setNewEndpoint({ httpMethod: 'GET', path: '', description: '', isAuthenticated: true })
//       fetchApiDetail(selectedApi.apiId)
//     } catch (e: any) {
//       showToast(e.response?.data?.message || 'Failed to add endpoint', 'error')
//     } finally { setActionLoading(null) }
//   }

//   const handleDeleteEndpoint = async (endpointId: number) => {
//     try {
//       await api.delete(`/api/apis/endpoints/${endpointId}`)
//       showToast('Endpoint deleted')
//       if (selectedApi) fetchApiDetail(selectedApi.apiId)
//     } catch { showToast('Failed to delete endpoint', 'error') }
//   }

//   const stats = {
//     total: apis.length,
//     published: apis.filter(a => a.status === 'published').length,
//     draft: apis.filter(a => a.status === 'draft').length,
//     deprecated: apis.filter(a => a.status === 'deprecated').length,
//   }

//   if (!user) return null

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//         :root {
//           --teal: #0d9488;
//           --teal-light: #14b8a6;
//           --teal-dim: rgba(13,148,136,0.12);
//           --teal-border: rgba(13,148,136,0.25);
//           --bg: #f0faf9;
//           --surface: #ffffff;
//           --surface2: #f8fffe;
//           --border: #e2f0ee;
//           --text: #0f2724;
//           --text2: #4a7c76;
//           --text3: #8ab3ae;
//           --sidebar-w: 240px;
//           --sidebar-collapsed: 68px;
//           --header-h: 64px;
//           --radius: 14px;
//           --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
//           --shadow-md: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
//         }

//         body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); }

//         .dash-root { display: flex; min-height: 100vh; }

//         /* ── Sidebar ── */
//         .sidebar {
//           width: var(--sidebar-w);
//           background: var(--surface);
//           border-right: 1px solid var(--border);
//           display: flex;
//           flex-direction: column;
//           position: fixed;
//           top: 0; left: 0; bottom: 0;
//           z-index: 40;
//           transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
//           overflow: hidden;
//         }

//         .sidebar.collapsed { width: var(--sidebar-collapsed); }

//         .sidebar-logo {
//           height: var(--header-h);
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           padding: 0 18px;
//           border-bottom: 1px solid var(--border);
//           flex-shrink: 0;
//         }

//         .logo-icon {
//           width: 34px; height: 34px;
//           background: linear-gradient(135deg, var(--teal), #0f766e);
//           border-radius: 10px;
//           display: flex; align-items: center; justify-content: center;
//           font-size: 16px;
//           flex-shrink: 0;
//           box-shadow: 0 2px 8px rgba(13,148,136,0.3);
//         }

//         .logo-text {
//           font-size: 15px;
//           font-weight: 800;
//           color: var(--text);
//           white-space: nowrap;
//           opacity: 1;
//           transition: opacity 0.2s;
//         }

//         .sidebar.collapsed .logo-text { opacity: 0; pointer-events: none; }

//         .sidebar-nav {
//           flex: 1;
//           padding: 12px 10px;
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//           overflow-y: auto;
//         }

//         .nav-section-label {
//           font-size: 10px;
//           font-weight: 700;
//           color: var(--text3);
//           text-transform: uppercase;
//           letter-spacing: 1px;
//           padding: 8px 8px 4px;
//           white-space: nowrap;
//           overflow: hidden;
//           transition: opacity 0.2s;
//         }

//         .sidebar.collapsed .nav-section-label { opacity: 0; }

//         .nav-item {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 10px 10px;
//           border-radius: 10px;
//           cursor: pointer;
//           transition: all 0.15s;
//           color: var(--text2);
//           font-size: 13.5px;
//           font-weight: 500;
//           white-space: nowrap;
//           position: relative;
//         }

//         .nav-item:hover { background: var(--teal-dim); color: var(--teal); }

//         .nav-item.active {
//           background: var(--teal-dim);
//           color: var(--teal);
//           font-weight: 600;
//         }

//         .nav-item.active::before {
//           content: '';
//           position: absolute;
//           left: -10px;
//           top: 50%; transform: translateY(-50%);
//           width: 3px; height: 20px;
//           background: var(--teal);
//           border-radius: 0 3px 3px 0;
//         }

//         .nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
//         .nav-label { transition: opacity 0.2s; }
//         .sidebar.collapsed .nav-label { opacity: 0; pointer-events: none; }

//         .nav-badge {
//           margin-left: auto;
//           background: var(--teal);
//           color: white;
//           font-size: 10px;
//           font-weight: 700;
//           padding: 1px 6px;
//           border-radius: 100px;
//           transition: opacity 0.2s;
//         }

//         .sidebar.collapsed .nav-badge { opacity: 0; }

//         .sidebar-footer {
//           padding: 12px 10px;
//           border-top: 1px solid var(--border);
//         }

//         .user-card {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 10px;
//           border-radius: 10px;
//           background: var(--teal-dim);
//           overflow: hidden;
//         }

//         .user-avatar {
//           width: 32px; height: 32px;
//           border-radius: 50%;
//           background: linear-gradient(135deg, var(--teal), #0f766e);
//           display: flex; align-items: center; justify-content: center;
//           font-size: 13px;
//           font-weight: 700;
//           color: white;
//           flex-shrink: 0;
//         }

//         .user-info { overflow: hidden; transition: opacity 0.2s; }
//         .sidebar.collapsed .user-info { opacity: 0; pointer-events: none; }
//         .user-name { font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
//         .user-role { font-size: 10px; color: var(--teal); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

//         .collapse-btn {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           width: 28px; height: 28px;
//           border-radius: 8px;
//           background: var(--border);
//           border: none;
//           cursor: pointer;
//           color: var(--text2);
//           font-size: 12px;
//           transition: all 0.15s;
//           margin-left: auto;
//           flex-shrink: 0;
//         }

//         .collapse-btn:hover { background: var(--teal-dim); color: var(--teal); }

//         /* ── Main ── */
//         .main {
//           margin-left: var(--sidebar-w);
//           flex: 1;
//           min-height: 100vh;
//           transition: margin-left 0.25s cubic-bezier(0.4,0,0.2,1);
//           display: flex;
//           flex-direction: column;
//         }

//         .main.collapsed { margin-left: var(--sidebar-collapsed); }

//         /* ── Header ── */
//         .topbar {
//           height: var(--header-h);
//           background: var(--surface);
//           border-bottom: 1px solid var(--border);
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 0 28px;
//           position: sticky;
//           top: 0;
//           z-index: 30;
//         }

//         .topbar-left { display: flex; flex-direction: column; gap: 1px; }
//         .topbar-title { font-size: 18px; font-weight: 700; color: var(--text); }
//         .topbar-breadcrumb { font-size: 12px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

//         .topbar-right { display: flex; align-items: center; gap: 12px; }

//         .topbar-btn {
//           display: flex; align-items: center; gap: 6px;
//           padding: 8px 16px;
//           border-radius: 10px;
//           font-family: 'Plus Jakarta Sans', sans-serif;
//           font-size: 13px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.15s;
//           border: none;
//         }

//         .btn-primary {
//           background: var(--teal);
//           color: white;
//           box-shadow: 0 2px 8px rgba(13,148,136,0.3);
//         }

//         .btn-primary:hover { background: #0f766e; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(13,148,136,0.4); }

//         .btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border); }
//         .btn-ghost:hover { background: var(--teal-dim); color: var(--teal); border-color: var(--teal-border); }

//         .btn-danger { background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
//         .btn-danger:hover { background: rgba(239,68,68,0.15); }

//         /* ── Content ── */
//         .content { padding: 28px; flex: 1; }

//         /* ── Stats Grid ── */
//         .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }

//         .stat-card {
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           padding: 20px 22px;
//           display: flex;
//           align-items: center;
//           gap: 16px;
//           box-shadow: var(--shadow);
//           transition: all 0.2s;
//           animation: fadeInUp 0.4s ease both;
//         }

//         .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
//         .stat-card:nth-child(1) { animation-delay: 0.05s; }
//         .stat-card:nth-child(2) { animation-delay: 0.1s; }
//         .stat-card:nth-child(3) { animation-delay: 0.15s; }
//         .stat-card:nth-child(4) { animation-delay: 0.2s; }

//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(16px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         .stat-icon {
//           width: 44px; height: 44px;
//           border-radius: 12px;
//           display: flex; align-items: center; justify-content: center;
//           font-size: 20px;
//           flex-shrink: 0;
//         }

//         .stat-info {}
//         .stat-value { font-size: 26px; font-weight: 800; color: var(--text); line-height: 1; }
//         .stat-label { font-size: 12px; color: var(--text3); margin-top: 3px; font-weight: 500; }

//         /* ── Section ── */
//         .section-header {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           margin-bottom: 16px;
//         }

//         .section-title { font-size: 15px; font-weight: 700; color: var(--text); }
//         .section-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }

//         /* ── API Cards ── */
//         .apis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

//         .api-card {
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           padding: 20px;
//           cursor: pointer;
//           transition: all 0.2s;
//           box-shadow: var(--shadow);
//           animation: fadeInUp 0.4s ease both;
//           position: relative;
//           overflow: hidden;
//         }

//         .api-card::before {
//           content: '';
//           position: absolute;
//           top: 0; left: 0; right: 0;
//           height: 3px;
//           background: linear-gradient(90deg, var(--teal), #0f766e);
//           opacity: 0;
//           transition: opacity 0.2s;
//         }

//         .api-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--teal-border); }
//         .api-card:hover::before { opacity: 1; }

//         .api-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }

//         .api-name { font-size: 14px; font-weight: 700; color: var(--text); }
//         .api-version {
//           font-family: 'JetBrains Mono', monospace;
//           font-size: 11px;
//           color: var(--text3);
//           background: var(--bg);
//           padding: 2px 8px;
//           border-radius: 6px;
//           border: 1px solid var(--border);
//         }

//         .api-desc { font-size: 12px; color: var(--text2); line-height: 1.5; margin-bottom: 14px; min-height: 36px; }

//         .api-card-footer { display: flex; align-items: center; justify-content: space-between; }

//         .status-badge {
//           display: inline-flex;
//           align-items: center;
//           gap: 5px;
//           padding: 4px 10px;
//           border-radius: 100px;
//           font-size: 11px;
//           font-weight: 600;
//           border: 1px solid;
//         }

//         .status-dot { width: 5px; height: 5px; border-radius: 50%; }

//         .api-meta { display: flex; align-items: center; gap: 8px; }
//         .api-meta-item { font-size: 11px; color: var(--text3); display: flex; align-items: center; gap: 4px; }

//         .api-actions { display: flex; gap: 6px; margin-top: 14px; }

//         .action-btn {
//           flex: 1;
//           padding: 7px 10px;
//           border-radius: 8px;
//           border: 1px solid var(--border);
//           background: transparent;
//           font-family: 'Plus Jakarta Sans', sans-serif;
//           font-size: 11px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.15s;
//           color: var(--text2);
//         }

//         .action-btn:hover { border-color: var(--teal-border); background: var(--teal-dim); color: var(--teal); }
//         .action-btn.publish { color: #10b981; border-color: rgba(16,185,129,0.3); }
//         .action-btn.publish:hover { background: rgba(16,185,129,0.08); }
//         .action-btn.deprecate { color: #f97316; border-color: rgba(249,115,22,0.3); }
//         .action-btn.deprecate:hover { background: rgba(249,115,22,0.08); }
//         .action-btn.del { color: #ef4444; border-color: rgba(239,68,68,0.2); }
//         .action-btn.del:hover { background: rgba(239,68,68,0.08); }

//         /* ── Detail View ── */
//         .detail-header {
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           padding: 24px 28px;
//           margin-bottom: 20px;
//           box-shadow: var(--shadow);
//           animation: fadeInUp 0.3s ease;
//         }

//         .detail-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
//         .detail-title { font-size: 22px; font-weight: 800; color: var(--text); }
//         .detail-subtitle { font-size: 13px; color: var(--text2); margin-top: 4px; }

//         .detail-actions { display: flex; gap: 8px; }

//         .detail-meta { display: flex; gap: 24px; flex-wrap: wrap; }
//         .detail-meta-item { display: flex; flex-direction: column; gap: 2px; }
//         .detail-meta-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
//         .detail-meta-value { font-size: 13px; font-weight: 600; color: var(--text); font-family: 'JetBrains Mono', monospace; }

//         .panel {
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           box-shadow: var(--shadow);
//           overflow: hidden;
//           margin-bottom: 20px;
//           animation: fadeInUp 0.3s ease both;
//         }

//         .panel-header {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 16px 20px;
//           border-bottom: 1px solid var(--border);
//           background: var(--surface2);
//         }

//         .panel-title { font-size: 13px; font-weight: 700; color: var(--text); }
//         .panel-count { font-size: 11px; color: var(--text3); background: var(--bg); padding: 2px 8px; border-radius: 100px; border: 1px solid var(--border); }

//         /* ── Endpoints Table ── */
//         .endpoint-row {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           padding: 14px 20px;
//           border-bottom: 1px solid var(--border);
//           transition: background 0.15s;
//         }

//         .endpoint-row:last-child { border-bottom: none; }
//         .endpoint-row:hover { background: var(--bg); }

//         .method-badge {
//           font-family: 'JetBrains Mono', monospace;
//           font-size: 10px;
//           font-weight: 700;
//           padding: 3px 8px;
//           border-radius: 6px;
//           min-width: 56px;
//           text-align: center;
//         }

//         .endpoint-path {
//           font-family: 'JetBrains Mono', monospace;
//           font-size: 12px;
//           color: var(--text);
//           flex: 1;
//         }

//         .endpoint-desc { font-size: 12px; color: var(--text3); flex: 1; }

//         .auth-tag {
//           font-size: 10px;
//           padding: 2px 8px;
//           border-radius: 100px;
//           font-weight: 600;
//         }

//         .endpoint-del {
//           background: none;
//           border: none;
//           cursor: pointer;
//           color: var(--text3);
//           font-size: 14px;
//           padding: 4px;
//           border-radius: 6px;
//           transition: all 0.15s;
//         }

//         .endpoint-del:hover { color: #ef4444; background: rgba(239,68,68,0.08); }

//         /* ── Create Form ── */
//         .form-card {
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           padding: 28px;
//           box-shadow: var(--shadow);
//           max-width: 680px;
//           animation: fadeInUp 0.3s ease;
//         }

//         .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
//         .form-full { grid-column: 1 / -1; }

//         .form-group { display: flex; flex-direction: column; gap: 6px; }

//         .form-label {
//           font-size: 12px;
//           font-weight: 600;
//           color: var(--text2);
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//         }

//         .form-input, .form-select, .form-textarea {
//           background: var(--bg);
//           border: 1px solid var(--border);
//           border-radius: 10px;
//           padding: 11px 14px;
//           font-family: 'Plus Jakarta Sans', sans-serif;
//           font-size: 13px;
//           color: var(--text);
//           outline: none;
//           transition: all 0.15s;
//           width: 100%;
//         }

//         .form-textarea { min-height: 80px; resize: vertical; }

//         .form-input:focus, .form-select:focus, .form-textarea:focus {
//           border-color: var(--teal);
//           background: white;
//           box-shadow: 0 0 0 3px var(--teal-dim);
//         }

//         .form-input::placeholder, .form-textarea::placeholder { color: var(--text3); }

//         /* ── Modal ── */
//         .modal-overlay {
//           position: fixed;
//           inset: 0;
//           background: rgba(0,0,0,0.4);
//           backdrop-filter: blur(4px);
//           z-index: 100;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//           animation: fadeIn 0.2s ease;
//         }

//         @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

//         .modal {
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: 18px;
//           padding: 28px;
//           width: 100%;
//           max-width: 480px;
//           box-shadow: 0 24px 80px rgba(0,0,0,0.15);
//           animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
//         }

//         @keyframes modalIn {
//           from { opacity: 0; transform: scale(0.92) translateY(20px); }
//           to { opacity: 1; transform: scale(1) translateY(0); }
//         }

//         .modal-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 20px; }
//         .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }

//         /* ── Toast ── */
//         .toast {
//           position: fixed;
//           bottom: 24px; right: 24px;
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: 12px;
//           padding: 14px 18px;
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           font-size: 13px;
//           font-weight: 600;
//           box-shadow: 0 8px 32px rgba(0,0,0,0.12);
//           z-index: 200;
//           animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
//         }

//         @keyframes toastIn {
//           from { opacity: 0; transform: translateX(20px) scale(0.9); }
//           to { opacity: 1; transform: translateX(0) scale(1); }
//         }

//         .toast.success { border-left: 3px solid #10b981; color: var(--text); }
//         .toast.error { border-left: 3px solid #ef4444; color: var(--text); }

//         /* ── Empty State ── */
//         .empty-state {
//           text-align: center;
//           padding: 60px 20px;
//           color: var(--text3);
//         }

//         .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
//         .empty-title { font-size: 15px; font-weight: 600; color: var(--text2); margin-bottom: 6px; }
//         .empty-sub { font-size: 13px; }

//         /* ── Loading ── */
//         .spinner {
//           display: inline-block;
//           width: 14px; height: 14px;
//           border: 2px solid rgba(255,255,255,0.3);
//           border-top-color: white;
//           border-radius: 50%;
//           animation: spin 0.6s linear infinite;
//           margin-right: 6px;
//           vertical-align: middle;
//         }

//         .spinner-dark {
//           border: 2px solid var(--border);
//           border-top-color: var(--teal);
//         }

//         @keyframes spin { to { transform: rotate(360deg); } }

//         .loading-row { padding: 40px; text-align: center; color: var(--text3); font-size: 13px; }

//         /* ── Divider ── */
//         .divider { height: 1px; background: var(--border); margin: 20px 0; }

//         /* ── Quick Actions ── */
//         .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }

//         .quick-card {
//           background: var(--surface);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           padding: 18px;
//           cursor: pointer;
//           transition: all 0.2s;
//           box-shadow: var(--shadow);
//           display: flex;
//           align-items: center;
//           gap: 14px;
//           animation: fadeInUp 0.4s ease both;
//         }

//         .quick-card:hover { border-color: var(--teal-border); background: var(--teal-dim); transform: translateY(-1px); }
//         .quick-card:nth-child(1) { animation-delay: 0.05s; }
//         .quick-card:nth-child(2) { animation-delay: 0.1s; }
//         .quick-card:nth-child(3) { animation-delay: 0.15s; }

//         .quick-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
//         .quick-label { font-size: 13px; font-weight: 600; color: var(--text); }
//         .quick-sub { font-size: 11px; color: var(--text3); margin-top: 2px; }

//         @media (max-width: 768px) {
//           .stats-grid { grid-template-columns: repeat(2, 1fr); }
//           .quick-actions { grid-template-columns: 1fr; }
//           .form-grid { grid-template-columns: 1fr; }
//           .apis-grid { grid-template-columns: 1fr; }
//         }
//       `}</style>

//       <div className="dash-root">
//         {/* ── Sidebar ── */}
//         <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
//           <div className="sidebar-logo">
//             <div className="logo-icon">⚡</div>
//             <span className="logo-text">API Manager</span>
//             <button className="collapse-btn" onClick={() => setSidebarCollapsed(s => !s)} style={{ marginLeft: 'auto' }}>
//               {sidebarCollapsed ? '→' : '←'}
//             </button>
//           </div>

//           <nav className="sidebar-nav">
//             <div className="nav-section-label">Main</div>

//             {[
//               { id: 'overview', icon: '▦', label: 'Overview' },
//               { id: 'my-apis', icon: '⬡', label: 'My APIs', badge: stats.total || undefined },
//               { id: 'create', icon: '+', label: 'Create API' },
//             ].map(item => (
//               <div key={item.id}
//                 className={`nav-item ${view === item.id ? 'active' : ''}`}
//                 onClick={() => setView(item.id as View)}>
//                 <span className="nav-icon">{item.icon}</span>
//                 <span className="nav-label">{item.label}</span>
//                 {item.badge !== undefined && <span className="nav-badge">{item.badge}</span>}
//               </div>
//             ))}

//             <div className="nav-section-label" style={{ marginTop: 12 }}>Account</div>

//             <div className="nav-item" onClick={() => { logout(); router.push('/login') }}>
//               <span className="nav-icon">↩</span>
//               <span className="nav-label">Logout</span>
//             </div>
//           </nav>

//           <div className="sidebar-footer">
//             <div className="user-card">
//               <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
//               <div className="user-info">
//                 <div className="user-name">{user.name}</div>
//                 <div className="user-role">{user.role}</div>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* ── Main Content ── */}
//         <main className={`main ${sidebarCollapsed ? 'collapsed' : ''}`}>

//           {/* Topbar */}
//           <header className="topbar">
//             <div className="topbar-left">
//               <div className="topbar-title">
//                 {view === 'overview' && 'Dashboard'}
//                 {view === 'my-apis' && 'My APIs'}
//                 {view === 'create' && 'Create New API'}
//                 {view === 'detail' && (selectedApi?.apiName || 'API Detail')}
//               </div>
//               <div className="topbar-breadcrumb">
//                 api-manager / {view === 'detail' ? `apis/${selectedApi?.apiId}` : view}
//               </div>
//             </div>
//             <div className="topbar-right">
//               {view !== 'create' && (
//                 <button className="topbar-btn btn-primary" onClick={() => setView('create')}>
//                   + New API
//                 </button>
//               )}
//               {view === 'my-apis' && (
//                 <button className="topbar-btn btn-ghost" onClick={fetchMyApis}>
//                   ↻ Refresh
//                 </button>
//               )}
//               {view === 'detail' && selectedApi && (
//                 <button className="topbar-btn btn-ghost" onClick={() => setView('my-apis')}>
//                   ← Back
//                 </button>
//               )}
//             </div>
//           </header>

//           <div className="content">

//             {/* ── OVERVIEW ── */}
//             {view === 'overview' && (
//               <>
//                 <div className="stats-grid">
//                   {[
//                     { icon: '⬡', label: 'Total APIs', value: stats.total, color: '#0d9488', bg: 'rgba(13,148,136,0.1)' },
//                     { icon: '◉', label: 'Published', value: stats.published, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
//                     { icon: '◎', label: 'Draft', value: stats.draft, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
//                     { icon: '○', label: 'Deprecated', value: stats.deprecated, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
//                   ].map((s, i) => (
//                     <div className="stat-card" key={i}>
//                       <div className="stat-icon" style={{ background: s.bg }}>
//                         <span style={{ color: s.color }}>{s.icon}</span>
//                       </div>
//                       <div className="stat-info">
//                         <div className="stat-value">{s.value}</div>
//                         <div className="stat-label">{s.label}</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="quick-actions">
//                   {[
//                     { icon: '⚡', label: 'Create API', sub: 'Register a new API', color: '#0d9488', bg: 'rgba(13,148,136,0.1)', action: () => setView('create') },
//                     { icon: '⬡', label: 'Browse My APIs', sub: `${stats.total} APIs total`, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', action: () => setView('my-apis') },
//                     { icon: '↻', label: 'Refresh Data', sub: 'Sync latest status', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', action: fetchMyApis },
//                   ].map((q, i) => (
//                     <div className="quick-card" key={i} onClick={q.action}>
//                       <div className="quick-icon" style={{ background: q.bg }}>
//                         <span style={{ color: q.color }}>{q.icon}</span>
//                       </div>
//                       <div>
//                         <div className="quick-label">{q.label}</div>
//                         <div className="quick-sub">{q.sub}</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Recent APIs */}
//                 <div className="section-header">
//                   <div>
//                     <div className="section-title">Recent APIs</div>
//                     <div className="section-sub">Your latest registered APIs</div>
//                   </div>
//                   <button className="topbar-btn btn-ghost" onClick={() => setView('my-apis')} style={{ fontSize: 12 }}>
//                     View all →
//                   </button>
//                 </div>

//                 <div className="apis-grid">
//                   {loading ? (
//                     <div className="loading-row"><span className="spinner spinner-dark" /> Loading...</div>
//                   ) : apis.slice(0, 6).length === 0 ? (
//                     <div className="empty-state">
//                       <div className="empty-icon">⬡</div>
//                       <div className="empty-title">No APIs yet</div>
//                       <div className="empty-sub">Create your first API to get started</div>
//                     </div>
//                   ) : apis.slice(0, 6).map((a, i) => (
//                     <ApiCard key={a.apiId} api={a} index={i}
//                       onOpen={() => { setSelectedApi(a); setView('detail'); fetchApiDetail(a.apiId) }}
//                       onLifecycle={handleLifecycle}
//                       onDelete={handleDeleteApi}
//                       actionLoading={actionLoading} />
//                   ))}
//                 </div>
//               </>
//             )}

//             {/* ── MY APIS ── */}
//             {view === 'my-apis' && (
//               <>
//                 <div className="section-header" style={{ marginBottom: 20 }}>
//                   <div>
//                     <div className="section-title">All APIs ({apis.length})</div>
//                     <div className="section-sub">Manage your API lifecycle</div>
//                   </div>
//                 </div>
//                 {loading ? (
//                   <div className="loading-row"><span className="spinner spinner-dark" /> Loading APIs...</div>
//                 ) : apis.length === 0 ? (
//                   <div className="empty-state">
//                     <div className="empty-icon">⬡</div>
//                     <div className="empty-title">No APIs yet</div>
//                     <div className="empty-sub">Click "New API" to create your first one</div>
//                   </div>
//                 ) : (
//                   <div className="apis-grid">
//                     {apis.map((a, i) => (
//                       <ApiCard key={a.apiId} api={a} index={i}
//                         onOpen={() => { setSelectedApi(a); setView('detail'); fetchApiDetail(a.apiId) }}
//                         onLifecycle={handleLifecycle}
//                         onDelete={handleDeleteApi}
//                         actionLoading={actionLoading} />
//                     ))}
//                   </div>
//                 )}
//               </>
//             )}

//             {/* ── CREATE ── */}
//             {view === 'create' && (
//               <div className="form-card">
//                 <div className="section-title" style={{ marginBottom: 6 }}>Register New API</div>
//                 <div className="section-sub" style={{ marginBottom: 24 }}>Fill in the details to create a new API in DRAFT state</div>

//                 <div className="form-grid">
//                   <div className="form-group">
//                     <label className="form-label">API Name *</label>
//                     <input className="form-input" placeholder="e.g. Weather API"
//                       value={form.apiName} onChange={e => setForm(f => ({ ...f, apiName: e.target.value }))} />
//                   </div>
//                   <div className="form-group">
//                     <label className="form-label">Version</label>
//                     <input className="form-input" placeholder="v1"
//                       value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
//                   </div>
//                   <div className="form-group form-full">
//                     <label className="form-label">Base URL *</label>
//                     <input className="form-input" placeholder="https://api.example.com"
//                       value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} />
//                   </div>
//                   <div className="form-group form-full">
//                     <label className="form-label">Description</label>
//                     <textarea className="form-textarea" placeholder="Describe what this API does..."
//                       value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
//                   </div>
//                   <div className="form-group">
//                     <label className="form-label">Visibility</label>
//                     <select className="form-select" value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}>
//                       <option value="public">Public</option>
//                       <option value="private">Private</option>
//                       <option value="restricted">Restricted</option>
//                     </select>
//                   </div>
//                   <div className="form-group">
//                     <label className="form-label">Category</label>
//                     <select className="form-select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
//                       <option value="">No Category</option>
//                       {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="divider" />

//                 <div style={{ display: 'flex', gap: 10 }}>
//                   <button className="topbar-btn btn-primary" onClick={handleCreateApi} disabled={!!actionLoading}>
//                     {actionLoading === 'create' ? <><span className="spinner" />Creating...</> : '⚡ Create API'}
//                   </button>
//                   <button className="topbar-btn btn-ghost" onClick={() => setView('overview')}>Cancel</button>
//                 </div>
//               </div>
//             )}

//             {/* ── DETAIL ── */}
//             {view === 'detail' && selectedApi && (
//               <>
//                 <div className="detail-header">
//                   <div className="detail-top">
//                     <div>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
//                         <div className="detail-title">{selectedApi.apiName}</div>
//                         <StatusBadge status={selectedApi.status} />
//                       </div>
//                       <div className="detail-subtitle">{selectedApi.description || 'No description provided'}</div>
//                     </div>
//                     <div className="detail-actions">
//                       {selectedApi.status === 'draft' && (
//                         <button className="topbar-btn btn-primary"
//                           disabled={!!actionLoading}
//                           onClick={() => handleLifecycle(selectedApi.apiId, 'publish')}>
//                           {actionLoading === `publish-${selectedApi.apiId}` ? <><span className="spinner" />Publishing...</> : '◉ Publish'}
//                         </button>
//                       )}
//                       {selectedApi.status === 'published' && (
//                         <button className="topbar-btn btn-ghost"
//                           style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.3)' }}
//                           disabled={!!actionLoading}
//                           onClick={() => handleLifecycle(selectedApi.apiId, 'deprecate')}>
//                           Deprecate
//                         </button>
//                       )}
//                       {selectedApi.status === 'deprecated' && (
//                         <button className="topbar-btn btn-ghost"
//                           style={{ color: '#6b7280' }}
//                           disabled={!!actionLoading}
//                           onClick={() => handleLifecycle(selectedApi.apiId, 'retire')}>
//                           Retire
//                         </button>
//                       )}
//                       <button className="topbar-btn btn-danger"
//                         disabled={!!actionLoading}
//                         onClick={() => handleDeleteApi(selectedApi.apiId)}>
//                         Delete
//                       </button>
//                     </div>
//                   </div>

//                   <div className="detail-meta">
//                     {[
//                       { label: 'Version', value: selectedApi.version },
//                       { label: 'Base URL', value: selectedApi.baseUrl },
//                       { label: 'Visibility', value: selectedApi.visibility },
//                       { label: 'Category', value: selectedApi.categoryName || '—' },
//                       { label: 'Provider', value: selectedApi.createdByName || '—' },
//                     ].map(m => (
//                       <div className="detail-meta-item" key={m.label}>
//                         <div className="detail-meta-label">{m.label}</div>
//                         <div className="detail-meta-value">{m.value}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Lifecycle Flow */}
//                 <div className="panel" style={{ animationDelay: '0.1s' }}>
//                   <div className="panel-header">
//                     <span className="panel-title">Lifecycle State</span>
//                   </div>
//                   <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
//                     {['draft', 'published', 'deprecated', 'retired'].map((s, i, arr) => {
//                       const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]
//                       const isActive = selectedApi.status === s
//                       const isPast = arr.indexOf(selectedApi.status) > i
//                       return (
//                         <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                           <div style={{
//                             padding: '6px 14px', borderRadius: 100,
//                             background: isActive ? cfg.bg : isPast ? 'rgba(16,185,129,0.06)' : 'var(--bg)',
//                             border: `1px solid ${isActive ? cfg.border : isPast ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
//                             color: isActive ? cfg.color : isPast ? '#10b981' : 'var(--text3)',
//                             fontSize: 12, fontWeight: 600,
//                             transition: 'all 0.2s',
//                           }}>
//                             {isPast ? '✓ ' : ''}{cfg.label}
//                           </div>
//                           {i < arr.length - 1 && (
//                             <div style={{ width: 24, height: 1, background: isPast ? '#10b981' : 'var(--border)', opacity: isPast ? 0.6 : 1 }} />
//                           )}
//                         </div>
//                       )
//                     })}
//                   </div>
//                 </div>

//                 {/* Endpoints */}
//                 <div className="panel" style={{ animationDelay: '0.15s' }}>
//                   <div className="panel-header">
//                     <span className="panel-title">Endpoints</span>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                       <span className="panel-count">{selectedApi.endpoints?.length || 0} total</span>
//                       <button className="topbar-btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}
//                         onClick={() => setEndpointModal(true)}>
//                         + Add Endpoint
//                       </button>
//                     </div>
//                   </div>

//                   {!selectedApi.endpoints?.length ? (
//                     <div className="empty-state" style={{ padding: 40 }}>
//                       <div className="empty-icon" style={{ fontSize: 32 }}>⬡</div>
//                       <div className="empty-title">No endpoints yet</div>
//                       <div className="empty-sub">Add your first endpoint to this API</div>
//                     </div>
//                   ) : selectedApi.endpoints.map(ep => (
//                     <div className="endpoint-row" key={ep.endpointId}>
//                       <div className="method-badge" style={{
//                         background: `${METHOD_COLORS[ep.httpMethod]}18`,
//                         color: METHOD_COLORS[ep.httpMethod],
//                         border: `1px solid ${METHOD_COLORS[ep.httpMethod]}30`,
//                       }}>
//                         {ep.httpMethod}
//                       </div>
//                       <div className="endpoint-path">{ep.path}</div>
//                       <div className="endpoint-desc">{ep.description || '—'}</div>
//                       <div className="auth-tag" style={{
//                         background: ep.isAuthenticated ? 'rgba(13,148,136,0.1)' : 'rgba(107,114,128,0.1)',
//                         color: ep.isAuthenticated ? '#0d9488' : '#6b7280',
//                         border: `1px solid ${ep.isAuthenticated ? 'rgba(13,148,136,0.2)' : 'rgba(107,114,128,0.2)'}`,
//                       }}>
//                         {ep.isAuthenticated ? '🔒 Auth' : 'Public'}
//                       </div>
//                       <button className="endpoint-del" onClick={() => handleDeleteEndpoint(ep.endpointId)}>✕</button>
//                     </div>
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//         </main>
//       </div>

//       {/* ── Add Endpoint Modal ── */}
//       {endpointModal && (
//         <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEndpointModal(false)}>
//           <div className="modal">
//             <div className="modal-title">Add Endpoint</div>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//               <div className="form-group">
//                 <label className="form-label">HTTP Method</label>
//                 <select className="form-select" value={newEndpoint.httpMethod}
//                   onChange={e => setNewEndpoint(n => ({ ...n, httpMethod: e.target.value }))}>
//                   {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m}>{m}</option>)}
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Path *</label>
//                 <input className="form-input" placeholder="/resource/{id}"
//                   value={newEndpoint.path}
//                   onChange={e => setNewEndpoint(n => ({ ...n, path: e.target.value }))} />
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Description</label>
//                 <input className="form-input" placeholder="What does this endpoint do?"
//                   value={newEndpoint.description}
//                   onChange={e => setNewEndpoint(n => ({ ...n, description: e.target.value }))} />
//               </div>
//               <div className="form-group">
//                 <label className="form-label">Authentication</label>
//                 <select className="form-select" value={newEndpoint.isAuthenticated ? 'yes' : 'no'}
//                   onChange={e => setNewEndpoint(n => ({ ...n, isAuthenticated: e.target.value === 'yes' }))}>
//                   <option value="yes">Required (Protected)</option>
//                   <option value="no">Not Required (Public)</option>
//                 </select>
//               </div>
//             </div>
//             <div className="modal-footer">
//               <button className="topbar-btn btn-ghost" onClick={() => setEndpointModal(false)}>Cancel</button>
//               <button className="topbar-btn btn-primary" onClick={handleAddEndpoint} disabled={!!actionLoading}>
//                 {actionLoading === 'add-endpoint' ? <><span className="spinner" />Adding...</> : 'Add Endpoint'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── Toast ── */}
//       {toast && (
//         <div className={`toast ${toast.type}`}>
//           <span>{toast.type === 'success' ? '✓' : '✕'}</span>
//           {toast.msg}
//         </div>
//       )}
//     </>
//   )
// }

// // ── Sub Components ─────────────────────────────────────────────────────────────
// function StatusBadge({ status }: { status: string }) {
//   const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
//   return (
//     <span className="status-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
//       <span className="status-dot" style={{ background: cfg.color }} />
//       {cfg.label}
//     </span>
//   )
// }

// function ApiCard({ api, index, onOpen, onLifecycle, onDelete, actionLoading }: {
//   api: ApiItem; index: number
//   onOpen: () => void
//   onLifecycle: (id: number, action: 'publish' | 'deprecate' | 'retire') => void
//   onDelete: (id: number) => void
//   actionLoading: string | null
// }) {
//   return (
//     <div className="api-card" style={{ animationDelay: `${index * 0.05}s` }}>
//       <div className="api-card-top">
//         <div>
//           <div className="api-name">{api.apiName}</div>
//         </div>
//         <span className="api-version">{api.version}</span>
//       </div>
//       <div className="api-desc">{api.description || 'No description provided'}</div>
//       <div className="api-card-footer">
//         <StatusBadge status={api.status} />
//         <div className="api-meta">
//           <div className="api-meta-item">⬡ {api.endpoints?.length || 0} endpoints</div>
//         </div>
//       </div>
//       <div className="api-actions">
//         <button className="action-btn" onClick={onOpen}>View Detail</button>
//         {api.status === 'draft' && (
//           <button className="action-btn publish"
//             disabled={!!actionLoading}
//             onClick={e => { e.stopPropagation(); onLifecycle(api.apiId, 'publish') }}>
//             {actionLoading === `publish-${api.apiId}` ? '...' : '◉ Publish'}
//           </button>
//         )}
//         {api.status === 'published' && (
//           <button className="action-btn deprecate"
//             disabled={!!actionLoading}
//             onClick={e => { e.stopPropagation(); onLifecycle(api.apiId, 'deprecate') }}>
//             Deprecate
//           </button>
//         )}
//         {api.status !== 'published' && (
//           <button className="action-btn del"
//             disabled={!!actionLoading}
//             onClick={e => { e.stopPropagation(); onDelete(api.apiId) }}>
//             Delete
//           </button>
//         )}
//       </div>
//     </div>
//   )
// }