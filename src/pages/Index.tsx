
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
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
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
          {/* Clean announcement pill with custom color border */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              {/* Custom color border */}
              <div className="p-[1px] rounded-full" 
                   style={{
                     background: 'conic-gradient(from 0deg, #3d3e3f, #4c4c54, #c9c9ca, #34343c, #c9c9ca, #413e3d, #3d3e3f)'
                   }}>
                <div className="flex items-center space-x-2 bg-card text-foreground px-4 py-2 rounded-full text-sm font-medium">
                  <span>🔒 On-Device, Secure Context Storage</span>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Get Up and Running with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Pieces for Developers
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Pieces captures and resurfaces your workflow context so you never lose track of what you were doing. These docs help you install, integrate, and master the tools that make that possible.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/docs/getting-started">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                <BookOpen className="mr-2 w-5 h-5" />
                Read the Docs
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          {integrations.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-4">
              <h2 className="text-2xl font-bold mb-6 text-foreground text-left">{category.category}</h2>
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
                          <CardTitle className="text-lg group-hover:text-blue-400 transition-colors flex items-center text-left">
                            {integration.name}
                            <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-muted-foreground leading-relaxed text-left">
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
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            {/* Socials */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Socials</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://pieces.app/discord?_gl=1*1vk3yhq*_gcl_au*MTM2ODE5MTYyMC4xNzQ4ODcwNTA2*_ga*MTE4MjM0Njk4MC4xNzQxMDIwNzMx*_ga_BVYEFRWCYX*czE3NDg4Njk5ODYkbzQ3JGcxJHQxNzQ4ODg0MzM4JGo2MCRsMCRoMA.." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Discord <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://twitter.com/getpieces" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Twitter <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://youtube.com/@getpieces" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    YouTube <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://instagram.com/getpieces" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Instagram <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/orgs/pieces-app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    GitHub <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://linkedin.com/company/getpieces" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    LinkedIn <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://facebook.com/getpieces" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Facebook <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://code.pieces.app/blog?_gl=1*9mwccv*_gcl_au*MTM2ODE5MTYyMC4xNzQ4ODcwNTA2*_ga*MTE4MjM0Njk4MC4xNzQxMDIwNzMx*_ga_BVYEFRWCYX*czE3NDg4Njk5ODYkbzQ3JGcxJHQxNzQ4ODg0MzM4JGo2MCRsMCRoMA.." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Blog <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://code.pieces.app/updates?_gl=1*9mwccv*_gcl_au*MTM2ODE5MTYyMC4xNzQ4ODcwNTA2*_ga*MTE4MjM0Njk4MC4xNzQxMDIwNzMx*_ga_BVYEFRWCYX*czE3NDg4Njk5ODYkbzQ3JGcxJHQxNzQ4ODg0MzM4JGo2MCRsMCRoMA.." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Product Updates <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://pieces.app/news?_gl=1*l8dn0f*_gcl_au*MTM2ODE5MTYyMC4xNzQ4ODcwNTA2*_ga*MTE4MjM0Njk4MC4xNzQxMDIwNzMx*_ga_BVYEFRWCYX*czE3NDg4Njk5ODYkbzQ3JGcxJHQxNzQ4ODg0MzM4JGo2MCRsMCRoMA.." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Press <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://thepiecespost.beehiiv.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Newsletter <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Terms & Policies */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Terms & Policies</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="https://pieces.app/legal/privacy-policy?_gl=1*l8dn0f*_gcl_au*MTM2ODE5MTYyMC4xNzQ4ODcwNTA2*_ga*MTE4MjM0Njk4MC4xNzQxMDIwNzMx*_ga_BVYEFRWCYX*czE3NDg4Njk5ODYkbzQ3JGcxJHQxNzQ4ODg0MzM4JGo2MCRsMCRoMA.." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Privacy Policy <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://pieces.app/legal/terms?_gl=1*l8dn0f*_gcl_au*MTM2ODE5MTYyMC4xNzQ4ODcwNTA2*_ga*MTE4MjM0Njk4MC4xNzQxMDIwNzMx*_ga_BVYEFRWCYX*czE3NDg4Njk5ODYkbzQ3JGcxJHQxNzQ4ODg0MzM4JGo2MCRsMCRoMA.." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  >
                    Terms of Service <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">P</span>
                </div>
                <span className="font-bold">Pieces for Developers</span>
              </div>
              <p className="text-muted-foreground text-sm">Copyright © 2025 Mesh Intelligent Technologies, Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
