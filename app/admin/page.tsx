'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { admin } from '../../lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  isBlocked: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  realAuthorId?: number;
  realAuthor?: string;
  author: string;
  createdAt: string;
  isHidden: boolean;
  likes: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Try to load admin data directly - this will fail if not admin
      const [usersData, postsData] = await Promise.all([
        admin.getUsers(),
        admin.getPosts()
      ]);
      
      setUsers(usersData);
      setPosts(postsData);
    } catch (error: any) {
      console.error('Admin access denied:', error);
      
      if (error.message?.includes('администратора') || error.message?.includes('admin')) {
        setAuthError('У вас нет прав администратора');
      } else if (error.message?.includes('токен') || error.message?.includes('аутентификация')) {
        setAuthError('Требуется вход в систему');
      } else {
        setAuthError('Ошибка доступа к админ-панели');
      }
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [usersData, postsData] = await Promise.all([
        admin.getUsers(),
        admin.getPosts()
      ]);
      setUsers(usersData);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleUserAction = async (action: 'block' | 'unblock' | 'verify' | 'unverify' | 'delete', userId: number) => {
    try {
      let result;
      switch (action) {
        case 'block':
          result = await admin.blockUser(userId);
          break;
        case 'unblock':
          result = await admin.unblockUser(userId);
          break;
        case 'verify':
          result = await admin.verifyUser(userId);
          break;
        case 'unverify':
          result = await admin.unverifyUser(userId);
          break;
        case 'delete':
          if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить!')) {
            return;
          }
          result = await admin.deleteUser(userId);
          break;
      }
      
      if (result.success) {
        alert(result.message);
        await loadData();
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при изменении статуса пользователя';
      alert(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-900/50 border border-red-600 text-red-200 px-6 py-4 rounded-lg mb-4">
            <h2 className="text-xl font-bold mb-2">Доступ запрещен</h2>
            <p>{authError}</p>
          </div>
          <p className="text-gray-400">Перенаправление на страницу входа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Админ Панель</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Пользователи ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'posts' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Посты ({posts.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Верификация
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Дата регистрации
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {user.id}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-100 font-medium">
                        {user.username}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isBlocked
                            ? 'bg-red-900 text-red-200'
                            : 'bg-green-900 text-green-200'
                        }`}>
                          {user.isBlocked ? 'Заблокирован' : 'Активен'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isVerified
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}>
                          {user.isVerified ? 'Верифицирован' : 'Ожидает'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 px-4">
                        {!user.isAdmin ? (
                          <div className="flex space-x-2">
                            {/* Block/Unblock buttons */}
                            {!user.isBlocked ? (
                              <button
                                onClick={() => handleUserAction('block', user.id)}
                                className="px-3 py-1 rounded text-sm font-medium bg-red-600 hover:bg-red-700"
                              >
                                Заблокировать
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction('unblock', user.id)}
                                className="px-3 py-1 rounded text-sm font-medium bg-green-600 hover:bg-green-700"
                              >
                                Разблокировать
                              </button>
                            )}
                            
                            {/* Verify/Unverify buttons */}
                            {!user.isVerified ? (
                              <button
                                onClick={() => handleUserAction('verify', user.id)}
                                className="px-3 py-1 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700"
                              >
                                Верифицировать
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction('unverify', user.id)}
                                className="px-3 py-1 rounded text-sm font-medium bg-yellow-600 hover:bg-yellow-700"
                              >
                                Отменить
                              </button>
                            )}

                            {/* Delete button */}
                            <button
                              onClick={() => handleUserAction('delete', user.id)}
                              className="px-3 py-1 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-red-300 hover:text-red-200"
                              title="Удалить пользователя"
                            >
                              🗑️
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Администратор</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Посты и их авторы</h2>
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-2">{post.title}</h3>
                      <p className="text-gray-300 text-sm mb-3">
                        {post.content.length > 200 
                          ? post.content.substring(0, 200) + '...' 
                          : post.content
                        }
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-400">ID: {post.id}</div>
                      <div className="text-sm text-gray-400">❤️ {post.likes}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-600 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Показывается как:</span>
                        <div className="font-medium">
                          {post.isAnonymous ? (
                            <span className="text-purple-400">Анонимный пост</span>
                          ) : (
                            <span className="text-blue-400">{post.author}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Реальный автор:</span>
                        <div className="font-medium text-yellow-400">
                          {post.realAuthor || post.author}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Дата создания:</span>
                        <div className="font-medium">{formatDate(post.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <button
                        onClick={() => window.open(`/admin/posts/${post.id}`, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium"
                      >
                        📋 Подробности поста
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {posts.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Постов не найдено
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 