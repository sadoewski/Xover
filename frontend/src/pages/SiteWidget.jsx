export default function SiteWidget({ item, onDelete }) {
  return (
    <div className="site-widget">
      <div className="widget-header">
        <h3>{item.name}</h3>
        {onDelete && (
          <button
            className="delete-btn"
            onClick={() => onDelete(item.id)}
            title="Удалить"
          >
            ×
          </button>
        )}
      </div>
      {item.description && (
        <p className="widget-description">{item.description}</p>
      )}
      <div className="widget-coordinates">
        <span>X: {item.x}</span>
        <span>Y: {item.y}</span>
        <span>Z: {item.z}</span>
      </div>
    </div>
  );
}
