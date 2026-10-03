import { LogoMark } from './Logo';

export function BrandLockup({ size = 'md', company = 'BrightGrid', product = 'CCIDP' }) {
  return (
    <div className={`brand-lockup brand-${size}`}>
      <LogoMark size={size} />
      <div className="brand-copy">
        <div className="company">{company}</div>
        <div className="product">{product}</div>
      </div>
    </div>
  );
}
