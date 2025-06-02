
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Edit, Settings, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Pieces Documentation
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Your comprehensive guide to the Pieces ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Documentation Card */}
          <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Book className="h-5 w-5" />
                Documentation
              </CardTitle>
              <CardDescription className="text-slate-300">
                Browse the complete documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/docs">
                <Button className="w-full">
                  View Docs
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Authentication Card */}
          <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <LogIn className="h-5 w-5" />
                {user ? 'Account' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-slate-300">
                {user ? `Signed in as ${user.email}` : 'Access the documentation editor'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full" variant="outline">
                  {user ? 'Manage Account' : 'Sign In'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Editor Card - Only show if user has editor role */}
          {user && hasRole('editor') && (
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Edit className="h-5 w-5" />
                  Editor
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Edit and manage documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/edit">
                  <Button className="w-full" variant="secondary">
                    Open Editor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Admin Card - Only show if user has admin role */}
          {user && hasRole('admin') && (
            <Card className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5" />
                  Admin Panel
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Manage users and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin">
                  <Button className="w-full" variant="destructive">
                    Admin Panel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Links Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Quick Start</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link to="/cli" className="group">
              <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300">
                <h3 className="text-white font-semibold group-hover:text-blue-300">CLI</h3>
                <p className="text-slate-400 text-sm">Command line tools</p>
              </div>
            </Link>
            <Link to="/desktop" className="group">
              <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300">
                <h3 className="text-white font-semibold group-hover:text-blue-300">Desktop</h3>
                <p className="text-slate-400 text-sm">Desktop application</p>
              </div>
            </Link>
            <Link to="/extensions-plugins" className="group">
              <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300">
                <h3 className="text-white font-semibold group-hover:text-blue-300">Extensions</h3>
                <p className="text-slate-400 text-sm">IDE integrations</p>
              </div>
            </Link>
            <Link to="/quick-guides" className="group">
              <div className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300">
                <h3 className="text-white font-semibold group-hover:text-blue-300">Quick Guides</h3>
                <p className="text-slate-400 text-sm">Get started quickly</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
