
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Github, BookOpen } from "lucide-react";

const Index = () => {
  const ideEditors = [
    {
      name: "VS Code",
      description: "The flagship extension for Visual Studio Code",
      color: "bg-blue-500",
      href: "/docs/extensions-plugins/extensions-plugins/visual-studio-code"
    },
    {
      name: "JetBrains",
      description: "Plugin for IntelliJ IDEA, PyCharm, WebStorm, and more",
      color: "bg-orange-500",
      href: "/docs/extensions-plugins/extensions-plugins/jetbrains"
    },
    {
      name: "Visual Studio",
      description: "Extension for Microsoft Visual Studio",
      color: "bg-purple-500",
      href: "/docs/extensions-plugins/extensions-plugins/visual-studio"
    },
    {
      name: "Sublime Text",
      description: "Package for Sublime Text editor",
      color: "bg-orange-400",
      href: "/docs/extensions-plugins/extensions-plugins/sublime"
    },
    {
      name: "Neovim",
      description: "Plugin for Neovim text editor",
      color: "bg-green-500",
      href: "/docs/extensions-plugins/extensions-plugins/neovim-plugin"
    },
    {
      name: "JupyterLab",
      description: "Extension for JupyterLab notebooks",
      color: "bg-yellow-500",
      href: "/docs/extensions-plugins/extensions-plugins/jupyterlab"
    }
  ];

  const webBrowsers = [
    {
      name: "Google Chrome",
      description: "Browser extension for Chrome",
      color: "bg-red-500",
      href: "/docs/web-extension"
    },
    {
      name: "Mozilla Firefox",
      description: "Add-on for Firefox browser",
      color: "bg-orange-500",
      href: "/docs/web-extension"
    },
    {
      name: "Microsoft Edge",
      description: "Extension for Microsoft Edge",
      color: "bg-blue-500",
      href: "/docs/web-extension"
    }
  ];

  const productivityTools = [
    {
      name: "Obsidian",
      description: "Plugin for Obsidian knowledge management",
      color: "bg-purple-500",
      href: "/docs/obsidian"
    },
    {
      name: "Pieces CLI",
      description: "Command-line interface for Pieces",
      color: "bg-gray-500",
      href: "/docs/cli"
    },
    {
      name: "Microsoft Teams",
      description: "Bot for Microsoft Teams integration",
      color: "bg-blue-500",
      href: "/docs/productivity"
    }
  ];

  const ToolCard = ({ tool }: { tool: { name: string; description: string; color: string; href: string } }) => (
    <Link to={tool.href}>
      <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-3 text-lg text-white">
            <div className={`w-3 h-3 rounded-full ${tool.color}`}></div>
            <span>{tool.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-slate-400 text-sm">
            {tool.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-white">Pieces for Developers</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              Documentation
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              <Github className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 mb-8">
            <span className="text-blue-400 text-sm">🚀 Get Up And Running Faster Than Ever</span>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight mb-6 text-white">
            Welcome to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Pieces for Developers</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Get started with the Pieces for Developers platform and share how to best use and optimize your workflow by selecting your favorite IDE, editor, or productivity tool.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/docs/meet-pieces">
                <BookOpen className="mr-2 h-4 w-4" />
                Read the Docs
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Button>
          </div>
        </div>

        {/* IDEs & Editors Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-white">IDEs & Editors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideEditors.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        {/* Web Browsers Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-white">Web Browsers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webBrowsers.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        {/* Productivity & Communication Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-8 text-white">Productivity & Communication</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productivityTools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-12">
        <div className="container text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-white">Pieces for Developers</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2024 Pieces. Built for developers, by developers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
