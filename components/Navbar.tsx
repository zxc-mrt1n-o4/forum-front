'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Always fetch fresh user data from backend with proper auth header
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/auth/verify`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          throw new Error('Verification failed');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      api.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Лого */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg border-2 border-gray-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl font-serif">F</span>
            </div>
            <span className="text-xl font-bold text-white">Форум</span>
          </Link>

          {/* Навигация */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Посты
            </Link>

            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link href="/create-post" className="text-gray-300 hover:text-white transition-colors">
                      Создать пост
                    </Link>
                    
                    {user.isAdmin && (
                      <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                        Админ
                      </Link>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">
                        Привет, {user.username}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Выйти
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Войти
                    </Link>
                    <Link
                      href="/register"
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      Регистрация
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 