'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId: number | null;
  isAnonymous: boolean; // Backend uses isAnonymous
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  userHasLiked: boolean;
}

interface RateLimitInfo {
  message: string;
  cooldownMinutes: number;
  isAuthenticated: boolean;
  hint?: string;
  timestamp: number;
}

const PostList = () => {
  const [postList, setPostList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) {
      checkUserVerification();
    }
    fetchPosts();
    
    // Check for stored rate limit info
    const storedRateLimit = localStorage.getItem('rateLimitInfo');
    if (storedRateLimit) {
      try {
        const rateLimitData = JSON.parse(storedRateLimit);
        const timePassed = Date.now() - rateLimitData.timestamp;
        const cooldownMs = rateLimitData.cooldownMinutes * 60 * 1000;
        
        if (timePassed < cooldownMs) {
          setRateLimitInfo(rateLimitData);
          setCountdown(Math.ceil((cooldownMs - timePassed) / 1000));
        } else {
          // Cooldown expired, clear stored info
          localStorage.removeItem('rateLimitInfo');
        }
      } catch (e) {
        localStorage.removeItem('rateLimitInfo');
      }
    }
  }, []);

  const checkUserVerification = async () => {
    try {
      const response = await api.verify();
      setIsVerified(response.user.isVerified || false);
    } catch (error) {
      console.error('Verification check failed:', error);
      setIsVerified(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const postsData = await api.getPosts();
      setPostList(postsData);
    } catch (error: any) {
      console.error('Fetch posts error:', error);
      
      // Check if this is a rate limit error
      if (error.message?.includes('Слишком много запросов')) {
        const storedRateLimit = localStorage.getItem('rateLimitInfo');
        if (storedRateLimit) {
          try {
            const rateLimitData = JSON.parse(storedRateLimit);
            setRateLimitInfo(rateLimitData);
            setCountdown(rateLimitData.cooldownMinutes * 60);
          } catch (e) {
            setError(error.message);
          }
        } else {
          setError(error.message);
        }
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        toast.error('Войдите в аккаунт, чтобы поставить лайк');
      }
      return;
    }

    try {
      const result = await api.likePost(postId.toString());
      
      // Update the post in the list
      setPostList(prev => 
        prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                likes: result.likes,
                userHasLiked: result.userHasLiked
              }
            : post
        )
      );
      
      // Show appropriate message based on action
      if (typeof window !== 'undefined') {
        if (result.userHasLiked) {
          toast.success('Лайк добавлен!');
        } else {
          toast.success('Лайк убран');
        }
      }
    } catch (err) {
      console.error('Like error:', err);
      if (typeof window !== 'undefined') {
        toast.error('Ошибка при изменении лайка');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (rateLimitInfo && countdown === 0) {
      // Cooldown finished, clear rate limit info and retry
      setRateLimitInfo(null);
      localStorage.removeItem('rateLimitInfo');
      fetchPosts();
    }
  }, [countdown, rateLimitInfo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
        <p>{error}</p>
        <button 
          onClick={fetchPosts}
          className="mt-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (postList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg mb-4">Пока нет постов</p>
        {isAuthenticated && isVerified && (
          <Link 
            href="/create-post"
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
          >
            Создать первый пост
          </Link>
        )}
        {isAuthenticated && !isVerified && (
          <p className="text-yellow-400 text-sm">
            Ваш аккаунт ожидает подтверждения администратора
          </p>
        )}
      </div>
    );
  }

  // Ограничиваем посты для неавторизованных пользователей
  const displayPosts = isAuthenticated ? postList : postList.slice(0, 10);

  if (rateLimitInfo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 p-6 rounded-lg text-center">
          <div className="text-3xl mb-4">⏳</div>
          <h3 className="text-xl font-bold mb-2">Превышен лимит запросов</h3>
          <p className="mb-4">{rateLimitInfo.message}</p>
          
          {countdown > 0 && (
            <div className="mb-4">
              <div className="text-2xl font-mono text-yellow-400 mb-2">
                {formatCountdown(countdown)}
              </div>
              <p className="text-sm text-yellow-300">
                Повторная попытка через {formatCountdown(countdown)}
              </p>
            </div>
          )}
          
          {rateLimitInfo.hint && (
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded">
              <p className="text-blue-200 text-sm">
                💡 {rateLimitInfo.hint}
              </p>
            </div>
          )}
          
          <button
            onClick={fetchPosts}
            disabled={countdown > 0}
            className={`mt-4 px-6 py-2 rounded-lg transition-colors ${
              countdown > 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {countdown > 0 ? 'Ожидание...' : 'Попробовать снова'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isAuthenticated && postList.length > 10 && (
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded mb-6">
          <p className="text-sm">
            Показано только 10 постов. 
            <Link href="/register" className="text-yellow-400 hover:text-yellow-300 underline ml-1">
              Зарегистрируйтесь
            </Link>
            {' '}или{' '}
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300 underline">
              войдите
            </Link>
            {' '}чтобы увидеть все посты.
          </p>
        </div>
      )}

      {displayPosts.map((post) => (
        <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2 hover:text-gray-300">
                <Link href={`/posts/${post.id}`}>
                  {post.title}
                </Link>
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>
                  {post.isAnonymous ? (
                    <span className="text-gray-500">Аноним</span>
                  ) : (
                    <span className="text-gray-300">{post.author}</span>
                  )}
                </span>
                <span>{formatDate(post.createdAt)}</span>
                <span>{post.views} просмотров</span>
              </div>
            </div>
          </div>

          <div className="text-gray-300 mb-4 leading-relaxed">
            {truncateContent(post.content)}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLike(post.id)}
                disabled={!isAuthenticated}
                className={`flex items-center space-x-1 transition-colors ${
                  isAuthenticated 
                    ? 'text-gray-400 hover:text-red-400 cursor-pointer' 
                    : 'text-gray-600 cursor-not-allowed'
                }`}
                title={!isAuthenticated ? 'Войдите, чтобы поставить лайк' : ''}
              >
                <span className={`text-xl ${post.userHasLiked ? 'text-red-500' : ''}`}>
                  {post.userHasLiked ? '❤️' : '🤍'}
                </span>
                <span>{post.likes}</span>
              </button>
            </div>
            
            <Link
              href={`/posts/${post.id}`}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Читать полностью →
            </Link>
          </div>
        </div>
      ))}

      {!isAuthenticated && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Хотите видеть больше постов?</p>
          <div className="space-x-4">
            <Link 
              href="/register"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
            >
              Регистрация
            </Link>
            <Link 
              href="/login"
              className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-6 py-2 rounded transition-colors"
            >
              Войти
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostList; 