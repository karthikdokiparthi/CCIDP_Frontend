import { BrandLockup } from './BrandLockup';

export function AuthCard({ title, lead, children, footer }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <BrandLockup size="lg" company="BrightGrid CCIDP" product="Admin" />
        {title ? <h1>{title}</h1> : null}
        {lead ? <p className="lead">{lead}</p> : null}
        {children}
        {footer}
      </div>
    </div>
  );
}
