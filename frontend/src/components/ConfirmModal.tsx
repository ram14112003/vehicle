import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, X } from 'lucide-react';


export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  bookingDetails?: {
    bookingCode: string;
    customerName: string;
    route?: string;
    finalFare?: number;
  };
  confirmText: string;
  cancelText?: string;
  variant?: 'primary' | 'success' | 'danger';
  isLoading: boolean;
  loadingText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  bookingDetails,
  confirmText,
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading,
  loadingText = 'Processing...',
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <XCircle className="text-rose-500" size={28} />,
          iconBg: 'bg-rose-50 border-rose-100',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="text-emerald-600" size={28} />,
          iconBg: 'bg-emerald-50 border-emerald-100',
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
        };
      default:
        return {
          icon: <AlertTriangle className="text-amber-500" size={28} />,
          iconBg: 'bg-amber-50 border-amber-100',
          btnClass: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header with Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${styles.iconBg}`}>
              {styles.icon}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Booking Details Card if provided */}
        {bookingDetails && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-400 font-bold">Booking Reference</span>
              <span className="font-mono font-black text-slate-900">{bookingDetails.bookingCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Customer:</span>
              <span className="font-bold text-slate-900">{bookingDetails.customerName}</span>
            </div>
            {bookingDetails.route && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 font-semibold">Route:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">
                  {bookingDetails.route}
                </span>
              </div>
            )}
            {bookingDetails.finalFare !== undefined && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 font-semibold">Final Fare:</span>
                <span className="font-black text-emerald-700 text-sm">₹{bookingDetails.finalFare}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${styles.btnClass}`}
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
