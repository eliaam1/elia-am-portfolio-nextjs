import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Do you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-6 text-left">
        <p className="text-sm text-app-text-secondary leading-relaxed font-sans">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            size="sm"
            className="text-xs"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={loading}
            size="sm"
            className="bg-red-500 hover:bg-red-650 text-white border-transparent text-xs hover:shadow-red-500/10"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
