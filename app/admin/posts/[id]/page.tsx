'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { admin, auth } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Post {
  id: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  realAuthor?: string;
  author: string;
  createdAt: string;
  isHidden: boolean;
  likes: number;
  views: number;
  ipAddress?: string;
  userAgent?: string;
  browserFingerprint?: string;
  sessionId?: string;
  toxicityScore?: number;
}

interface Comment {
  id: number;
  content: string;
  author: string;
  realAuthorId?: number;
  realAuthorName?: string;
  isAnonymous: boolean;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
  browserFingerprint?: string;
  sessionId?: string;
}

const AdminPostDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    try {
      const response = await auth.verify();
      if (response.user && response.user.isAdmin) {
        loadPostData();
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const loadPostData = async () => {
    try {
      setLoading(true);
      const response = await admin.getPostDetails(params.id as string);
      
      if (response.success) {
        setPost(response.post);
        setComments(response.comments || []);
      } else {
        setError('Пост не найден');
      }
    } catch (error) {
      console.error('Error loading post details:', error);
      setError('Ошибка загрузки данных поста');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeanonymize = async () => {
    if (!post) return;
    
    try {
      const response = await admin.deanonymizePost(post.id);
      if (response.success) {
        setPost(prev => prev ? {
          ...prev,
          realAuthor: response.realAuthor
        } : null);
        toast.success('Пост деанонимизирован!');
      }
    } catch (err) {
      console.error('Deanonymize error:', err);
      toast.error('Ошибка деанонимизации');
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm('Вы уверены что хотите удалить этот пост?')) return;

    try {
      const response = await admin.deletePost(post.id.toString());
      if (response.success) {
        toast.success('Пост удален');
        router.push('/admin');
      }
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error('Ошибка удаления поста');
    }
  };

  const deanonymizeComment = async (commentId: number) => {
    try {
      const result = await admin.deanonymizeComment(commentId.toString());
      if (result.success) {
        // Refresh comments to show updated data
        await loadPostData();
        toast.success('Комментарий деанонимизирован!');
      }
    } catch (error) {
      console.error('Error deanonymizing comment:', error);
      toast.error('Ошибка деанонимизации комментария');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-900 border border-red-700 text-red-200 px-6 py-4 rounded mb-6">
            <p className="text-lg">{error || 'Пост не найден'}</p>
            <Link href="/admin" className="text-red-400 hover:text-red-300 underline mt-2 inline-block">
              ← Вернуться к админ панели
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/admin" 
            className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
          >
            ← Вернуться к админ панели
          </Link>
        </div>

        <div className="bg-gray-700 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Детали поста #{post.id}</h1>
            <p className="text-gray-400">Полная информация и управление постом</p>
          </div>

          {/* Post Details */}
          <div className="bg-gray-600 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-4">{post.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">ID:</span>
                    <span className="text-white ml-2">{post.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Статус:</span>
                    <span className="text-white ml-2">{post.isAnonymous ? 'Анонимный' : 'Публичный'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Автор:</span>
                    <span className="text-white ml-2">{post.author}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Анонимный:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      post.isAnonymous 
                        ? 'bg-yellow-800 text-yellow-200' 
                        : 'bg-green-800 text-green-200'
                    }`}>
                      {post.isAnonymous ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Лайки:</span>
                    <span className="text-white ml-2">{post.likes}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Просмотры:</span>
                    <span className="text-white ml-2">{post.views}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Создан:</span>
                    <span className="text-white ml-2">{formatDate(post.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Обновлен:</span>
                    <span className="text-white ml-2">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Author Info (if deanonymized) */}
            {post.realAuthor && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
                <h3 className="font-semibold mb-2">🕵️ Деанонимизация</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-red-300">Реальный автор:</span>
                    <span className="text-white ml-2">{post.realAuthor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Info */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-white mb-3">🔍 Техническая информация</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">IP адрес:</span>
                  <span className="text-white ml-2 font-mono">{post.ipAddress || 'Не записан'}</span>
                </div>
                <div>
                  <span className="text-gray-400">User Agent:</span>
                  <span className="text-white ml-2 font-mono text-xs">
                    {post.userAgent ? truncateText(post.userAgent, 80) : 'Не записан'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Отпечаток браузера:</span>
                  <span className="text-white ml-2 font-mono">{post.browserFingerprint || 'Не записан'}</span>
                </div>
                <div>
                  <span className="text-gray-400">ID сессии:</span>
                  <span className="text-white ml-2 font-mono">{post.sessionId || 'Не записан'}</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-white mb-3">📄 Содержание поста</h3>
              <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              {post.isAnonymous && !post.realAuthor && (
                <button
                  onClick={handleDeanonymize}
                  className="bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-colors"
                >
                  🕵️ Деанонимизировать
                </button>
              )}
              <button
                onClick={handleDeletePost}
                className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                🗑️ Удалить пост
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-gray-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              💬 Комментарии ({comments.length})
            </h2>

            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                          <span>ID: {comment.id}</span>
                          <span>Автор: {comment.author}</span>
                          <span>{formatDate(comment.createdAt)}</span>
                          {comment.isAnonymous && (
                            <span className="bg-yellow-800 text-yellow-200 px-2 py-1 rounded text-xs">
                              Анонимный
                            </span>
                          )}
                        </div>
                        
                        {comment.realAuthorName && (
                          <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded text-sm mb-2">
                            <strong>Реальный автор:</strong> {comment.realAuthorName} (ID: {comment.realAuthorId})
                          </div>
                        )}

                        <div className="text-gray-200 mb-3 whitespace-pre-wrap">
                          {comment.content}
                        </div>

                        {comment.ipAddress && (
                          <div className="text-xs text-gray-400 font-mono">
                            IP: {comment.ipAddress}
                          </div>
                        )}
                      </div>
                    </div>

                    {comment.isAnonymous && !comment.realAuthorName && (
                      <button
                        onClick={() => deanonymizeComment(comment.id)}
                        className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        🕵️ Деанонимизировать
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Нет комментариев</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPostDetailPage; 