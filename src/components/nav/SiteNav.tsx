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
          <span className="nav-name">
            <span className="nav-wordmark">THE <em>ZHA</em> FOUNDRY</span>
            <span className="nav-sub">Independent software foundry</span>
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
          <ThemeToggle />
          <a className="btn btn-ghost" href="#contact">Bring a project</a>
        </div>
      </div>
    </header>
  );
}
