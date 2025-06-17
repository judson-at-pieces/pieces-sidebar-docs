
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Download, Zap, Code, BookOpen, Sparkles } from "lucide-react";

const GettingStarted = () => {
  return (
    <div className="min-h-screen bg-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-muted/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-16">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card/80 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Getting Started Guide</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome to Pieces
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Get up and running with our AI-powered code management platform. 
              This guide will help you install, configure, and master Pieces in just a few steps.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Quick Start</h2>
          <p className="text-lg text-muted-foreground">
            Follow these three simple steps to get started with Pieces
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Link to="/docs/meet-pieces/windows-installation-guide" className="group no-underline">
            <Card className="h-full bg-white dark:bg-[#2a2b2b] border-border hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Download className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  1. Install Pieces
                </CardTitle>
                <CardDescription className="text-base">
                  Download and install Pieces Desktop App on your development machine
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:gap-2 transition-all duration-200">
                  Get started
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/docs/quick-guides/overview" className="group no-underline">
            <Card className="h-full bg-white dark:bg-[#2a2b2b] border-border hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  2. Save Your First Snippet
                </CardTitle>
                <CardDescription className="text-base">
                  Start saving and organizing your first code snippets with AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-flex items-center text-green-600 dark:text-green-400 font-medium group-hover:gap-2 transition-all duration-200">
                  Quick start
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/docs/extensions-plugins" className="group no-underline">
            <Card className="h-full bg-white dark:bg-[#2a2b2b] border-border hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Code className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  3. Install Extensions
                </CardTitle>
                <CardDescription className="text-base">
                  Integrate Pieces into your workflow with IDE and browser extensions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="inline-flex items-center text-purple-600 dark:text-purple-400 font-medium group-hover:gap-2 transition-all duration-200">
                  Explore Extensions
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* What is Pieces Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">What is Pieces?</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Pieces is an AI-powered code repository that helps developers save, organize, and reuse code snippets with intelligent features designed to enhance your workflow.
            </p>
            
            <div className="space-y-4">
              {[
                "Smart Tagging: Automatically categorize your code snippets",
                "AI Search: Find code using natural language queries", 
                "IDE Integration: Works seamlessly with popular development environments",
                "Team Collaboration: Share knowledge across your development team",
                "Version Control: Track changes to your code snippets over time"
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-border flex items-center justify-center">
              <div className="text-center p-8">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Workflow</h3>
                <p className="text-muted-foreground">
                  Experience intelligent code management with context-aware AI assistance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Concepts */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Core Concepts</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-[#2a2b2b] border-border">
              <CardHeader>
                <CardTitle className="text-lg">Code Snippets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The fundamental unit in Pieces. Each snippet can contain code in any language, 
                  along with metadata like tags, descriptions, and context information.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#2a2b2b] border-border">
              <CardHeader>
                <CardTitle className="text-lg">Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organize related snippets into collections. Group code by project, 
                  technology, or any criteria that makes sense for your workflow.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#2a2b2b] border-border">
              <CardHeader>
                <CardTitle className="text-lg">AI-Powered Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pieces uses AI to enhance your coding experience with intelligent suggestions, 
                  automatic tagging, and natural language search capabilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-2xl p-12 border border-border">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Workflow?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already using Pieces to save time, 
            stay organized, and code more efficiently.
          </p>
          <Link to="/docs/meet-pieces/fundamentals">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              <BookOpen className="mr-2 w-5 h-5" />
              Learn the Fundamentals
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GettingStarted;
