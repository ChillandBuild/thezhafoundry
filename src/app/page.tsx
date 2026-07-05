import { SiteNav } from '../components/nav/SiteNav';
import { Hero } from '../components/hero/Hero';
import { TwoDoors } from '../components/doors/TwoDoors';
import { RealityCheck } from '../components/reality/RealityCheck';
import { ForgeTiers } from '../components/tiers/ForgeTiers';
import { FoundryCare } from '../components/care/FoundryCare';
import { ProcessLine } from '../components/process/ProcessLine';
import { Manifesto } from '../components/manifesto/Manifesto';
import { ZhaStandard } from '../components/standard/ZhaStandard';
import { Teardowns } from '../components/teardowns/Teardowns';

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top">
        <Hero />
        <TwoDoors />
        <RealityCheck />
        <ForgeTiers />
        <FoundryCare />
        <ProcessLine />
        <Manifesto />
        <ZhaStandard />
        <Teardowns />
      </main>
    </>
  );
}
