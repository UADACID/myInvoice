import { type ReactNode } from 'react';

type SortDirection = 'asc' | 'desc' | null;

interface TableHeader {
  label: string;
  sortable?: boolean;
  key?: string;
}

interface TableProps {
  headers: string[] | TableHeader[];
  children: ReactNode;
  className?: string;
  'data-coachmark'?: string;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
}

export function Table({ 
  headers, 
  children, 
  className = '', 
  'data-coachmark': dataCoachmark,
  sortKey,
  sortDirection,
  onSort,
}: TableProps) {
  const normalizedHeaders: TableHeader[] = headers.map((header) => {
    if (typeof header === 'string') {
      return { label: header, sortable: false };
    }
    return header;
  });

  const handleSort = (header: TableHeader) => {
    if (header.sortable && header.key && onSort) {
      onSort(header.key);
    }
  };

  return (
    <div 
      className={`overflow-x-auto bg-white rounded-xl border border-slate-200 ${className}`}
      data-coachmark={dataCoachmark}
    >
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-slate-200">
            {normalizedHeaders.map((header, index) => (
              <th
                key={index}
                onClick={() => handleSort(header)}
                className={`px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                  header.sortable ? 'cursor-pointer hover:bg-slate-50 select-none' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{header.label}</span>
                  {header.sortable && header.key && sortKey === header.key && (
                    <span className="text-indigo-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

export function TableRow({ children, className = '' }: TableRowProps) {
  return <tr className={`hover:bg-slate-50 transition-colors ${className}`}>{children}</tr>;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-6 py-4 text-sm text-slate-900 ${className}`}>
      {children}
    </td>
  );
}
