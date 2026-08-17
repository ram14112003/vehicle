import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faPen,
  faTrash,
  faTimes,
  faCopy,
  faSave,
  faBan,
  faUndoAlt,
  faRecycle,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

export interface Column<T> {
  header: string;
  accessor: keyof T;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCancel?: (row: T) => void;
  onClose?: (row: T) => void;
  onCopy?: (row: T) => void;
  onSave?: (originalRow: T, updatedData: Partial<T>) => void;
  onRestore?: (row: T) => void;
  viewIcon?: React.ReactNode;
  copyIcon?: React.ReactNode;
    viewLabel?: string;
  copyLabel?: string;
  onPermanentDelete?: (row: T) => void;
  // ✅ New props for invoice action
  onInvoice?: (row: T) => void | Promise<void>;
invoiceLabel?: string | ((row: T) => string);
  invoiceIcon?: React.ReactNode;

    invoiceVisible?: (row: T) => boolean;

  rowsPerPage?: number;
  emptyMessage?: string;
  editableColumns?: (keyof T)[];
  uniqueRowKey?: keyof T;
}

export const DataTable = <T extends object>({
  columns,
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onCancel,
  onClose,
  onCopy,
  onSave,
  onRestore,
  onPermanentDelete,
  // ✅ New props added to component destructuring
  onInvoice,
  invoiceLabel,
  invoiceIcon,
    invoiceVisible,

  rowsPerPage = 5,
  emptyMessage = "No entries found.",
  editableColumns = [],
  uniqueRowKey = 'id' as keyof T,
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const currentData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-sm text-left text-gray-700 overflow-hidden">
        {/* Table Header */}
        <thead className="bg-gray-100 text-gray-800">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 border">
                {col.header}
              </th>
            ))}
            {(onView ||
              onEdit ||
              onDelete ||
              onCancel ||
              onClose ||
              onCopy ||
              onSave ||
              onRestore ||
              onPermanentDelete ||
              onInvoice) && (
              <th className="px-6 py-3 text-left text-sm font-semibold border-b border-gray-200">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={
                  columns.length +
                  (onView ||
                  onEdit ||
                  onDelete ||
                  onCancel ||
                  onClose ||
                  onCopy ||
                  onSave ||
                  onRestore ||
                  onPermanentDelete ||
                  onInvoice
                    ? 1
                    : 0)
                }
                className="px-4 py-3 border"
              >
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Loading...
              </td>
            </tr>
          ) : currentData.length > 0 ? (
            currentData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 border">
                    {col.render
                      ? col.render(row)
                      : row[col.accessor] !== undefined &&
                        row[col.accessor] !== null &&
                        row[col.accessor] !== ""
                      ? String(row[col.accessor])
                      : "-"}
                  </td>
                ))}

                {/* Action Buttons */}
                {(onView ||
                  onEdit ||
                  onDelete ||
                  onCancel ||
                  onClose ||
                  onCopy ||
                  onSave ||
                  onRestore ||
                  onPermanentDelete ||
                  onInvoice) && (
                  <td className="px-6 py-4 text-sm text-gray-600 border">
                    <div className="flex gap-4">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="flex text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" /> View
                        </button>
                      )}
                      {onEdit && (
                        <button
                        type="button" 
                          onClick={() => onEdit(row)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                      {onCancel && (
                        <button
                          onClick={() => onCancel(row)}
                          className="text-orange-500 hover:text-orange-700"
                          title="Cancel"
                        >
                          <FontAwesomeIcon icon={faBan} />
                        </button>
                      )}
                      {onClose && (
                        <button
                          onClick={() => onClose(row)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Close"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      )}
                      {onCopy && (
                        <button
                          onClick={() => onCopy(row)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Copy"
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>
                      )}
                      {onSave && (
                        <button
                          onClick={() => onSave(row, {} as Partial<T>)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Save"
                        >
                          <FontAwesomeIcon icon={faSave} />
                        </button>
                      )}
                      {onRestore && (
                        <button
                          onClick={() => onRestore(row)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Restore"
                        >
                          <FontAwesomeIcon icon={faUndoAlt} />
                        </button>
                      )}
                      {onPermanentDelete && (
                        <button
                          onClick={() => onPermanentDelete(row)}
                          className="text-red-800 hover:text-red-900"
                          title="Permanent Delete"
                        >
                          <FontAwesomeIcon icon={faRecycle} />
                        </button>
                      )}
                      {/* ✅ New invoice button */}
                    {onInvoice && (invoiceVisible ? invoiceVisible(row) : true) && (
  <button
    onClick={() => onInvoice(row)}
    className="flex text-green-600 hover:text-green-800 font-medium"
  >
    {invoiceIcon || <FontAwesomeIcon icon={faCopy} className="mr-1" />}
    {typeof invoiceLabel === "function" ? invoiceLabel(row) : invoiceLabel}
  </button>
)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={
                  columns.length +
                  (onView ||
                  onEdit ||
                  onDelete ||
                  onCancel ||
                  onClose ||
                  onCopy ||
                  onSave ||
                  onRestore ||
                  onPermanentDelete ||
                  onInvoice
                    ? 1
                    : 0)
                }
                className="text-center py-6 text-red-500 border"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

     {/* ✅ Updated Pagination */}
{totalPages > 1 && (
  <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
    {/* Showing count */}
    <p className="text-sm text-gray-600">
      Showing {(currentPage - 1) * rowsPerPage + 1}–
      {Math.min(currentPage * rowsPerPage, data.length)} of {data.length} entries
    </p>

    {/* Pagination controls */}
    <div className="flex items-center gap-2">
      {/* Previous */}
      <button
        type="button"
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 border rounded ${
          currentPage === 1
            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
            : "text-gray-700 bg-white hover:bg-gray-50"
        }`}
      >
        Previous
      </button>

      {/* Dynamic Page Numbers (only 3 visible) */}
      {(() => {
        let startPage = currentPage;
        let endPage = Math.min(currentPage + 2, totalPages);

        // Ensure we always show 3 pages if possible
        if (endPage - startPage < 2) {
          startPage = Math.max(endPage - 2, 1);
        }

        return Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        ).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 border rounded ${
              currentPage === page
                ? "text-white bg-[#275981]"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ));
      })()}

      {/* Next */}
      <button
        type="button"
        onClick={() =>
          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
        }
        disabled={currentPage === totalPages}
        className={`px-3 py-1 border rounded ${
          currentPage === totalPages
            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
            : "text-gray-700 bg-white hover:bg-gray-50"
        }`}
      >
        Next
      </button>
    </div>
  </div>
)}

    </div>
  );
};
