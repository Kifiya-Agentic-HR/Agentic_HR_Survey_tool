"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const tabs = ["Event Logs", "Access Logs"];

export default function AuditLogsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ user_id: '', event_type: '', ip: '', role: '', start: '', end: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Protect page: only allow logged-in HR_admin
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userStr = localStorage.getItem('user');
    if (!isAuthenticated || !userStr) {
      router.replace('/auth/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'HR_admin') {
      router.replace('/dashboard');
      return;
    }
  }, [router]);

  const fetchLogs = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    let url = activeTab === 0 ? '/admin/audit/event-logs' : '/admin/audit/access-logs';
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setLogs(res.ok ? await res.json() : []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <Link href="/admin" className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium">Back to Admin</Link>
      </div>
      <div className="mb-6 flex gap-4">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-2 rounded ${activeTab === i ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>{tab}</button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <input placeholder="User ID" className="border rounded px-2 py-1" value={filters.user_id} onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))} />
        {activeTab === 0 && <input placeholder="Event Type" className="border rounded px-2 py-1" value={filters.event_type} onChange={e => setFilters(f => ({ ...f, event_type: e.target.value }))} />}
        {activeTab === 1 && <input placeholder="Role" className="border rounded px-2 py-1" value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))} />}
        <input placeholder="IP Address" className="border rounded px-2 py-1" value={filters.ip} onChange={e => setFilters(f => ({ ...f, ip: e.target.value }))} />
        <input type="date" className="border rounded px-2 py-1" value={filters.start} onChange={e => setFilters(f => ({ ...f, start: e.target.value }))} />
        <input type="date" className="border rounded px-2 py-1" value={filters.end} onChange={e => setFilters(f => ({ ...f, end: e.target.value }))} />
        <button onClick={fetchLogs} className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        {loading ? <div>Loading...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Timestamp</th>
                <th className="py-2 px-4 border-b">User ID</th>
                {activeTab === 0 ? <th className="py-2 px-4 border-b">Event Type</th> : <th className="py-2 px-4 border-b">Role</th>}
                <th className="py-2 px-4 border-b">IP</th>
                <th className="py-2 px-4 border-b">Details/Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td className="py-2 px-4 border-b">{activeTab === 0 ? log.timestamp : log.accessed_at}</td>
                  <td className="py-2 px-4 border-b">{log.user_id}</td>
                  {activeTab === 0 ? <td className="py-2 px-4 border-b">{log.event_type}</td> : <td className="py-2 px-4 border-b">{log.user_role}</td>}
                  <td className="py-2 px-4 border-b">{log.ip_address}</td>
                  <td className="py-2 px-4 border-b">{activeTab === 0 ? JSON.stringify(log.event_details) : log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 