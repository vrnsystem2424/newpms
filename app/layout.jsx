import './globals.css';

export const metadata = {
  title: 'PMS Dashboard',
  description: 'Project Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}