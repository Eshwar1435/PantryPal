import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title, itemName, message, children, confirmLabel = 'Delete', busy = false, onCancel, onConfirm }) {
  const confirmButton = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmButton.current?.focus();
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => !busy && event.target === event.currentTarget && onCancel()}>
    <section className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
      <div className="modal-heading">
        <div><h2 id="confirm-dialog-title">{title}</h2><p id="confirm-dialog-description">{message}</p></div>
        <button type="button" className="icon-button" onClick={onCancel} disabled={busy} aria-label="Close confirmation dialog">×</button>
      </div>
      <div className="confirm-warning"><AlertTriangle size={18}/><span><strong>{itemName}</strong><br/>This action cannot be undone.</span></div>
      {children}
      <div className="modal-actions"><button type="button" className="btn secondary" onClick={onCancel} disabled={busy}>Cancel</button><button ref={confirmButton} type="button" className="btn danger-button" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting...' : confirmLabel}</button></div>
    </section>
  </div>;
}
