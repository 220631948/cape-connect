import type { Metadata, Viewport } from "next";
import "./globals.css";
import { headers } from 'next/headers';
import { getTenantConfig } from '@/lib/tenant/server';
import { TenantProvider } from '@/lib/tenant/TenantContext';

export const metadata: Metadata = {
  title: "CapeTown GIS Hub",
  description: "Whimsical Neumorphic Geospatial Intelligence",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CapeTown GIS Hub",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0C10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantConfig = tenantId ? await getTenantConfig(tenantId) : {};

  return (
    <html lang="en">
      <body>
        <TenantProvider config={tenantConfig}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
