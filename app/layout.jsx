import './globals.css';

export const metadata = {
  title: 'DomainMail UI',
  description: 'Custom Webmail Dashboard on Vercel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">{children}</body>
    </html>
  );
}
