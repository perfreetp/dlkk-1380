import { useState } from 'react'
import { useAppStore } from '@/store'
import ComponentsLibrary from '@/pages/ComponentsLibrary'
import BuildEditor from '@/pages/BuildEditor'
import PerformancePage from '@/pages/PerformancePage'
import QuotePage from '@/pages/QuotePage'
import ComparePage from '@/pages/ComparePage'
import FavoritesPage from '@/pages/FavoritesPage'
import BuildSidebar from '@/components/BuildSidebar'
import type { ComponentCategory } from '@/types'

type PageKey = 'library' | 'builder' | 'performance' | 'quote' | 'compare' | 'favorites'

const NAV_ITEMS: { key: PageKey; label: string; icon: string }[] = [
  { key: 'library', label: '配件库', icon: '📦' },
  { key: 'builder', label: '方案编辑', icon: '🔧' },
  { key: 'performance', label: '性能估算', icon: '📊' },
  { key: 'quote', label: '报价单', icon: '📄' },
  { key: 'compare', label: '方案对比', icon: '⚖️' },
  { key: 'favorites', label: '收藏夹', icon: '⭐' },
]

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('builder')
  const builds = useAppStore((s) => s.builds)
  const currentBuildId = useAppStore((s) => s.currentBuildId)
  const createBuild = useAppStore((s) => s.createBuild)
  const setCurrentBuild = useAppStore((s) => s.setCurrentBuild)

  const handleNewBuild = () => {
    const name = prompt('请输入方案名称：', '新装机方案')
    if (name) {
      const id = createBuild(name)
      setCurrentBuild(id)
      setCurrentPage('builder')
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'library':
        return <ComponentsLibrary />
      case 'builder':
        return <BuildEditor />
      case 'performance':
        return <PerformancePage />
      case 'quote':
        return <QuotePage />
      case 'compare':
        return <ComparePage />
      case 'favorites':
        return <FavoritesPage />
    }
  }

  const showSidebar = currentPage === 'builder' || currentPage === 'performance' || currentPage === 'quote'

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <span className="app-logo-icon">🖥️</span>
          <span>PC Builder Pro</span>
        </div>
        <nav className="app-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="btn btn-primary" onClick={handleNewBuild}>
          <span>＋</span> 新建方案
        </button>
      </header>

      <div className="app-content">
        {showSidebar && <BuildSidebar />}
        <main className="page">{renderPage()}</main>
      </div>
    </div>
  )
}

export default App
