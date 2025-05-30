
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
    className: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-900 dark:text-blue-100'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    titleColor: 'text-yellow-900 dark:text-yellow-100'
  },
  alert: {
    icon: AlertCircle,
    className: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    titleColor: 'text-orange-900 dark:text-orange-100'
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-900 dark:text-red-100'
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-900 dark:text-green-100'
  },
  tip: {
    icon: Lightbulb,
    className: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    titleColor: 'text-purple-900 dark:text-purple-100'
  }
};

export function Callout({ type = 'info', title, children, className }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'border rounded-lg p-4 my-6',
      config.className,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('font-semibold mb-1', config.titleColor)}>
              {title}
            </h4>
          )}
          <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
