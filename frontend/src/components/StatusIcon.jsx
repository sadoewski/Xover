import { Clock, Play, Check, X, RotateCcw } from 'lucide-react';

export default function StatusIcon({ status, color, size = 20 }) {
  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock size={size * 0.7} />;
      case 'in_progress':
        return (
          <div style={{ position: 'relative', width: size * 0.7, height: size * 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={size * 0.7} strokeWidth={2.5} />
            <Play size={size * 0.35} style={{ position: 'absolute' }} fill="currentColor" />
          </div>
        );
      case 'completed':
        return <Check size={size * 0.7} strokeWidth={3} />;
      case 'cancelled':
        return <X size={size * 0.7} strokeWidth={3} />;
      case 'moved':
        return <RotateCcw size={size * 0.7} strokeWidth={2.5} />;
      default:
        return <Clock size={size * 0.7} />;
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color || '#6b7280',
        color: 'white',
        flexShrink: 0
      }}
    >
      {getIcon()}
    </div>
  );
}
