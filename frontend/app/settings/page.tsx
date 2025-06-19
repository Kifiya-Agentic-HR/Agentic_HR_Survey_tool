"use client";
import { useState } from "react";
import { authService } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleChangePassword} className="w-full max-w-md space-y-6 p-8 border rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Change Password</h2>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <Input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
} 