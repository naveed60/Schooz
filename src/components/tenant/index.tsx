import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className='page-header'>{eyebrow && <p className='eyebrow'>{eyebrow}</p>}<div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div>{action}</div>}</header>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className='empty-state'><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase().replaceAll('_', '-')}`}>{status.replaceAll('_', ' ')}</span>;
}

export function ConfirmDialog({ children }: { children: ReactNode }) {
  return <div className='confirm-dialog' role='group'>{children}</div>;
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <table className='data-table'><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table>;
}
