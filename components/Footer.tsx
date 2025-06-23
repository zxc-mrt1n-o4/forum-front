export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-400">
            Простой блог © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  )
} 