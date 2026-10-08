import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://127.0.0.1:3033',
  ),
  title: 'ScopeForge — From brief to believable scope',
  description:
    'Turn a vague customer brief into an editable scope, effort band and customer-ready proposal. A synthetic portfolio demo by Steve Grady.',
  openGraph: {
    title: 'ScopeForge',
    description: 'A vague brief. A clear way forward.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
