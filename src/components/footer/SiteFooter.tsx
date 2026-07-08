import { SteppedZ } from '../marks/Marks';
import './footer.css';

export function SiteFooter() {
  return (
    <footer className="footer">
      <p className="footer-ghost" aria-hidden="true">THE ZHA FOUNDRY</p>
      <span className="footer-ember" aria-hidden="true" />
      <span className="footer-ember" aria-hidden="true" />
      <span className="footer-ember" aria-hidden="true" />
      <div className="container footer-inner">
        <p className="footer-temp" aria-hidden="true">
          24.0 °C — ambient · the casting has cooled
        </p>
        <div>
          <p className="footer-lockup">
            <SteppedZ />
            <span>THE <em>ZHA</em> FOUNDRY</span>
          </p>
          <p className="footer-note">
            An independent software foundry, built and run in public by a founder who signs his
            name on every shipment.
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <a href="#assay">Run an assay</a>
          <a href="#standard">The Zha Standard</a>
          <a href="mailto:kanthaiyee@gmail.com">kanthaiyee@gmail.com</a>
        </nav>
        <p className="footer-legal">© 2026 The Zha Foundry · Forged, not generated.</p>
      </div>
    </footer>
  );
}
