import { Plus } from 'lucide-react';
import './common.css';

export default function PageHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button className="btn btn-primary" onClick={onAction}>
          <Plus size={18} /> {action}
        </button>
      )}
    </div>
  );
}
