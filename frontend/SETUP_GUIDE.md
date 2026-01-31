# Project Setup Guide for VS Code

This is a React + TypeScript application with React Router, Supabase backend, and shadcn/ui components.

## Prerequisites

Before you begin, make sure you have installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **VS Code** - [Download here](https://code.visualstudio.com/)
- **Git** (optional but recommended)

## Step 1: Project Setup

1. **Extract the project files** to a folder on your computer (e.g., `C:\Projects\my-healthcare-app`)

2. **Open the project in VS Code:**
   - Open VS Code
   - Click `File > Open Folder`
   - Select your project folder

## Step 2: Install Dependencies

The project is missing some essential configuration files. You'll need to create them.

### Create `package.json`

In the root of your project folder, create a file called `package.json` with the following content:

```json
{
  "name": "healthcare-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.39.0",
    "sonner": "^1.4.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-aspect-ratio": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-context-menu": "^2.1.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-hover-card": "^1.0.7",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-menubar": "^1.0.4",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-toggle": "^1.0.3",
    "@radix-ui/react-toggle-group": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.344.0",
    "date-fns": "^3.3.1",
    "react-day-picker": "^8.10.0",
    "recharts": "^2.12.0",
    "vaul": "^0.9.0",
    "cmdk": "^0.2.1",
    "embla-carousel-react": "^8.0.0",
    "input-otp": "^1.2.2",
    "react-resizable-panels": "^2.0.11",
    "react-hook-form": "^7.50.1",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@typescript-eslint/eslint-plugin": "^7.0.2",
    "@typescript-eslint/parser": "^7.0.2",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}
```

### Create `vite.config.ts`

Create a file called `vite.config.ts` in the root:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

### Create `tsconfig.json`

Create a file called `tsconfig.json` in the root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["app", "lib", "styles"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Create `tsconfig.node.json`

Create a file called `tsconfig.node.json` in the root:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

### Create `tailwind.config.js`

Create a file called `tailwind.config.js` in the root:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {},
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Create `postcss.config.js`

Create a file called `postcss.config.js` in the root:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Create `index.html`

Create a file called `index.html` in the root:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Healthcare Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

### Create `main.tsx`

Create a file called `main.tsx` in the root:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### Create Supabase info file

Create a folder called `utils` in the root, then create a `supabase` folder inside it, and create `info.ts`:

**File: `utils/supabase/info.ts`**

```typescript
// Replace these with your actual Supabase project credentials
export const projectId = 'your-project-id';
export const publicAnonKey = 'your-public-anon-key';
```

### Create `.env` file (Optional but recommended)

Create a `.env` file in the root:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## Step 3: Install Dependencies

Open the **Terminal** in VS Code (`Terminal > New Terminal` or `` Ctrl+` ``) and run:

```bash
npm install
```

This will install all the required dependencies.

## Step 4: Configure Supabase

1. Go to [Supabase](https://supabase.com/) and create an account (free)
2. Create a new project
3. Once created, go to **Settings > API**
4. Copy your **Project URL** and **anon/public key**
5. Update the `utils/supabase/info.ts` file with your credentials

## Step 5: Run the Development Server

In the terminal, run:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`

## Step 6: Recommended VS Code Extensions

Install these extensions for the best development experience:

1. **ESLint** - Code linting
2. **Prettier - Code formatter** - Code formatting
3. **Tailwind CSS IntelliSense** - Tailwind autocomplete
4. **TypeScript Vue Plugin (Volar)** - Better TypeScript support
5. **Path Intellisense** - Auto-complete file paths

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port.

### Module Not Found Errors
Make sure all configuration files are in the root directory and run `npm install` again.

### Supabase Connection Issues
- Check your Supabase credentials in `utils/supabase/info.ts`
- Make sure your Supabase project is active
- Check the browser console for specific error messages

### TypeScript Errors
- Make sure `tsconfig.json` and `tsconfig.node.json` are properly configured
- Run `npm install` to ensure TypeScript is installed

## Project Structure

```
your-project/
├── app/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── Login.tsx
│   │   ├── PatientDashboard.tsx
│   │   └── PhysicianDashboard.tsx
│   └── App.tsx
├── lib/
│   └── supabase.ts
├── styles/
│   ├── index.css
│   ├── tailwind.css
│   └── theme.css
├── utils/
│   └── supabase/
│       └── info.ts
├── index.html
├── main.tsx
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Next Steps

1. Set up your Supabase database tables as needed for your application
2. Customize the components in the `app/components` folder
3. Add authentication logic
4. Deploy your application (Vercel, Netlify, etc.)

## Need Help?

- Check the console in your browser's Developer Tools (F12) for errors
- Review the Vite documentation: https://vitejs.dev/
- Review the Supabase documentation: https://supabase.com/docs
- Review the shadcn/ui documentation: https://ui.shadcn.com/
