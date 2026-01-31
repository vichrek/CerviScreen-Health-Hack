# Healthcare Dashboard - Quick Start

A React + TypeScript healthcare dashboard application with Supabase backend.

## 🚀 Quick Start (5 minutes)

### 1️⃣ Prerequisites
- Install [Node.js](https://nodejs.org/) (v18 or higher)
- Install [VS Code](https://code.visualstudio.com/)

### 2️⃣ Setup Steps

1. **Open this folder in VS Code**
   - File → Open Folder → Select this project folder

2. **Install dependencies**
   - Open terminal in VS Code (`` Ctrl+` `` or `Terminal → New Terminal`)
   - Run: `npm install`

3. **Configure Supabase** (Required)
   - Go to [supabase.com](https://supabase.com) and create a free account
   - Create a new project
   - Go to Settings → API
   - Copy your **Project URL** and **anon key**
   - Edit `utils/supabase/info.ts` and paste your credentials:
     ```typescript
     export const projectId = 'abc123'; // from URL: https://abc123.supabase.co
     export const publicAnonKey = 'eyJhb...'; // your anon key
     ```

4. **Run the app**
   - In terminal: `npm run dev`
   - Open browser to: `http://localhost:5173`

## 📁 Project Structure

```
├── app/
│   ├── components/      # React components
│   └── App.tsx         # Main app
├── lib/
│   └── supabase.ts     # Supabase client
├── styles/             # CSS files
├── utils/
│   └── supabase/
│       └── info.ts     # ⚠️ Add your Supabase credentials here
├── index.html
├── main.tsx           # Entry point
└── package.json
```

## 🛠️ Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Troubleshooting

**"Module not found" errors?**
- Run `npm install` again

**Port 5173 already in use?**
- Vite will automatically use the next available port

**Supabase connection errors?**
- Check credentials in `utils/supabase/info.ts`
- Make sure your Supabase project is active

## 📚 Documentation

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## ✨ Features

- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- shadcn/ui component library
- Supabase for backend
- React Router for navigation
