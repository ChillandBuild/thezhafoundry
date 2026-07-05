import { SteppedZ } from '../marks/Marks';
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
          <SteppedZ />
          <span className="nav-wordmark">THE <em>ZHA</em> FOUNDRY</span>
        </a>
        <nav aria-label="Main navigation">
          <ul className="nav-links">
            {LINKS.map(([href, label]) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </nav>
        <a className="btn btn-ghost" href="#contact">Bring a project</a>
      </div>
    </header>
  );
}
