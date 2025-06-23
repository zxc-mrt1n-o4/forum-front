# Forum Frontend

Frontend for the Anonymous Russian Forum built with Next.js, React, and Tailwind CSS.

## 🚀 Features

- **Anonymous Posting** - Complete anonymity protection for users
- **User Authentication** - Registration and login with JWT tokens
- **User Verification System** - Admin approval required for new accounts
- **Like System** - Toggle likes on posts with proper authentication
- **Admin Panel** - Hidden admin dashboard for content management
- **Dark Theme** - Modern design with gray color scheme
- **Responsive Design** - Works on desktop and mobile devices
- **Russian Interface** - Complete Russian localization

## 🛠️ Technologies

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Fetch API
- **Authentication**: JWT tokens
- **UI Components**: Custom components with Tailwind
- **Notifications**: React Hot Toast

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/zxc-mrt1n-o4/forum-front.git
cd forum-front
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (e.g., https://your-backend.railway.app)

4. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Admin Access

### Method 1: Direct URL
Navigate to `/admin-access` and log in with admin credentials.

### Method 2: Admin Button
If logged in as admin, the admin button will appear in the navbar.

## 📁 Project Structure

```
├── app/                        # Next.js app directory
│   ├── admin/                  # Admin panel pages
│   │   └── dashboard/          # Admin dashboard
│   ├── admin-access/           # Hidden admin login
│   ├── about/                  # About page
│   ├── create-post/            # Post creation (deprecated)
│   ├── login/                  # User login
│   ├── posts/                  # Individual post pages
│   ├── register/               # User registration
│   ├── submit/                 # Post submission (deprecated)
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                 # React components
│   ├── BlogList.tsx            # Posts list with like functionality
│   ├── Footer.tsx              # Site footer
│   ├── Navbar.tsx              # Navigation with auth
│   └── PostList.tsx            # Alternative post list
├── lib/                        # Utilities and API
│   ├── api.ts                  # API client functions
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── Dockerfile                  # Docker configuration
├── next.config.js              # Next.js configuration
├── railway.json                # Railway deployment config
└── tailwind.config.js          # Tailwind CSS configuration
```

## 🎯 Main Features

### For Users:
- **Anonymous posting** - Create posts without revealing identity
- **User registration** - Create account (requires admin verification)
- **Post viewing** - Browse all approved posts
- **Like system** - Like/unlike posts (requires authentication)
- **Responsive design** - Works on all devices

### For Admins:
- **User management** - View, verify, and delete users
- **Post moderation** - View all posts with metadata
- **System statistics** - User and post analytics
- **Hidden access** - Secret admin panel access

## 🚀 Railway Deployment

This frontend is configured for Railway deployment with:

1. **Dockerfile** - Multi-stage build for production
2. **Environment Variables** - Automatic configuration
3. **Static Export** - Optimized for deployment
4. **CORS Configuration** - Properly configured for backend

### Deploy to Railway

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repo
   - Select this frontend repository

2. **Environment Variables**
   Railway will auto-generate most variables. Set:
   - `NEXT_PUBLIC_BACKEND_URL` - Your backend Railway URL

3. **Deploy**
   - Railway will automatically build and deploy
   - Frontend will be available at generated Railway URL
   - Connect with your backend for full functionality

## ⚙️ Configuration

### Environment Variables
```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.railway.app

# Optional: Custom domain
NEXT_PUBLIC_SITE_URL=https://your-frontend-domain.railway.app
```

### API Integration
The frontend connects to the backend API for:
- User authentication and registration
- Post creation and retrieval
- Like system functionality
- Admin panel operations
- User verification system

## 🎨 Styling

The application uses a dark theme with gray color scheme:
- **Background**: Dark gray (`bg-gray-800`, `bg-gray-900`)
- **Cards**: Medium gray (`bg-gray-700`)
- **Text**: White and light gray
- **Accents**: Blue for links, green for success, red for errors

## 📱 Responsive Design

- **Mobile First**: Designed for mobile devices
- **Breakpoints**: Responsive grid and layouts
- **Touch Friendly**: Large buttons and touch targets
- **Adaptive**: Adjusts to different screen sizes

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Protected Routes** - Admin routes require authentication
- **CSRF Protection** - Cross-site request forgery protection
- **Input Validation** - Client-side input validation
- **XSS Prevention** - Proper data sanitization

## 🚨 Important Notes

- **Backend Required**: This frontend requires the backend API to function
- **Admin Verification**: New users need admin approval to post
- **Anonymous Posts**: Posts can be created anonymously
- **Like Authentication**: Likes require user authentication
- **Railway Deployment**: Configured for Railway platform

## 📞 Support

For technical support or questions about the frontend, refer to the project documentation or contact the development team.

---

**Note**: This is the frontend component. You also need to deploy the backend API from the [forum-back repository](https://github.com/zxc-mrt1n-o4/forum-back) for full functionality. 