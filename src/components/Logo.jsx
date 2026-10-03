import logoDark from '../assets/bgt-logo-dark.png';
import logoLight from '../assets/bgt-logo-light.png';
import { useTheme } from '../theme/ThemeContext';

export function LogoMark({ size = 'md' }) {
  const { theme } = useTheme();
  const px = size === 'lg' ? 56 : 32;
  return (
    <span className={`logo-mark${size === 'lg' ? ' lg' : ''}`}>
      <img
        src={theme === 'light' ? logoLight : logoDark}
        alt="BrightGrid"
        width={px}
        height={px}
      />
    </span>
  );
}
