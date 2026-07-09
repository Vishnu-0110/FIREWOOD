import { toast } from 'react-toastify';
import UndoToast from '../components/UndoToast';

export const showDeleteUndoToast = ({ message, onUndo }) => {
  return toast.success(<UndoToast message={message} onUndo={onUndo} />, {
    autoClose: 5000,
    closeButton: false,
    closeOnClick: false,
    draggable: false,
    hideProgressBar: true
  });
};
