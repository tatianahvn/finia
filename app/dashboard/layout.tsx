import { AnalysisProvider } from '@/lib/context/analysis'
import { CategoriesProvider } from '@/lib/context/categories'
import Sidebar from './_components/Sidebar'
import Header from './_components/Header'
import Footer from './_components/Footer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CategoriesProvider>
      <AnalysisProvider>
        <div className="flex h-screen overflow-hidden bg-white">
          <Sidebar />

          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto px-6 py-6 bg-neutral-50">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </AnalysisProvider>
    </CategoriesProvider>
  )
}
