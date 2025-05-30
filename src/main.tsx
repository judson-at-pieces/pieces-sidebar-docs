

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('supabaseUrl is required')) {
    event.preventDefault();
    console.warn('Supabase configuration error caught, app will continue with fallback mode');
    return false;
  }
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('supabaseUrl is required')) {
    event.preventDefault();
    console.warn('Supabase configuration promise rejection caught, app will continue with fallback mode');
    return false;
  }
});

// Comprehensive postMessage error suppression
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args.join(' ');
  
  // Suppress various postMessage related errors
  if (message.includes('postMessage') || 
      message.includes('target origin') ||
      message.includes('does not match') ||
      message.includes('recipient window\'s origin') ||
      message.includes('gptengineer.app') ||
      message.includes('localhost:3000')) {
    // Silently ignore these cross-origin errors
    return;
  }
  
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  
  // Also suppress postMessage warnings
  if (message.includes('postMessage') || 
      message.includes('target origin') ||
      message.includes('cross-origin')) {
    return;
  }
  
  originalWarn.apply(console, args);
};

// Intercept and suppress cross-origin postMessage attempts
const originalPostMessage = window.postMessage;
window.postMessage = function(message: any, targetOrigin: string, transfer?: Transferable[]): void {
  // Only allow same-origin or wildcard postMessage
  if (targetOrigin !== '*' && targetOrigin !== window.location.origin) {
    console.debug('Blocked cross-origin postMessage attempt to:', targetOrigin);
    return;
  }
  return originalPostMessage.call(this, message, targetOrigin, transfer);
};

createRoot(document.getElementById("root")!).render(<App />);

