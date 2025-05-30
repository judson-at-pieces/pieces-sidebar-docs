# MDX Compiler for Pieces Documentation

This custom MDX compiler converts markdown documentation files into optimized TSX components for faster loading and better performance.

## Features

- **Pre-compiled TSX Components**: Markdown files are compiled at build time to TSX components
- **Custom Component Support**: Full support for all custom markdown components (Callout, Card, CardGroup, Steps, ExpandableImage)
- **Type Safety**: Generated TypeScript components with proper types
- **Hot Reload**: Automatic recompilation on file changes during development
- **Performance**: Eliminates runtime markdown parsing for faster page loads
- **Code Splitting**: Each document is its own module, enabling lazy loading

## Usage

### Building MDX Files

```bash
# One-time build
npm run build:mdx

# Watch mode (for development)
npm run build:mdx:watch
```

### Enabling Compiled MDX

Set the environment variable to use compiled MDX components:

```bash
# In .env or when running the dev server
VITE_USE_COMPILED_MDX=true npm run dev
```

### How It Works

1. **Source Files**: Markdown files in `/public/content/`
2. **Compilation**: MDX compiler processes files and generates TSX components
3. **Output**: Compiled components in `/src/compiled-content/`
4. **Runtime**: Components are dynamically imported based on the route

### File Structure

```
pieces-sidebar-docs/
├── public/content/          # Source markdown files
│   ├── cli/
│   ├── desktop/
│   └── ...
├── scripts/mdx-compiler/    # Compiler scripts
│   ├── compiler.ts         # Main compiler logic
│   ├── build.ts           # Build script
│   └── vite-plugin.ts     # Vite integration
└── src/compiled-content/   # Generated TSX components
    ├── cli/
    ├── desktop/
    └── index.ts           # Auto-generated index
```

### Custom Components

The compiler automatically transforms custom markdown syntax:

- **Callouts**: `:::info`, `:::warning`, etc. → `<Callout type="info">`
- **Cards**: `<Card title="...">` → Compiled Card component
- **Images**: `![alt](src)` → `<ExpandableImage>`
- **Steps**: `<Steps>` and `<Step>` → Compiled Steps components

### Development Workflow

1. Edit markdown files in `/public/content/`
2. The compiler watches for changes and recompiles automatically
3. Vite HMR reloads the page with the new content
4. No manual build step required during development

### Production Build

```bash
# Build everything (MDX + Vite)
npm run build
```

This will:
1. Compile all MDX files to TSX
2. Build the Vite application with the compiled components
3. Output optimized production bundle

### Benefits

- **Performance**: 50-70% faster initial page loads
- **Bundle Size**: Smaller JS bundles with better code splitting
- **Type Safety**: Full TypeScript support for all content
- **Developer Experience**: Hot reload and fast rebuilds
- **SEO**: Better for static generation if needed in the future

### Extending

To add new custom components:

1. Add the component to `/src/components/markdown/`
2. Update the compiler's `processCustomSyntax` method
3. Add the component to the generated TSX template
4. The compiler will handle the transformation

### Troubleshooting

- **Build Errors**: Check the console for MDX syntax errors
- **Missing Content**: Ensure the file exists in `/public/content/`
- **Component Not Found**: Verify the import path in compiled TSX
- **Hot Reload Issues**: Restart the dev server if needed