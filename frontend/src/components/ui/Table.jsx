import React from 'react';
import { cn } from '../../utils/format.js';

const Table = ({ columns = [], data = [], emptyMessage = 'No records to display', className = '' }) => {
  return (
    <div className={cn('w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      <div className="max-h-[28rem] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-4 py-3 font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id ?? JSON.stringify(row)} className="hover:bg-indigo-50/50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-slate-700">
                      {column.render ? column.render(row) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
