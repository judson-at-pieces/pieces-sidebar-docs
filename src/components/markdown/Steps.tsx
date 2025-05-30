
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepProps {
  children: ReactNode;
  number: number;
  title?: string;
  isLast?: boolean;
  isCompleted?: boolean;
}

interface StepsProps {
  children: ReactNode;
  className?: string;
}

export function Step({ children, number, title, isLast = false, isCompleted = false }: StepProps) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={cn(
          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
          isCompleted 
            ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" 
            : "border-primary/20 bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-105"
        )}>
          {isCompleted ? (
            <Check className="w-5 h-5" />
          ) : (
            <span className="text-sm font-bold">{number}</span>
          )}
        </div>
        {!isLast && (
          <div className={cn(
            "absolute top-10 h-[calc(100%-2.5rem)] w-0.5 transition-all duration-300",
            isCompleted ? "bg-emerald-500" : "bg-border"
          )} />
        )}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <h4 className={cn(
            "font-semibold mb-2 text-base transition-colors duration-300",
            isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
          )}>
            {title}
          </h4>
        )}
        <div className="text-sm leading-relaxed text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Steps({ children, className }: StepsProps) {
  return (
    <div className={cn('relative my-8 pl-2', className)}>
      {children}
    </div>
  );
}
