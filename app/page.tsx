import PostList from '@/components/PostList'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Форум
          </h1>
          <p className="text-gray-400">
            Место для обмена мнениями и обсуждений
          </p>
        </div>
        
        <PostList />
      </div>
    </div>
  )
} 