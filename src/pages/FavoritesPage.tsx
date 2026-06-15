import { useMemo, useState } from 'react'
import { useAppStore } from '@/store'
import { CATEGORY_LABELS } from '@/types'
import type { ComponentCategory } from '@/types'

function FavoritesPage() {
  const builds = useAppStore((s) => s.builds)
  const toggleBuildFavorite = useAppStore((s) => s.toggleBuildFavorite)
  const setCurrentBuild = useAppStore((s) => s.setCurrentBuild)
  const deleteBuild = useAppStore((s) => s.deleteBuild)
  const duplicateBuild = useAppStore((s) => s.duplicateBuild)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)
  const getBuildComponents = useAppStore((s) => s.getBuildComponents)
  const toggleCompareBuild = useAppStore((s) => s.toggleCompareBuild)
  const compareBuildIds = useAppStore((s) => s.compareBuildIds)
  const createBuild = useAppStore((s) => s.createBuild)

  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'price' | 'name'>('updated')

  const filteredBuilds = useMemo(() => {
    let arr = [...builds]
    if (filter === 'favorites') {
      arr = arr.filter((b) => b.isFavorite)
    }
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.clientName && b.clientName.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    switch (sortBy) {
      case 'updated':
        arr.sort((a, b) => b.updatedAt - a.updatedAt)
        break
      case 'created':
        arr.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'price':
        arr.sort((a, b) => getBuildTotalPrice(b.id) - getBuildTotalPrice(a.id))
        break
      case 'name':
        arr.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
        break
    }
    return arr
  }, [builds, filter, search, sortBy])

  const favoriteBuilds = builds.filter((b) => b.isFavorite)

  const handleNewBuild = () => {
    const name = prompt('请输入方案名称：', '新装机方案')
    if (name) {
      const id = createBuild(name)
      setCurrentBuild(id)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">收藏夹 & 方案历史</h1>
          <div className="page-subtitle">
            共 {builds.length} 个方案，其中 {favoriteBuilds.length} 个收藏 ·{' '}
            <span className="text-success">已选 {compareBuildIds.length}/2 用于对比</span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleNewBuild}>
          ＋ 新建方案
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            className="input"
            placeholder="搜索方案名称、客户、标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tags">
          <span
            className={`filter-tag ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部方案 ({builds.length})
          </span>
          <span
            className={`filter-tag ${filter === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilter('favorites')}
          >
            ⭐ 收藏 ({favoriteBuilds.length})
          </span>
        </div>
        <select
          className="select"
          style={{ width: 160 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="updated">按更新时间</option>
          <option value="created">按创建时间</option>
          <option value="price">按价格高低</option>
          <option value="name">按名称排序</option>
        </select>
      </div>

      {filteredBuilds.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">{filter === 'favorites' ? '⭐' : '📁'}</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              {filter === 'favorites' ? '还没有收藏的方案' : '暂无方案'}
            </div>
            <div className="text-secondary" style={{ marginBottom: 16 }}>
              {filter === 'favorites'
                ? '点击方案卡片的星标图标可以收藏方案'
                : '点击上方按钮创建您的第一个装机方案'}
            </div>
            {filter !== 'favorites' && (
              <button className="btn btn-primary" onClick={handleNewBuild}>
                ＋ 创建方案
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-3 gap-4">
          {filteredBuilds.map((build) => {
            const total = getBuildTotalPrice(build.id)
            const components = getBuildComponents(build.id)
            const filledCount = components.filter((x) => x.component).length
            const isInCompare = compareBuildIds.includes(build.id)
            const compsMap: Record<string, string[]> = {}
            components.forEach((item) => {
              if (item.component) {
                if (!compsMap[item.component.category]) {
                  compsMap[item.component.category] = []
                }
                compsMap[item.component.category].push(item.component.name)
              }
            })
            return (
              <div key={build.id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ marginBottom: 12 }}>
                  <div className="flex justify-between align-center" style={{ marginBottom: 4 }}>
                    <h3
                      style={{ fontSize: 16, cursor: 'pointer' }}
                      onClick={() => setCurrentBuild(build.id)}
                    >
                      {build.name}
                    </h3>
                    <button
                      className="icon-btn success"
                      onClick={() => toggleBuildFavorite(build.id)}
                      title={build.isFavorite ? '取消收藏' : '收藏'}
                    >
                      {build.isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                  {build.clientName && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      👤 {build.clientName}
                    </div>
                  )}
                  {build.description && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        marginTop: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {build.description}
                    </div>
                  )}
                </div>

                <div style={{ padding: 12, background: 'var(--bg-darker)', borderRadius: 8, marginBottom: 12 }}>
                  <div className="grid grid-2 gap-2" style={{ fontSize: 12 }}>
                    {Object.entries(compsMap)
                      .slice(0, 6)
                      .map(([cat, names]) => (
                        <div key={cat} className="flex justify-between">
                          <span className="text-secondary">{CATEGORY_LABELS[cat as ComponentCategory]}</span>
                          <span style={{ fontSize: 11, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {names[0]}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span className="text-secondary" style={{ fontSize: 12 }}>
                      已选 {filledCount}/11 配件
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                      ¥{total.toLocaleString()}
                    </span>
                  </div>
                  {build.budgetLimit && (
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 6,
                        color:
                          total > build.budgetLimit ? 'var(--danger)' : 'var(--secondary)',
                      }}
                    >
                      预算 ¥{build.budgetLimit.toLocaleString()} ·{' '}
                      {total > build.budgetLimit
                        ? `超支 ¥${(total - build.budgetLimit).toLocaleString()}`
                        : `剩余 ¥${(build.budgetLimit - total).toLocaleString()}`}
                    </div>
                  )}
                </div>

                {build.tags.length > 0 && (
                  <div className="tags-container" style={{ marginBottom: 12 }}>
                    {build.tags.map((tag, i) => (
                      <span key={i} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 12,
                  }}
                >
                  <span>创建 {new Date(build.createdAt).toLocaleDateString('zh-CN')}</span>
                  <span>更新 {new Date(build.updatedAt).toLocaleDateString('zh-CN')}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className={`btn btn-sm ${isInCompare ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => toggleCompareBuild(build.id)}
                  >
                    {isInCompare ? '✓ 对比中' : '⚖️ 对比'}
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const id = duplicateBuild(build.id)
                      setCurrentBuild(id)
                    }}
                  >
                    📋 复制
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setCurrentBuild(build.id)}
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    className="icon-btn danger"
                    title="删除"
                    onClick={() => {
                      if (confirm(`确定删除方案"${build.name}"吗？`)) {
                        deleteBuild(build.id)
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage
