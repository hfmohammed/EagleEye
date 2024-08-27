// app/profile-settings/page.jsx

import { Analytics } from '@/components/analytics';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Analytics />
      <Footer />
    </div>
  );
}
