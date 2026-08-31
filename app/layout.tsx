import "./globals.css";

export const metadata = {
  title: "MIL-HOME",
  description: "Military Station Housing & Estate Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
