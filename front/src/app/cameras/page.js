// app/profile-settings/page.jsx

import { Cameras } from '@/components/cameras';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function CamerasPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="analytics-main">
        <Cameras />
      </main>
      <Footer />
    </div>
  );
}
