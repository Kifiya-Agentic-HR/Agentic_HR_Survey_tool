'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (isAuthenticated) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'HR_admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
      router.push('/dashboard');
      }
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}