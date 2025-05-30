
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, ExternalLink, Github } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Integration data with their respective repository links
const integrations = [
  {
    category: "IDEs & Editors",
    items: [
      {
        name: "VS Code",
        description: "The flagship extension for Visual Studio Code",
        logo: "🔵",
        repoUrl: "https://github.com/pieces-app/pieces-vscode"
      },
      {
        name: "JetBrains",
        description: "Plugin for IntelliJ IDEA, PyCharm, WebStorm, and more",
        logo: "🔶",
        repoUrl: "https://github.com/pieces-app/pieces-jetbrains"
      },
      {
        name: "Visual Studio",
        description: "Extension for Microsoft Visual Studio",
        logo: "🟣",
        repoUrl: "https://github.com/pieces-app/pieces-visual-studio"
      },
      {
        name: "Sublime Text",
        description: "Package for Sublime Text editor",
        logo: "🟠",
        repoUrl: "https://github.com/pieces-app/pieces-sublime"
      },
      {
        name: "Neovim",
        description: "Plugin for Neovim text editor",
        logo: "🟢",
        repoUrl: "https://github.com/pieces-app/pieces-neovim"
      },
      {
        name: "JupyterLab",
        description: "Extension for JupyterLab notebooks",
        logo: "🟡",
        repoUrl: "https://github.com/pieces-app/pieces-jupyterlab"
      }
    ]
  },
  {
    category: "Web Browsers",
    items: [
      {
        name: "Google Chrome",
        description: "Browser extension for Chrome",
        logo: "🔴",
        repoUrl: "https://github.com/pieces-app/pieces-chrome"
      },
      {
        name: "Mozilla Firefox",
        description: "Add-on for Firefox browser",
        logo: "🟠",
        repoUrl: "https://github.com/pieces-app/pieces-firefox"
      },
      {
        name: "Microsoft Edge",
        description: "Extension for Microsoft Edge",
        logo: "🔵",
        repoUrl: "https://github.com/pieces-app/pieces-edge"
      }
    ]
  },
  {
    category: "Productivity & Communication",
    items: [
      {
        name: "Obsidian",
        description: "Plugin for Obsidian knowledge management",
        logo: "🟣",
        repoUrl: "https://github.com/pieces-app/pieces-obsidian"
      },
      {
        name: "Pieces CLI",
        description: "Command-line interface for Pieces",
        logo: "⚫",
        repoUrl: "https://github.com/pieces-app/pieces-cli"
      },
      {
        name: "Microsoft Teams",
        description: "Bot for Microsoft Teams integration",
        logo: "🔵",
        repoUrl: "https://github.com/pieces-app/pieces-teams"
      }
    ]
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-bold">Pieces for Developers</span>
            </div>
            <nav className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/docs/getting-started" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
                <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </div>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Updated announcement banner */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2 bg-muted/50 border border-border text-blue-400 px-4 py-2 rounded-full text-sm font-medium">
              <span>🚀 Get Up And Running Faster Than Ever</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Pieces for Developers
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Get started with the Pieces for Developers platform and share how to best use and optimize your workflow by selecting your favorite IDE, editor, or productivity tool.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/docs/getting-started">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                <BookOpen className="mr-2 w-5 h-5" />
                Read the Docs
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground px-8 py-4 text-lg">
              <Github className="mr-2 w-5 h-5" />
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          {integrations.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">{category.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((integration, index) => (
                  <Card 
                    key={index} 
                    className="bg-card border-border hover:border-muted-foreground transition-all duration-200 hover:shadow-lg cursor-pointer group"
                    onClick={() => window.open(integration.repoUrl, '_blank')}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{integration.logo}</span>
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-blue-400 transition-colors flex items-center">
                            {integration.name}
                            <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-muted-foreground leading-relaxed">
                        {integration.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-bold">Pieces for Developers</span>
            </div>
            <p className="text-muted-foreground text-sm">&copy; 2024 Pieces. Built for developers, by developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
