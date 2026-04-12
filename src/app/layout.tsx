import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Snipster — The Kinetic Archive",
  description:
    "Elevate your technical assets. A premium experience for developers to store, share, and discover code snippets.",
  icons: {
    icon: "/snipster-logo.png",
    shortcut: "/snipster-logo.png",
    apple: "/snipster-logo.png",
  },
  openGraph: {
    images: [
      {
        url: "/snipster-logo.png",
        width: 600,
        height: 600,
        alt: "Snipster logo",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider dynamic>
      <html lang="en" suppressHydrationWarning className="dark">
        <head>
          <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased bg-[#0a0a0a] text-[#e5e2e1] overflow-x-hidden selection:bg-primary selection:text-on-primary font-body">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}