import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const frontmatter = {
  "title": "Getting Started with Pieces",
  "path": "/docs/getting-started",
  "visibility": "PUBLIC",
  "description": "Welcome to Pieces! This guide will help you get up and running with our AI-powered code management platform.",
  "slug": "welcome"
};

const markdownContent = `***

# Getting Started with Pieces

Welcome to Pieces! This guide will help you get up and running with our AI-powered code management platform.

## Quick Start Cards

<div className="grid md:grid-cols-3 gap-6 mb-12">
  <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div className="w-8 h-8 text-blue-600 mb-2">📥</div>
    <h3 className="text-lg font-semibold mb-2">Installation</h3>
    <p className="text-muted-foreground mb-4">Download and install Pieces on your development machine</p>
    <a href="/docs/meet-pieces/windows-installation-guide" className="text-blue-600 hover:text-blue-700">Get started →</a>
  </div>

  <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div className="w-8 h-8 text-green-600 mb-2">⚡</div>
    <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
    <p className="text-muted-foreground mb-4">Start saving and organizing your first code snippets</p>
    <a href="/docs/quick-guides/overview" className="text-green-600 hover:text-green-700">Quick start →</a>
  </div>

  <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div className="w-8 h-8 text-purple-600 mb-2">🔗</div>
    <h3 className="text-lg font-semibold mb-2">Extensions</h3>
    <p className="text-muted-foreground mb-4">Integrate Pieces into your development workflow</p>
    <a href="/docs/extensions-plugins" className="text-purple-600 hover:text-purple-700">Explore Extensions →</a>
  </div>
</div>

## What is Pieces?

Pieces is an AI-powered code repository that helps developers save, organize, and reuse code snippets. It provides intelligent code management with features like:

- **Smart Tagging:** Automatically categorize your code snippets
- **AI Search:** Find code using natural language queries
- **IDE Integration:** Works seamlessly with popular development environments
- **Team Collaboration:** Share knowledge across your development team
- **Version Control:** Track changes to your code snippets over time

## Core Concepts

### Code Snippets
The fundamental unit in Pieces is a code snippet. Each snippet can contain code in any language, along with metadata like tags, descriptions, and context information.

### Collections
Organize related snippets into collections. Collections help you group code by project, technology, or any other criteria that makes sense for your workflow.

### AI-Powered Features
Pieces uses AI to enhance your coding experience by providing intelligent suggestions, automatic tagging, and natural language search capabilities.

## Next Steps

Ready to start using Pieces? Follow our installation guide to get set up:

1. **[Install Pieces](/docs/meet-pieces/fundamentals)** - Learn about the core components
2. **[Download the Desktop App](/docs/desktop/download)** - Get the main Pieces application
3. **[Install Extensions](/docs/extensions-plugins)** - Add Pieces to your favorite IDE
4. **[Quick Start Guide](/docs/quick-guides/overview)** - Start saving your first snippets

<div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8">
  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">🚀 Ready to Get Started?</h3>
  <p className="text-blue-800 dark:text-blue-200 mb-4">
    The fastest way to get up and running is to install the Pieces Desktop App and start saving your first code snippets.
  </p>
  <a href="/docs/desktop/download" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
    Install Pieces Desktop App →
  </a>
</div>`;

export default function MDX_getting_started() {
  return <MarkdownRenderer content={markdownContent} />;
}

MDX_getting_started.displayName = 'MDX_getting_started';
MDX_getting_started.frontmatter = frontmatter;
