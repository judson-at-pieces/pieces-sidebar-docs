
import React from 'react';
import { AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ 
  type = 'info', 
  title, 
  children 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/30';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/30';
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/30';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/30';
    }
  };

  return (
    <div className={`my-4 rounded-lg border p-4 ${getStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          {title && (
            <h5 className="mb-2 font-medium text-sm">
              {title}
            </h5>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
