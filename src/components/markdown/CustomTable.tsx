
import React from 'react';

interface CustomTableProps {
  children: React.ReactNode;
}

export const CustomTable: React.FC<CustomTableProps> = ({ children, ...props }) => {
  return (
    <div className="overflow-x-auto table-wrapper mb-6">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80" {...props}>
        {children}
      </table>
    </div>
  );
};

export const CustomTableHeader: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <thead {...props}>{children}</thead>
);

export const CustomTableBody: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80" {...props}>{children}</tbody>
);

export const CustomTableRow: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <tr {...props}>{children}</tr>
);

export const CustomTableHead: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200" {...props}>
    <p className="!m-0 min-h-6">
      <strong>{children}</strong>
    </p>
  </th>
);

export const CustomTableCell: React.FC<{ children: React.ReactNode }> = ({ children, ...props }) => (
  <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300" {...props}>
    {children}
  </td>
);
