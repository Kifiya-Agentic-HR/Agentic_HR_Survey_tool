"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/auth";
import Link from "next/link";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', role: '' });
  const [editLoading, setEditLoading] = useState(false);

  const roles = ["HR_admin", "HR_user", "User"];

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

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setError("Failed to fetch users");
      }
    } catch (e) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [router]);

  const handleResetPassword = async (email: string) => {
    const newPass = prompt("Enter new password for this user:");
    if (newPass) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE_URL}/admin/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email, new_password: newPass }),
        });
        if (res.ok) {
          alert('Password reset!');
          fetchUsers();
        } else {
          alert('Failed to reset password');
        }
      } catch (e) { alert('Error'); }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          alert('User deleted!');
          fetchUsers();
        } else {
          alert('Failed to delete user');
        }
      } catch (e) { alert('Error'); }
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const url = isActive ? `${API_BASE_URL}/admin/users/${userId}/deactivate` : `${API_BASE_URL}/admin/users/${userId}/activate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to update user status');
      }
    } catch (e) { alert('Error'); }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role });
  };
  const closeEdit = () => {
    setEditUser(null);
    setEditForm({ first_name: '', last_name: '', email: '', role: '' });
  };
  const handleEditInputChange = (e: any) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditRoleChange = (role: string) => {
    setEditForm({ ...editForm, role });
  };
  const handleEditSave = async () => {
    if (!editUser) return;
    setEditLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        closeEdit();
        fetchUsers();
      } else {
        alert('Failed to update user');
      }
    } catch (e) { alert('Error'); }
    setEditLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-600 to-teal-800">
      <div className="flex items-center justify-between p-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded"></div>
          <span className="text-xl font-semibold text-white">Kifiya</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-10 mt-8 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
            <div className="flex gap-4">
              <Link href="/dashboard" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors">Go to Survey Dashboard</Link>
              <Link href="/admin" className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium">Back to Admin</Link>
            </div>
          </div>
          <h3 className="text-lg font-bold mb-4 text-gray-800">All Users</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : users.length > 0 ? (
            <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Role</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: User) => (
                  <tr key={u.id} className="even:bg-gray-50">
                    <td className="py-2 px-4 border-b">{u.first_name} {u.last_name}</td>
                    <td className="py-2 px-4 border-b">{u.email}</td>
                    <td className="py-2 px-4 border-b">{u.role}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleResetPassword(u.email)}
                        className="text-blue-600 underline mr-2"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="ml-2 px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`ml-2 px-3 py-1 rounded ${u.is_active ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="ml-2 px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500">No users found.</div>
          )}
          <div className="flex justify-end mt-6">
            <button onClick={fetchUsers} className="text-blue-600 underline">Refresh</button>
          </div>
        </div>
      </div>
      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit User</h3>
            <div className="space-y-4">
              <input name="first_name" className="w-full border rounded px-3 py-2" placeholder="First Name" value={editForm.first_name} onChange={handleEditInputChange} />
              <input name="last_name" className="w-full border rounded px-3 py-2" placeholder="Last Name" value={editForm.last_name} onChange={handleEditInputChange} />
              <input name="email" className="w-full border rounded px-3 py-2" placeholder="Email" value={editForm.email} onChange={handleEditInputChange} />
              <div>
                <label className="block mb-1 font-medium">Role</label>
                <Select value={editForm.role} onValueChange={handleEditRoleChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={closeEdit} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button onClick={handleEditSave} disabled={editLoading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 