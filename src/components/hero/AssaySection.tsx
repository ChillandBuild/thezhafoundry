import { AssayForm } from './AssayForm';
import './hero.css';

export function AssaySection() {
  return (
    <section className="section assay-section" id="assay" aria-label="Free assay">
      <div className="container">
        <AssayForm />
      </div>
    </section>
  );
}
