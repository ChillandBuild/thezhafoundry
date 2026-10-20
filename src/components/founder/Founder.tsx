import Image from 'next/image';
import './founder.css';

const FOUNDER_EMAIL = 'thezhafoundry@gmail.com';

export function Founder() {
  return (
    <section className="section" id="founder" aria-labelledby="founder-heading">
      <div className="container">
        <p className="eyebrow">The founder</p>
        <h2 id="founder-heading">A name on every shipment.</h2>
        <div className="founder-grid" data-reveal>
          <figure className="founder-photo">
            <Image
              src="/founder.jpg"
              alt="Prem Kannan, founder of The Zha Foundry"
              width={512}
              height={512}
              sizes="(max-width: 720px) 60vw, 280px"
            />
          </figure>
          <div className="founder-body">
            <p className="founder-name">Prem Kannan</p>
            <p className="founder-role">Founder · Coimbatore, India</p>
            <p className="founder-bio">
              I&apos;m an integrated MSc Data Science student who builds AI products in Python. At
              Bloom Matrix I co-built Anril AI, and I write the evaluations and tests that catch
              regressions before users do. The Zha Foundry applies that discipline to software that
              was built with AI and now has to survive real use.
            </p>
            <a className="founder-mail" href={`mailto:${FOUNDER_EMAIL}`}>
              {FOUNDER_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
