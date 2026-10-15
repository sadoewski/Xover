import { IconClock, IconPlayerPlay, IconCircleCheck, IconX, IconCalendarEvent } from '@tabler/icons-react';

export default function StatusIcon({ status, color, size = 20 }) {
  const getIcon = () => {
    switch (status) {
      case 'pending':
        return <IconClock size={size * 0.7} />;
      case 'in_progress':
        return <IconPlayerPlay size={size * 0.7} />;
      case 'completed':
        return <IconCircleCheck size={size * 0.7} />;
      case 'cancelled':
        return <IconX size={size * 0.7} />;
      case 'moved':
        return <IconCalendarEvent size={size * 0.7} />;
      default:
        return <IconClock size={size * 0.7} />;
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
