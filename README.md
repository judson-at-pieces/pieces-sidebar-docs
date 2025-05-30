# Pieces Sidebar Docs

A dynamic documentation site with AI-powered content management, built with React, TypeScript, and Supabase.

## 🚀 Features

- **Dynamic MDX Compilation** - Markdown content automatically compiled to fast-loading TSX components
- **GitHub Integration** - Automatic content syncing from GitHub repositories
- **Admin Panel** - Secure content management with role-based access
- **Custom Components** - Dynamic component system for rich documentation
- **Real-time Sync** - Webhook-triggered content updates
- **Fast Performance** - Pre-compiled components for instant page loads

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- GitHub account (for content syncing)

## 🛠 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pieces-sidebar-docs
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Content Compilation

```bash
# Compile markdown to TSX components
npm run build:mdx

# Start development server
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## 🏗 Architecture

### Content Flow
```
GitHub Repo (/public/content/*.md) 
    ↓ (webhook)
Content Sync Service 
    ↓ 
MDX Compiler (markdown → TSX)
    ↓
Fast Public Documentation Site
```

### Components
- **Public Site** - Fast TSX-compiled docs (no auth required)
- **Admin Panel** - Content management (auth required)
- **GitHub App** - Automated PR creation for content changes
- **Webhook System** - Auto-sync on repository updates

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/           # Admin panel components
│   ├── auth/            # Authentication components  
│   ├── markdown/        # MDX rendering & custom components
│   └── ui/              # Reusable UI components
├── pages/               # Main application pages
├── services/            # API & external service integrations
├── compiled-content/    # Generated TSX from markdown (auto-generated)
└── contexts/            # React contexts (auth, etc.)

public/content/          # Source markdown files
scripts/mdx-compiler/    # MDX → TSX compilation system
supabase/
├── functions/           # Edge functions for sync & compilation
└── migrations/          # Database schema
```

## 🔧 Configuration

### GitHub App Setup
1. Install the Pieces Documentation Bot on your repositories
2. Configure repository in admin panel
3. Content in `/public/content/` will auto-sync

### Custom Components
Add new components to `src/components/markdown/` and register in:
- `customSyntaxProcessor.ts` - Markdown syntax processing
- `componentMappings.tsx` - React component mapping

### Content Structure
```
public/content/
├── getting-started.md
├── quick-guides/
│   └── overview.md
└── large-language-models/
    ├── cloud-models.md
    └── local-models.md
```

## 🚀 Deployment

### Deploy to Lovable

1. **Create Lovable Project:**
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Lovable:**
   - Go to [lovable.dev](https://lovable.dev)
   - Connect your GitHub repository
   - Lovable will auto-detect the configuration

3. **Configure Environment Variables:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Deploy to Other Platforms

<details>
<summary>Vercel Deployment</summary>

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard.
</details>

<details>
<summary>Netlify Deployment</summary>

```bash
npm run build
# Upload dist/ folder to Netlify or connect GitHub repo
```
</details>

## 🔐 Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your URL and anon key

### 2. Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Deploy Edge Functions
```bash
supabase functions deploy
```

### 4. Configure Authentication
1. Enable GitHub OAuth in Supabase Auth settings
2. Add your domain to allowed origins
3. Configure GitHub OAuth app

## 🎯 Usage

### Admin Access
1. Visit `/admin` 
2. Sign in with GitHub
3. Use access codes for initial admin setup

### Content Management
1. Configure GitHub repository in admin panel
2. Content in `/public/content/` automatically syncs
3. Changes trigger automatic recompilation

### Custom Components
Use in any markdown file:
```markdown
<pieces-cloud-models />
<glossary-all />
<Image src="/path/to/image.png" alt="Description" />
```

## 🛡 Security

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access** (admin, editor, user)
- **GitHub App** secure integration
- **Content validation** on sync operations

## 📊 Monitoring

View sync operations and logs in the admin panel:
- Real-time sync status
- Historical sync logs  
- Error tracking and debugging
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- [Documentation Issues](https://github.com/your-repo/issues)
- [Feature Requests](https://github.com/your-repo/discussions)
- [Discord Community](https://discord.gg/pieces)

---

## Original Lovable Project Info

**URL**: https://lovable.dev/projects/a4a90b3d-be5c-44e8-b588-add98be48df6

### How to edit this code

**Use Lovable**: Simply visit the [Lovable Project](https://lovable.dev/projects/a4a90b3d-be5c-44e8-b588-add98be48df6) and start prompting.

**Technologies used**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS

Built with ❤️ using React, TypeScript, Supabase, and Vite.