import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: '11+ English Spelling Practice',
  description: 'Interactive, mobile-responsive spelling test engine for 11+ exams with smart repetition and timed tests.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </body>
    </html>
  );
}
