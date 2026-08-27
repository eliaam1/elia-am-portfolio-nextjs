import React from 'react';
import Spinner from './Spinner';

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found.',
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-app-border bg-app-surface shadow-md">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-app-border/20 bg-app-bg/30">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 font-semibold text-app-text-secondary uppercase tracking-wider text-[10px] sm:text-xs ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <Spinner size="md" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-app-text-secondary font-sans">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick && onRowClick(item)}
                className={`border-b border-app-border/10 last:border-0 transition-colors duration-200 ${
                  onRowClick ? 'cursor-pointer hover:bg-app-bg/40' : ''
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-6 py-4 text-app-text-primary ${col.className || ''}`}>
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
