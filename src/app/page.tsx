import { SiteNav } from '../components/nav/SiteNav';
import { Hero } from '../components/hero/Hero';

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top">
        <Hero />
      </main>
    </>
  );
}
