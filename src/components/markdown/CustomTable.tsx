
import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomTableProps {
  children: ReactNode;
}

export function CustomTable({ children, ...props }: CustomTableProps) {
  return (
    <div className="my-6 -mx-4 sm:mx-0">
      <div className="overflow-x-auto px-4 sm:px-0">
        <Table className="min-w-[600px]" {...props}>
          {children}
        </Table>
      </div>
    </div>
  );
}

export function CustomTableHeader({ children, ...props }: { children: ReactNode }) {
  return <TableHeader {...props}>{children}</TableHeader>;
}

export function CustomTableBody({ children, ...props }: { children: ReactNode }) {
  return <TableBody {...props}>{children}</TableBody>;
}

export function CustomTableRow({ children, ...props }: { children: ReactNode }) {
  return <TableRow {...props}>{children}</TableRow>;
}

export function CustomTableHead({ children, ...props }: { children: ReactNode }) {
  return <TableHead {...props}>{children}</TableHead>;
}

export function CustomTableCell({ children, ...props }: { children: ReactNode }) {
  return <TableCell {...props}>{children}</TableCell>;
}
