
import { ReactNode, FC } from 'react';

export interface MDXComponentProps {
  components?: {
    [key: string]: React.ComponentType<any>;
  };
  children?: ReactNode;
}

export interface CustomTableProps {
  children: ReactNode;
}

export interface CustomCodeProps {
  children: ReactNode;
  className?: string;
  inline?: boolean;
}

export interface CustomCardProps {
  title?: string;
  icon?: string;
  href?: string;
  children?: ReactNode;
}

export interface CustomCardGroupProps {
  children: ReactNode;
}

export const CardGroup: FC<CustomCardGroupProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
      {children}
    </div>
  );
};
