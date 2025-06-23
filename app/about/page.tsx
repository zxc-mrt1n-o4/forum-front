import React from 'react'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-700 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-6">О форуме</h1>
          
          <div className="text-gray-300 space-y-4 leading-relaxed">
            <p>
              Это простой форум для обмена мнениями и обсуждений различных тем.
            </p>
            
            <p>
              Здесь вы можете:
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Создавать посты на любые темы</li>
              <li>Комментировать посты других пользователей</li>
              <li>Публиковать контент анонимно</li>
              <li>Читать интересные обсуждения</li>
            </ul>
            
            <p>
              Для участия в форуме необходимо зарегистрироваться. 
              Незарегистрированные пользователи могут просматривать только первые 10 постов.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 