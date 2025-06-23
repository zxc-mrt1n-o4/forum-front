'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface Post {
  id: number
  title: string
  content: string
  author: string
  authorId: number | null
  isAnonymous: boolean
  likes: number
  views: number
  createdAt: string
  updatedAt: string
  userHasLiked: boolean
}

interface Comment {
  id: number
  content: string
  author: string
  authorId: number | null
  isAnonymous: boolean
  createdAt: string
}

const PostPage = () => {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Comment form state
  const [commentForm, setCommentForm] = useState({
    content: '',
    anonymous: false
  })
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await api.getPost(params.id as string)
      setPost(response.post)
      setComments(response.comments || [])
    } catch (err: any) {
      setError('Ошибка загрузки поста')
      console.error('Fetch post error:', err)
      if (typeof window !== 'undefined') {
        toast.error('Ошибка загрузки поста')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        toast.error('Войдите в аккаунт, чтобы поставить лайк');
      }
      return;
    }
    
    try {
      const result = await api.likePost(post.id.toString())
      setPost(prev => prev ? { 
        ...prev, 
        likes: result.likes,
        userHasLiked: result.userHasLiked 
      } : null)
      
      // Show appropriate message based on action
      if (typeof window !== 'undefined') {
        if (result.userHasLiked) {
          toast.success('Лайк добавлен!');
        } else {
          toast.success('Лайк убран');
        }
      }
    } catch (err) {
      console.error('Like error:', err)
      if (typeof window !== 'undefined') {
        toast.error('Ошибка при изменении лайка')
      }
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!commentForm.content.trim()) {
      setCommentError('Содержание комментария обязательно')
      return
    }

    setCommentLoading(true)
    setCommentError(null)

    try {
      const newComment = await api.createComment(params.id as string, {
        content: commentForm.content,
        anonymous: commentForm.anonymous
      })
      
      setComments(prev => [...prev, newComment])
      if (typeof window !== 'undefined') {
        toast.success('Комментарий добавлен!')
      }
      setCommentForm({ content: '', anonymous: false })
    } catch (err: any) {
      setCommentError(err.message || 'Ошибка подключения к серверу')
      if (typeof window !== 'undefined') {
        toast.error('Ошибка добавления комментария')
      }
    } finally {
      setCommentLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-900 border border-red-700 text-red-200 px-6 py-4 rounded mb-6">
            <p className="text-lg">{error}</p>
            <Link href="/" className="text-red-400 hover:text-red-300 underline mt-2 inline-block">
              ← Вернуться к постам
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-gray-400 text-center">Пост не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
          >
            ← Вернуться к постам
          </Link>
        </div>

        {/* Post */}
        <article className="bg-gray-700 rounded-lg shadow-lg p-8 mb-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <span>
                  {post.isAnonymous ? (
                    <span className="text-gray-500">Аноним</span>
                  ) : (
                    <span className="text-gray-300">{post.author}</span>
                  )}
                </span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>{post.views} просмотров</span>
                <button
                  onClick={handleLike}
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
            </div>
          </header>

          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </article>

        {/* Comments Section */}
        <section className="bg-gray-700 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-white mb-6">
            Комментарии ({comments.length})
          </h2>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              {commentError && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
                  {commentError}
                </div>
              )}
              
              <textarea
                value={commentForm.content}
                onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                placeholder="Написать комментарий..."
                rows={4}
                maxLength={1000}
                className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-4 py-3 focus:border-gray-400 focus:outline-none transition-colors resize-none mb-4"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="commentAnonymous"
                    checked={commentForm.anonymous}
                    onChange={(e) => setCommentForm({ ...commentForm, anonymous: e.target.checked })}
                    className="h-4 w-4 text-gray-600 bg-gray-600 border-gray-500 rounded focus:ring-gray-500 focus:ring-2"
                  />
                  <label htmlFor="commentAnonymous" className="ml-2 text-sm text-gray-300">
                    Комментировать анонимно
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={commentLoading}
                  className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {commentLoading ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-600 border border-gray-500 rounded-lg p-4 mb-8 text-center">
              <p className="text-gray-300 mb-2">Войдите чтобы оставить комментарий</p>
              <div className="space-x-4">
                <Link 
                  href="/login"
                  className="text-gray-400 hover:text-white underline"
                >
                  Войти
                </Link>
                <Link 
                  href="/register"
                  className="text-gray-400 hover:text-white underline"
                >
                  Регистрация
                </Link>
              </div>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      {comment.isAnonymous ? (
                        <span className="text-gray-500">Аноним</span>
                      ) : (
                        <span className="text-gray-300">{comment.author}</span>
                      )}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <div className="text-gray-200 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              Пока нет комментариев. Будьте первым!
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default PostPage 