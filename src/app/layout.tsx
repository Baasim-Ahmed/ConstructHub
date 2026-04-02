import './globals.css';
import { Providers } from '@/components/providers/Providers';

export const metadata = {
  title: 'ConstructHub',
  description: 'Construction project CRM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
