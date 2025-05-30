import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, FileText, Zap, Users, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl">Pieces Documentation</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
          Pieces for Developers
          <span className="block text-3xl sm:text-5xl text-muted-foreground mt-2">Documentation</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Your AI-powered productivity tool for saving, enriching, searching, and reusing developer materials.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user && (hasRole('admin') || hasRole('editor')) ? (
            <Button size="lg" asChild>
              <Link to="/docs/meet-pieces">
                Browse Documentation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" asChild>
              <Link to="/auth">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Card 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>Long-Term Memory Engine</span>
              </CardTitle>
              <CardDescription>
                AI-powered live context framework that understands what you’re working on.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Maximizes space for creativity driven by human intent.
              </p>
            </CardContent>
          </Card>

          {/* Feature Card 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Pieces Drive</span>
              </CardTitle>
              <CardDescription>
                Save, search, reference, reuse, and share small developer resources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Efficient pipeline for referencing and reusing code snippets, screenshots, links, and text notes.
              </p>
            </CardContent>
          </Card>

          {/* Feature Card 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Book className="h-5 w-5 text-primary" />
                <span>Pieces Copilot</span>
              </CardTitle>
              <CardDescription>
                Intelligent assistant that helps with generating code and answering questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Utilizes a LLM of your choice with an adjustable context window.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Card Section */}
      <section className="container py-12">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Who is Pieces For?</span>
            </CardTitle>
            <CardDescription>
              Built for developers who frequently reference or reuse small developer materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Preserving Workflow Context</li>
              <li>Managing Developer Materials</li>
              <li>Needing Code Assistance</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
