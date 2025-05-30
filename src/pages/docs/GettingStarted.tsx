
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Download, Zap, Code } from "lucide-react";

const GettingStarted = () => {
  return (
    <div className="prose prose-lg max-w-none">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Getting Started with Pieces</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Welcome to Pieces! This guide will help you get up and running with our AI-powered code management platform.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12 not-prose">
        <Link to="/docs/meet-pieces/windows-installation-guide">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Download className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Installation</CardTitle>
              <CardDescription>
                Download and install Pieces on your development machine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0">
                Get started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/docs/quick-guides/overview">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Zap className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Start saving and organizing your first code snippets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0">
                Quick start <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/docs/extensions-plugins">
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Code className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Extensions</CardTitle>
              <CardDescription>
                Integrate Pieces into your workflow with our extensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="p-0">
                Explore Extensions <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2>What is Pieces?</h2>
      <p>
        Pieces is an AI-powered code repository that helps developers save, organize, and reuse code snippets. 
        It provides intelligent code management with features like:
      </p>

      <ul>
        <li><strong>Smart Tagging:</strong> Automatically categorize your code snippets</li>
        <li><strong>AI Search:</strong> Find code using natural language queries</li>
        <li><strong>IDE Integration:</strong> Works seamlessly with popular development environments</li>
        <li><strong>Team Collaboration:</strong> Share knowledge across your development team</li>
        <li><strong>Version Control:</strong> Track changes to your code snippets over time</li>
      </ul>

      <h2>Core Concepts</h2>
      
      <h3>Code Snippets</h3>
      <p>
        The fundamental unit in Pieces is a code snippet. Each snippet can contain code in any language, 
        along with metadata like tags, descriptions, and context information.
      </p>

      <h3>Collections</h3>
      <p>
        Organize related snippets into collections. Collections help you group code by project, 
        technology, or any other criteria that makes sense for your workflow.
      </p>

      <h3>AI-Powered Features</h3>
      <p>
        Pieces uses AI to enhance your coding experience by providing intelligent suggestions, 
        automatic tagging, and natural language search capabilities.
      </p>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-8 not-prose">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps</h3>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          Ready to start using Pieces? Follow our installation guide to get set up.
        </p>
        <Link to="/docs/meet-pieces/fundamentals">
          <Button>
            Learn Fundamentals <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default GettingStarted;
