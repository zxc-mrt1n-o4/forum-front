'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannedMessage, setBannedMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for banned message from localStorage
    const banned = localStorage.getItem('bannedMessage')
    if (banned) {
      setBannedMessage(banned)
      localStorage.removeItem('bannedMessage')
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setBannedMessage(null)

    try {
      const response = await api.login(formData)
      
      // Проверяем верификацию пользователя
      if (!response.user.isVerified) {
        toast('Ваш аккаунт ожидает подтверждения администратора', { 
          icon: 'ℹ️',
          duration: 4000 
        })
      }
      
      // Перезагружаем страницу для обновления состояния навбара
      if (typeof window !== 'undefined') {
        toast.success('Вход выполнен успешно!')
        window.location.href = '/'
      }
    } catch (err: any) {
      let errorMessage = 'Ошибка подключения к серверу'
      
      if (err.message) {
        if (err.message.includes('неверные учетные данные')) {
          errorMessage = 'Неверный email или пароль'
        } else if (err.message.includes('Слишком много запросов')) {
          errorMessage = err.message
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      if (typeof window !== 'undefined') {
        toast.error(err.message || 'Ошибка входа')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-700 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Вход в аккаунт</h1>
            <p className="text-gray-400">Войдите чтобы создавать посты</p>
        </div>

          {bannedMessage && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">🚫</span>
                <div>
                  <strong>Аккаунт заблокирован</strong>
                  <p className="text-sm mt-1">{bannedMessage}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-4 py-3 focus:border-gray-400 focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-4 py-3 focus:border-gray-400 focus:outline-none transition-colors"
                placeholder="Ваш пароль"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-gray-300 hover:text-white underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 

export default LoginPage 