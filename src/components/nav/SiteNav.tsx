import { ThemeToggle } from './ThemeToggle';
import './nav.css';

const LINKS = [
  ['#cast', 'Cast'],
  ['#forge', 'Forge'],
  ['#care', 'Care'],
  ['#standard', 'Standard'],
  ['#teardowns', 'Teardowns'],
] as const;

export function SiteNav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a href="#top" className="nav-lockup" aria-label="The Zha Foundry — back to top">
          <em className="nav-zha">ZHA</em>
          <span className="nav-stack">
            <span>THE</span>
            <span>FOUNDRY</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <ul className="nav-links">
            {LINKS.map(([href, label]) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="nav-actions">
          <span className="nav-temp" aria-hidden="true">
            <span data-nav-temp>1,084.6</span>&nbsp;°C
          </span>
          <ThemeToggle />
          <a className="btn btn-ghost" href="#contact">Bring a project</a>
        </div>
      </div>
    </header>
  );
}
