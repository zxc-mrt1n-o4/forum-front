'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface Post {
  id: number
  title: string
  content: string
  author: string
  createdAt: string
  likes: number
  userLiked: boolean
  anonymous: boolean
}

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const postsPerPage = 10

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const fetchedPosts = await api.getPosts()
      setPosts(fetchedPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
      if (typeof window !== 'undefined') {
        toast.error('Ошибка загрузки постов')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: number) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        toast.error('Войдите в аккаунт, чтобы поставить лайк');
      }
      return;
    }

    try {
      const response = await api.likePost(postId.toString())
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: response.likes,
              userLiked: response.userHasLiked || response.userLiked
            }
          : post
      ))
      
      // Show appropriate message based on action
      if (typeof window !== 'undefined') {
        if (response.userHasLiked || response.userLiked) {
          toast.success('Лайк добавлен!');
        } else {
          toast.success('Лайк убран');
        }
      }
    } catch (error) {
      console.error('Error liking post:', error)
      if (typeof window !== 'undefined') {
        toast.error('Ошибка при изменении лайка')
      }
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Поиск постов..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Posts List */}
      {currentPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            {searchTerm ? 'Посты не найдены' : 'Пока нет постов'}
          </p>
        </div>
      ) : (
    <div className="space-y-6">
          {currentPosts.map((post) => (
            <article
              key={post.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {post.title}
              </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={!isAuthenticated}
                    className={`flex items-center space-x-1 transition-colors ${
                      isAuthenticated 
                        ? (post.userLiked 
                          ? 'text-red-500 hover:text-red-400' 
                          : 'text-gray-400 hover:text-red-400')
                        : 'text-gray-600 cursor-not-allowed'
                    }`}
                    title={!isAuthenticated ? 'Войдите, чтобы поставить лайк' : ''}
                  >
                    <svg className="w-5 h-5" fill={post.userLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{post.likes}</span>
                  </button>
            </div>
          </div>
          
              <div className="text-gray-300 mb-4 leading-relaxed">
                {post.content.length > 300 
                  ? `${post.content.substring(0, 300)}...` 
              : post.content
            }
              </div>

              <div className="flex justify-between items-center text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>
                    {post.anonymous ? 'Аноним' : post.author}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                
                <a
                  href={`/posts/${post.id}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Читать далее →
                </a>
              </div>
            </article>
              ))}
            </div>
          )}
          
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
            Назад
          </button>
            
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  )
} 