import { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import './Toast.css';

export default function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button onClick={onClose} className="toast-close" aria-label="Закрыть">
          <IconX size={16} />
        </button>
      </div>
    </div>
  );
}
