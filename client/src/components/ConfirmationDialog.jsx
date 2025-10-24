import { useEffect } from 'react';
import { X, AlertTriangle, Info, HelpCircle } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'danger':
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      default:
        return <HelpCircle className={`${iconClass} text-gray-500`} />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'warning':
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      case 'danger':
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case 'info':
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
      default:
        return "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg 
                       hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 
                       focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2.5 text-white rounded-lg focus:outline-none focus:ring-2 
                       focus:ring-offset-2 transition-all duration-200 font-medium 
                       disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
