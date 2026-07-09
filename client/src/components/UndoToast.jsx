import { useState } from 'react';

const UndoToast = ({ message, onUndo, closeToast }) => {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleUndo = async () => {
    if (isRestoring) return;

    setIsRestoring(true);
    try {
      await onUndo();
      closeToast?.();
    } catch {
      // The caller shows the error toast so the undo prompt can stay visible.
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="undo-toast">
      <div className="undo-toast-message">{message}</div>
      <button type="button" className="undo-toast-action" onClick={handleUndo} disabled={isRestoring}>
        {isRestoring ? 'Restoring...' : 'Undo'}
      </button>
    </div>
  );
};

export default UndoToast;
