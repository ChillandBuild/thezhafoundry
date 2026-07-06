import { SiteNav } from '../components/nav/SiteNav';
import { Hero } from '../components/hero/Hero';
import { AssaySection } from '../components/hero/AssaySection';
import { TwoDoors } from '../components/doors/TwoDoors';
import { RealityCheck } from '../components/reality/RealityCheck';
import { ForgeTiers } from '../components/tiers/ForgeTiers';
import { FoundryCare } from '../components/care/FoundryCare';
import { ProcessLine } from '../components/process/ProcessLine';
import { Manifesto } from '../components/manifesto/Manifesto';
import { ZhaStandard } from '../components/standard/ZhaStandard';
import { Teardowns } from '../components/teardowns/Teardowns';
import { ContactSection } from '../components/contact/ContactSection';
import { SiteFooter } from '../components/footer/SiteFooter';
import { PourSeam } from '../components/seam/PourSeam';
import { ForgeMotion } from '../components/motion/ForgeMotion';

export default function Home() {
  return (
    <>
      <SiteNav />
      <PourSeam />
      <main id="top">
        <Hero />
        <AssaySection />
        <TwoDoors />
        <RealityCheck />
        <ForgeTiers />
        <FoundryCare />
        <ProcessLine />
        <Manifesto />
        <ZhaStandard />
        <Teardowns />
        <ContactSection />
      </main>
      <SiteFooter />
      <ForgeMotion />
    </>
  );
}
