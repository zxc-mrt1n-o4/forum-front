'use client'

import { useState, useEffect } from 'react'
import { admin } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface User {
  id: number
  username: string
  email: string
  role: string
  isActive: number
  isVerified: number
  verifiedAt: string | null
  createdAt: string
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([])
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const [usersData, pendingResponse, statsResponse] = await Promise.all([
        admin.getUsers(),
        fetch(`${apiUrl}/api/admin/users/pending`, {
          credentials: 'include',
        }).then(res => res.json()),
        fetch(`${apiUrl}/api/admin/stats`, {
          credentials: 'include',
        }).then(res => res.json())
      ])
      
      setUsers(usersData)
      setPendingUsers(pendingResponse.users || [])
      setStats(statsResponse.stats || {})
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      if (typeof window !== 'undefined') {
        toast.error('Ошибка загрузки данных')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyUser = async (userId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (typeof window !== 'undefined') {
          toast.success(result.message);
        }
        // Refresh data
        const apiUrl2 = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const [pendingResponse, statsResponse] = await Promise.all([
          fetch(`${apiUrl2}/api/admin/users/pending`, {
            credentials: 'include',
          }),
          fetch(`${apiUrl2}/api/admin/stats`, {
            credentials: 'include',
          }),
        ]);
        
        const pendingData = await pendingResponse.json();
        const statsData = await statsResponse.json();
        
        setPendingUsers(pendingData.users || []);
        setStats(statsData.stats || {});
      } else {
        const error = await response.json();
        if (typeof window !== 'undefined') {
          toast.error(error.message || 'Ошибка верификации');
        }
      }
    } catch (error) {
      console.error('Verify error:', error);
      if (typeof window !== 'undefined') {
        toast.error('Ошибка верификации пользователя');
      }
    }
  };

  const handleUnverifyUser = async (userId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/unverify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json()
      
      if (data.success) {
        if (typeof window !== 'undefined') {
          toast.success('Верификация отменена!')
        }
        fetchData() // Refresh data
      } else {
        if (typeof window !== 'undefined') {
          toast.error(data.message || 'Ошибка отмены верификации')
        }
      }
    } catch (error) {
      console.error('Unverification error:', error)
      if (typeof window !== 'undefined') {
        toast.error('Ошибка отмены верификации')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
    </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Админ панель</h1>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-2">Всего пользователей</h3>
              <p className="text-3xl font-bold text-gray-300">{stats.totalUsers}</p>
                      </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-2">Всего постов</h3>
              <p className="text-3xl font-bold text-gray-300">{stats.totalPosts}</p>
                      </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-2">Анонимных постов</h3>
              <p className="text-3xl font-bold text-gray-300">{stats.anonymousPosts}</p>
                    </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-2">Комментариев</h3>
              <p className="text-3xl font-bold text-gray-300">{stats.totalComments}</p>
              </div>
          </div>
        )}

        {/* Pending Users */}
        <div className="bg-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Пользователи на верификации ({pendingUsers.length})
          </h2>
            
          {pendingUsers.length === 0 ? (
            <p className="text-gray-400">Нет пользователей ожидающих верификации</p>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-gray-300 py-2">Имя пользователя</th>
                    <th className="text-gray-300 py-2">Email</th>
                    <th className="text-gray-300 py-2">Дата регистрации</th>
                    <th className="text-gray-300 py-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-600">
                      <td className="text-white py-3">{user.username}</td>
                      <td className="text-gray-300 py-3">{user.email}</td>
                      <td className="text-gray-400 py-3">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleVerifyUser(user.id)}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm mr-2"
                        >
                          Верифицировать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                      </div>
          )}
                    </div>
                    
        {/* All Users */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Все пользователи ({users.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-gray-300 py-2">ID</th>
                  <th className="text-gray-300 py-2">Имя пользователя</th>
                  <th className="text-gray-300 py-2">Email</th>
                  <th className="text-gray-300 py-2">Роль</th>
                  <th className="text-gray-300 py-2">Статус</th>
                  <th className="text-gray-300 py-2">Верификация</th>
                  <th className="text-gray-300 py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-600">
                    <td className="text-gray-400 py-3">{user.id}</td>
                    <td className="text-white py-3">{user.username}</td>
                    <td className="text-gray-300 py-3">{user.email}</td>
                    <td className="text-gray-300 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-gray-300 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isActive ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="text-gray-300 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.isVerified ? 'bg-blue-600' : 'bg-orange-600'
                      }`}>
                        {user.isVerified ? 'Верифицирован' : 'Не верифицирован'}
                          </span>
                    </td>
                    <td className="py-3">
                      {user.isVerified ? (
                        <button
                          onClick={() => handleUnverifyUser(user.id)}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Отменить
                        </button>
                        ) : (
                          <button
                          onClick={() => handleVerifyUser(user.id)}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                          >
                          Верифицировать
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 

export default AdminDashboard 