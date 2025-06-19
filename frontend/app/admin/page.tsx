"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { authService, User } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const roles = ["HR_admin", "HR_user", "User"];

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", role: "User", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setUsers(await res.json());
        }
      } catch (e) {}
    };
    fetchUsers();
  }, [success]);

  const handleInputChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: string) => {
    setForm({ ...form, role });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authService.adminCreateUser(form);
      setSuccess("User created successfully");
      setForm({ first_name: "", last_name: "", email: "", role: "User", password: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "User creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    const newPass = prompt("Enter new password for this user:");
    if (newPass) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email, new_password: newPass }),
        });
        if (res.ok) alert('Password reset!');
        else alert('Failed to reset password');
      } catch (e) { alert('Error'); }
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.replace('/auth/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div className="flex-1 bg-gradient-to-br from-teal-600 to-teal-800 text-white p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-8 h-8 bg-orange-500 rounded"></div>
            <span className="text-xl font-semibold">Kifiya</span>
          </div>
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-6 leading-tight">
                Admin Panel<br />
                User Management
              </h1>
              <p className="text-teal-100 text-lg mb-12 max-w-md">
                Manage users, assign roles, and control access to the Agentic HR Survey Platform.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="text-orange-400">&#9881;</span>
                <span className="text-teal-100">Add, edit, and reset user credentials.</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-orange-400">&#128100;</span>
                <span className="text-teal-100">Assign roles: HR_admin, HR_user, User.</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-orange-400">&#128202;</span>
                <span className="text-teal-100">Access advanced survey analytics.</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      {/* Right Side - Admin Form Section */}
      <div className="flex-1 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-xl">
          <div className="flex justify-end mb-6 gap-4">
            <Link href="/dashboard" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors">Survey Dashboard</Link>
            <Link href="/admin/users" className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium">User Management</Link>
            <Link href="/admin/audit-logs" className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium">Audit Logs</Link>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors">Logout</button>
          </div>
          <form onSubmit={handleAddUser} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Create User</h2>
            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
            <Input name="first_name" placeholder="Enter first name" value={form.first_name} onChange={handleInputChange} required />
            <Input name="last_name" placeholder="Enter last name" value={form.last_name} onChange={handleInputChange} required />
            <Input name="email" type="email" placeholder="Enter email" value={form.email} onChange={handleInputChange} required />
            <Input name="password" type="password" placeholder="Enter default password" value={form.password} onChange={handleInputChange} required />
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <Select value={form.role} onValueChange={handleRoleChange}>
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
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3">
              {loading ? "Creating..." : "Create User"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 