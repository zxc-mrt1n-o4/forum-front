'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

const CreatePostPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    anonymous: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    
    // Check for verification message
    const verificationMsg = localStorage.getItem('verificationMessage')
    if (verificationMsg) {
      setVerificationMessage(verificationMsg)
      localStorage.removeItem('verificationMessage')
    }
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await api.verify()
      setIsAuthenticated(true)
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setVerificationMessage(null)

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Заголовок и содержание обязательны')
      if (typeof window !== 'undefined') {
        toast.error('Заголовок и содержание обязательны')
      }
      setLoading(false)
      return
    }

    try {
      await api.createPost(formData)
      if (typeof window !== 'undefined') {
        toast.success('Пост создан успешно!')
      }
      
      // Очищаем форму
      setFormData({
        title: '',
        content: '',
        anonymous: false
      })
      
      // Перенаправляем на главную страницу
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Ошибка создания поста')
      if (typeof window !== 'undefined') {
        toast.error(err.message || 'Ошибка создания поста')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-100">Создать пост</h1>
              <Link 
                href="/" 
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                ← Назад к постам
              </Link>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {verificationMessage && (
              <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 px-4 py-3 rounded mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {verificationMessage}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Заголовок
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="О чем ваш пост?"
                />
                <p className="text-gray-500 text-sm mt-1">
                  {formData.title.length}/200 символов
                </p>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                  Содержание
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={12}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Расскажите подробнее..."
                />
                <p className="text-gray-500 text-sm mt-1">
                  {formData.content.length}/5000 символов
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  name="anonymous"
                  checked={formData.anonymous}
                  onChange={handleChange}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                />
                <label htmlFor="anonymous" className="text-gray-300">
                  Опубликовать анонимно
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-md transition duration-200"
                >
                  {loading ? 'Публикация...' : 'Опубликовать пост'}
                </button>
                
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-md transition duration-200 text-center"
                >
                  Отмена
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePostPage 