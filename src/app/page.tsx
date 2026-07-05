import { SiteNav } from '../components/nav/SiteNav';
import { Hero } from '../components/hero/Hero';
import { TwoDoors } from '../components/doors/TwoDoors';
import { RealityCheck } from '../components/reality/RealityCheck';
import { ForgeTiers } from '../components/tiers/ForgeTiers';
import { FoundryCare } from '../components/care/FoundryCare';

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
      </main>
    </>
  );
}
