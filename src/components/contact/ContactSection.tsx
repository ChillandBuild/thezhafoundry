import { ContactForm } from './ContactForm';
import './contact.css';

export function ContactSection() {
  return (
    <section className="section" id="contact" aria-labelledby="contact-heading">
      <div className="container">
        <p className="eyebrow">Final pour</p>
        <h2 id="contact-heading">Stop wrestling with prompt limits.</h2>
        <div className="contact-grid">
          <p className="contact-pitch">
            Let&apos;s turn your vibe into structural steel. Send a repo, a broken deploy, or three
            sentences about an idea — <strong>a human reads every message and replies within one
            working day.</strong>
          </p>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
