'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      if (typeof window !== 'undefined') {
        toast.error('Пароли не совпадают')
      }
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      if (typeof window !== 'undefined') {
        toast.error('Пароль должен быть не менее 6 символов')
      }
      setLoading(false)
      return
    }

    try {
      const { confirmPassword, ...registerData } = formData
      const response = await api.register(registerData)
      if (typeof window !== 'undefined') {
        toast.success('Регистрация успешна! Ожидайте подтверждения администратора.')
      }
      
      // Перезагружаем страницу для обновления состояния навбара
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к серверу')
      if (typeof window !== 'undefined') {
        toast.error(err.message || 'Ошибка регистрации')
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
            <h1 className="text-2xl font-bold text-white mb-2">Регистрация</h1>
            <p className="text-gray-400">Создайте аккаунт чтобы участвовать в форуме</p>
        </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            <div>
              <label htmlFor="register-username" className="block text-sm font-medium text-gray-300 mb-2">
                Имя пользователя
              </label>
              <input
                type="text"
                id="register-username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-4 py-3 focus:border-gray-400 focus:outline-none transition-colors"
                placeholder="Ваше имя"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="register-email"
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
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="register-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-4 py-3 focus:border-gray-400 focus:outline-none transition-colors"
                placeholder="Минимум 6 символов"
              />
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                Подтвердите пароль
              </label>
              <input
                type="password"
                id="register-confirm-password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-4 py-3 focus:border-gray-400 focus:outline-none transition-colors"
                placeholder="Повторите пароль"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-gray-300 hover:text-white underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 

export default RegisterPage 