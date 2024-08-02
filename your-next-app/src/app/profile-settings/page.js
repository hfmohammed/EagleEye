// app/profile-settings/page.jsx

import { ProfileSettings } from '@/components/profile-settings';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <ProfileSettings />
      </main>
      <Footer />
    </div>
  );
}
