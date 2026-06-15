import { useAppStore } from '@/store'

function BuildSidebar() {
  const builds = useAppStore((s) => s.builds)
  const currentBuildId = useAppStore((s) => s.currentBuildId)
  const setCurrentBuild = useAppStore((s) => s.setCurrentBuild)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)
  const createBuild = useAppStore((s) => s.createBuild)
  const toggleBuildFavorite = useAppStore((s) => s.toggleBuildFavorite)

  const handleNewBuild = () => {
    const name = prompt('请输入方案名称：', '新装机方案')
    if (name) {
      const id = createBuild(name)
      setCurrentBuild(id)
    }
  }

  const sortedBuilds = [...builds].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <aside className="sidebar">
      <div className="sidebar-header flex justify-between align-center">
        <span className="sidebar-title">我的方案</span>
        <button className="btn btn-sm btn-primary" onClick={handleNewBuild}>
          ＋ 新建
        </button>
      </div>
      <div className="sidebar-content">
        {sortedBuilds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div>暂无方案</div>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-sm btn-primary" onClick={handleNewBuild}>
                创建第一个方案
              </button>
            </div>
          </div>
        ) : (
          sortedBuilds.map((build) => {
            const total = getBuildTotalPrice(build.id)
            return (
              <div
                key={build.id}
                className={`build-list-item ${currentBuildId === build.id ? 'active' : ''}`}
                onClick={() => setCurrentBuild(build.id)}
              >
                <div className="build-list-name">
                  <span>{build.isFavorite ? '⭐' : '📄'}</span>
                  <span style={{ flex: 1 }}>{build.name}</span>
                  <button
                    className="icon-btn success"
                    style={{ width: 24, height: 24, fontSize: 14 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBuildFavorite(build.id)
                    }}
                  >
                    {build.isFavorite ? '★' : '☆'}
                  </button>
                </div>
                {build.clientName && (
                  <div className="build-list-meta">客户：{build.clientName}</div>
                )}
                <div className="build-list-meta">
                  {new Date(build.updatedAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="build-list-price">¥{total.toLocaleString()}</div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

export default BuildSidebar
