
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const ideEditors = [
    {
      name: "VS Code",
      description: "The flagship extension for Visual Studio Code",
      icon: "🔵",
      href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code"
    },
    {
      name: "JetBrains",
      description: "Plugin for IntelliJ IDEA, PyCharm, WebStorm, and more",
      icon: "🔶",
      href: "/docs/extensions-plugins/extensions-plugins/jetbrains"
    },
    {
      name: "Visual Studio",
      description: "Extension for Microsoft Visual Studio",
      icon: "🟣",
      href: "/docs/extensions-plugins/extensions-plugins/visual-studio"
    },
    {
      name: "Sublime Text",
      description: "Package for Sublime Text editor",
      icon: "🟠",
      href: "/docs/extensions-plugins/extensions-plugins/sublime"
    },
    {
      name: "Neovim",
      description: "Plugin for Neovim text editor",
      icon: "🟢",
      href: "/docs/extensions-plugins/extensions-plugins/neovim-plugin"
    },
    {
      name: "JupyterLab",
      description: "Extension for JupyterLab notebooks",
      icon: "🟡",
      href: "/docs/extensions-plugins/extensions-plugins/jupyterlab"
    }
  ];

  const webBrowsers = [
    {
      name: "Google Chrome",
      description: "Browser extension for Chrome",
      icon: "🔴",
      href: "/docs/web-extension"
    },
    {
      name: "Mozilla Firefox",
      description: "Add-on for Firefox browser",
      icon: "🟠",
      href: "/docs/web-extension"
    },
    {
      name: "Microsoft Edge",
      description: "Extension for Microsoft Edge",
      icon: "🔵",
      href: "/docs/web-extension"
    }
  ];

  const productivityTools = [
    {
      name: "Obsidian",
      description: "Plugin for Obsidian knowledge management",
      icon: "🟣",
      href: "/docs/obsidian"
    },
    {
      name: "Pieces CLI",
      description: "Command-line interface for Pieces",
      icon: "⚫",
      href: "/docs/cli"
    },
    {
      name: "Microsoft Teams",
      description: "Bot for Microsoft Teams integration",
      icon: "🔵",
      href: "/docs/productivity"
    }
  ];

  const ToolCard = ({ tool }: { tool: { name: string; description: string; icon: string; href: string } }) => (
    <Link to={tool.href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-3 text-lg">
            <span className="text-2xl">{tool.icon}</span>
            <span>{tool.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm">
            {tool.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl">Pieces for Developers</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button asChild>
              <Link to="/docs/meet-pieces">Documentation</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            🚀 Get Up And Running Faster Than Ever
          </h1>
          <h2 className="text-2xl font-semibold mb-6">
            Welcome to Pieces for Developers
          </h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            Get started with the Pieces for Developers platform and share how to best use and optimize your workflow by selecting your favorite IDE, editor, or productivity tool.
          </p>
        </div>

        {/* IDEs & Editors Section */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">IDEs & Editors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideEditors.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        {/* Web Browsers Section */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">Web Browsers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webBrowsers.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        {/* Productivity & Communication Section */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">Productivity & Communication</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productivityTools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl">Pieces for Developers</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Pieces. Built for developers, by developers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
