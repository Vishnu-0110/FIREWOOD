import { CheckIcon, CloseIcon, IconAction } from './AppIcons';

const ConfirmModal = ({ title, text, onConfirm, id = 'confirmModal' }) => {
  return (
    <div className="modal fade" id={id} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body">{text}</div>
          <div className="modal-footer">
            <IconAction type="button" icon={CloseIcon} label="Cancel" className="btn-outline-secondary btn-sm" data-bs-dismiss="modal" />
            <IconAction type="button" icon={CheckIcon} label="Confirm" className="btn-danger btn-sm" onClick={onConfirm} data-bs-dismiss="modal" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
