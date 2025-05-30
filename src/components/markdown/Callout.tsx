
import { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalloutProps {
  type?: 'info' | 'warning' | 'error' | 'success' | 'tip' | 'alert';
  title?: string;
  children: ReactNode;
  className?: string;
}

const calloutConfig = {
  info: {
    icon: Info,
    className: 'border-blue-500/20 bg-blue-50/50 dark:border-blue-400/30 dark:bg-blue-400/10 shadow-blue-100/50 dark:shadow-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-900 dark:text-blue-100',
    contentColor: 'text-blue-900/80 dark:text-blue-100/80'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/20 bg-amber-50/50 dark:border-amber-400/30 dark:bg-amber-400/10 shadow-amber-100/50 dark:shadow-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-900 dark:text-amber-100',
    contentColor: 'text-amber-900/80 dark:text-amber-100/80'
  },
  alert: {
    icon: AlertCircle,
    className: 'border-orange-500/20 bg-orange-50/50 dark:border-orange-400/30 dark:bg-orange-400/10 shadow-orange-100/50 dark:shadow-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    titleColor: 'text-orange-900 dark:text-orange-100',
    contentColor: 'text-orange-900/80 dark:text-orange-100/80'
  },
  error: {
    icon: XCircle,
    className: 'border-red-500/20 bg-red-50/50 dark:border-red-400/30 dark:bg-red-400/10 shadow-red-100/50 dark:shadow-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-900 dark:text-red-100',
    contentColor: 'text-red-900/80 dark:text-red-100/80'
  },
  success: {
    icon: CheckCircle,
    className: 'border-emerald-500/20 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-400/10 shadow-emerald-100/50 dark:shadow-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
    contentColor: 'text-emerald-900/80 dark:text-emerald-100/80'
  },
  tip: {
    icon: Lightbulb,
    className: 'border-purple-500/20 bg-purple-50/50 dark:border-purple-400/30 dark:bg-purple-400/10 shadow-purple-100/50 dark:shadow-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    titleColor: 'text-purple-900 dark:text-purple-100',
    contentColor: 'text-purple-900/80 dark:text-purple-100/80'
  }
};

export function Callout({ type = 'info', title, children, className }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'border rounded-lg p-4 my-6 shadow-sm transition-all duration-300 hover:shadow-md',
      config.className,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-6 h-6 mt-0.5 flex-shrink-0 transition-transform duration-300 hover:scale-110',
          config.iconColor
        )}>
          <Icon className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-semibold mb-2 text-base', config.titleColor)}>
              {title}
            </h4>
          )}
          <div className={cn(
            'text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
            config.contentColor
          )}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
