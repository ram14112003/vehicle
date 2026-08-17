// alertbox.tsx
import React from "react";
import toast, { Toaster } from "react-hot-toast";
import deleteGif from "./delete.gif";
import restoreGif from "./restore.gif";

type ToastType = "success" | "error" | "info" | "warn";

export const showToast = (message: string, type: ToastType = "success") => {
  switch (type) {
    case "success":
      toast.success(message, {
        id: message,
        position: "top-right",
        duration: 2000,
      });
      break;
    case "error":
      toast.error(message, {
        id: message,
        position: "top-right",
        duration: 2000,
      });
      break;
    case "info":
      toast(message, {
        id: message,
        position: "top-right",
        duration: 2000,
      });
      break;
    case "warn":
      toast(message, {
        id: message,
        position: "top-right",
        duration: 2000,
        style: {
          background: "#facc15",
          color: "#000",
        },
      });
      break;
    default:
      toast(message);
  }
};

// Popup types
type PopupType =
  | "confirm-delete"
  | "delete-success"
  | "restore-success"
  | "confirm-restore"
  | "confirm-permanent-delete"
  | "confirm-cancel";

interface ActionModalProps {
  isOpen: boolean;
  type: PopupType;
  onClose: () => void;
  onConfirm?: () => void;
  itemName?: string;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  type,
  onClose,
  onConfirm,
  itemName,
}) => {
  if (!isOpen) return null;

  let title = "";
  let gifSrc = "";
  let showConfirmButtons = false;
  let confirmButtonText = "OK";

  if (type === "confirm-delete") {
    title = `Are you sure you want to delete?`;
    gifSrc = deleteGif;
    showConfirmButtons = true;
    confirmButtonText = "Yes, Delete";
  } else if (type === "confirm-restore") {
    title = `Are you sure you want to restore ${itemName}?`;
    gifSrc = restoreGif;
    showConfirmButtons = true;
    confirmButtonText = "Yes, Restore";
  } else if (type === "confirm-permanent-delete") {
    title = `Warning: Are you sure you want to permanently delete ${itemName}?`;
    gifSrc = deleteGif;
    showConfirmButtons = true;
    confirmButtonText = "Yes, Permanently Delete";
  } else if (type === "delete-success") {
    title = "Deleted successfully!";
    gifSrc = deleteGif;
  } else if (type === "restore-success") {
    title = "Restored successfully!";
    gifSrc = restoreGif;
  }else if (type === "confirm-cancel") {
  title = "Are you sure you want to cancel?";
  gifSrc = deleteGif; // or use a neutral gif if you want
  showConfirmButtons = true;
  confirmButtonText = "Yes, Cancel";
}

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-sm p-6 text-center">
        {gifSrc && (
          <img
            src={gifSrc}
            alt="status"
            className="w-23 h-23 mx-auto animate-bounce mb-2"
          />
        )}
        <h2 className="text-lg font-semibold mb-4">{title}</h2>

        {showConfirmButtons ? (
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              No
            </button>
            <button
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
              className={`px-4 py-2 text-white rounded ${
                type === "confirm-delete" ||
                type === "confirm-permanent-delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {confirmButtonText}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};

// Toast container -> Add once in App.tsx
export const AlertContainer = () => <Toaster />;
