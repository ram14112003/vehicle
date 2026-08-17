import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faTimesCircle,
  faTrash,
  faEdit,
  faCopy,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";

interface Column {
  header: string;
  accessor: string;
}

interface TableProps {
  columns: Column[];
  data: any[];
  onAction?: (action: string, row: any) => void;
}

const Table: React.FC<TableProps> = ({ columns, data, onAction }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="border border-gray-300 px-3 py-2">
                {col.header}
              </th>
            ))}
            <th className="border border-gray-300 px-3 py-2 text-center" colSpan={6}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="border border-gray-300 px-3 py-2">
                  {row[col.accessor]}
                </td>
              ))}

              {/* Actions */}
              <td className="border border-gray-300 px-3 py-2 text-center text-blue-600 cursor-pointer">
                <FontAwesomeIcon icon={faEye} onClick={() => onAction?.("view", row)} />
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center text-green-600 cursor-pointer">
                <FontAwesomeIcon icon={faCheckCircle} onClick={() => onAction?.("close", row)} />
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center text-red-500 cursor-pointer">
                <FontAwesomeIcon icon={faTimesCircle} onClick={() => onAction?.("cancel", row)} />
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center text-yellow-500 cursor-pointer">
                <FontAwesomeIcon icon={faEdit} onClick={() => onAction?.("edit", row)} />
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center text-purple-600 cursor-pointer">
                <FontAwesomeIcon icon={faCopy} onClick={() => onAction?.("copy", row)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
