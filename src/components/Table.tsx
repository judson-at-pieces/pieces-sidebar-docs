import React from 'react';

interface TableProps {
  headers: string[];
  rows: string[][];
  className?: string;
}

const Table: React.FC<TableProps> = ({ headers, rows, className = '' }) => {
  return (
    <div className={`overflow-x-auto table-wrapper mb-6 ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800/80">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                <p className="!m-0 min-h-6">
                  <strong>{header}</strong>
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;