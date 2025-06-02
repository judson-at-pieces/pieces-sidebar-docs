import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8 bg-muted/20 mt-auto">
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
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">P</span>
                </div>
                <span className="font-bold">Pieces for Developers</span>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">Copyright © 2025 Mesh Intelligent Technologies, Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;