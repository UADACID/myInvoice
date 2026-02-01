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
      className={`overflow-x-auto bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] ${className}`}
      data-coachmark={dataCoachmark}
    >
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            {normalizedHeaders.map((header, index) => (
              <th
                key={index}
                onClick={() => handleSort(header)}
                className={`px-6 py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider ${header.sortable ? 'cursor-pointer hover:bg-[var(--bg-main)] select-none' : ''
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span>{header.label}</span>
                  {header.sortable && header.key && sortKey === header.key && (
                    <span className="text-[var(--color-primary)]">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
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
  return <tr className={`hover:bg-[var(--bg-main)] transition-colors ${className}`}>{children}</tr>;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-6 py-4 text-sm text-[var(--text-main)] ${className}`}>
      {children}
    </td>
  );
}
