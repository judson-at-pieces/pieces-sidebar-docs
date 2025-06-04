import React from 'react';
import { Info, Lightbulb, AlertTriangle } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'tip' | 'alert';
  children: React.ReactNode;
}

const Callout: React.FC<CalloutProps> = ({ type = 'info', children }) => {
  const getCalloutStyles = () => {
    switch (type) {
      case 'tip':
        return 'border-green-200 bg-green-50/70 dark:border-green-800/50 dark:bg-green-950/40';
      case 'alert':
        return 'border-orange-200 bg-orange-50/70 dark:border-orange-800/50 dark:bg-orange-950/40';
      default:
        return 'border-slate-200 bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-900/50';
    }
  };

  const getIconStyles = () => {
    switch (type) {
      case 'tip':
        return 'text-green-600 dark:text-green-500';
      case 'alert':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  };

  const getTextStyles = () => {
    switch (type) {
      case 'tip':
        return 'text-green-700 dark:text-green-500';
      case 'alert':
        return 'text-orange-700 dark:text-orange-400';
      default:
        return 'text-slate-700 dark:text-slate-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'tip':
        return <Lightbulb size={16} />;
      case 'alert':
        return <AlertTriangle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  return (
    <div className={`p-4 flex items-start gap-3 border my-2 rounded-xl ${getCalloutStyles()}`}>
      <div className={`flex ${getIconStyles()}`}>
        <button data-state="closed" aria-label={`Toggle ${type}`}>
          {getIcon()}
        </button>
      </div>
      <div className={`grow text-sm ${getTextStyles()}`}>
        {children}
      </div>
    </div>
  );
};

export default Callout;