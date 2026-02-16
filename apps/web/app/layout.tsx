import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "@/styles/globals.css"
import { Providers } from "@/app/providers"
import { AppSidebar } from "@/components/ui/AppSidebar"
import { MobileNav } from "@/components/ui/MobileNav"
import { PageTransition } from "@/components/ui/PageTransition"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "MES Backlog System",
  description: "Production backlog tracker for workshop operations"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={jakarta.className}>
        <Providers>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="w-full flex-1">
              <PageTransition>{children}</PageTransition>
            </div>
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}