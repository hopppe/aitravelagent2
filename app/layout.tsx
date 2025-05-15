import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import dynamic from 'next/dynamic';
import { AuthProvider } from '../hooks/useAuth';
import Script from 'next/script';

// Import ErrorBoundary dynamically to avoid SSR issues
const ErrorBoundary = dynamic(
  () => import('../components/ErrorBoundary'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'AI Travel Agent',
  description: 'Plan your perfect trip with the help of AI',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Script
        id="emerald-affiliation"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var script = document.createElement("script");
              script.async = 1;
              script.src = 'https://emrldtp.cc/NDE2ODE4.js?t=416818';
              document.head.appendChild(script);
            })();
          `
        }}
        data-noptimize="1"
        data-cfasync="false"
        data-wpfc-render="false"
      />
      <body className="min-h-screen bg-light flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8 flex-grow">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
} 