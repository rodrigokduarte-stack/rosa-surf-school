import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LanguageProvider } from '@/contexts/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rosa Surf School | App',
  description: 'Sistema de gestão para escolas de surf',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <LanguageProvider>
          <main className="min-h-screen bg-slate-50">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}