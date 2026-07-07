import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, Saira_Stencil_One } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '800'],
  variable: '--font-archivo',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

// third family is a deliberate exception: brand wordmark only —
// stencil lettering is how foundries mark castings and crates
const stencil = Saira_Stencil_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-stencil',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Zha Foundry — You vibe code it. We forge it.',
  description:
    'The independent foundry for AI-built software. We pour new AI-native products, take prompt-built prototypes to production, and keep both alive — verified by a human who signs their name.',
};

// Applies the visitor's saved theme before first paint so there is no flash.
const themeInit = `(function(){try{var t=localStorage.getItem('zha-theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable} ${stencil.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
