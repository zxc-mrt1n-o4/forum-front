'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated and is admin
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/verify`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Не авторизован');
      }

      const userData = await response.json();
      
      if (!userData.user.isAdmin) {
        throw new Error('Нет прав администратора');
      }

      // If admin, redirect to admin panel
      router.push('/admin');
    } catch (error: any) {
      console.error('Admin access check failed:', error);
      setError(error.message || 'Ошибка проверки доступа');
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-red-900/50 border border-red-600 text-red-200 px-8 py-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold mb-4">Доступ ограничен</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Войти в систему
          </button>
        </div>
        <p className="text-gray-500 text-sm">
          Эта страница доступна только администраторам
        </p>
      </div>
    </div>
  );
} 