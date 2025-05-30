
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

// Suppress postMessage origin mismatch errors
const originalError = console.error;
console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('postMessage') && 
      message.includes('target origin') && 
      message.includes('does not match')) {
    // Silently ignore postMessage origin mismatch errors
    return;
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
