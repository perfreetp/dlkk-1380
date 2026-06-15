import { useMemo } from 'react'
import { useAppStore } from '@/store'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types'
import type { Build, ComponentCategory } from '@/types'
import { estimatePerformance } from '@/utils/performance'

const SLOT_LABELS: { slotId: string; category: ComponentCategory; label: string }[] = [
  { slotId: 'cpu', category: 'cpu', label: 'CPU 处理器' },
  { slotId: 'motherboard', category: 'motherboard', label: '主板' },
  { slotId: 'gpu', category: 'gpu', label: '显卡' },
  { slotId: 'ram', category: 'ram', label: '内存' },
  { slotId: 'storage-primary', category: 'storage', label: '主存储' },
  { slotId: 'storage-secondary', category: 'storage', label: '副存储' },
  { slotId: 'psu', category: 'psu', label: '电源' },
  { slotId: 'case', category: 'case', label: '机箱' },
  { slotId: 'cooler', category: 'cooler', label: '散热器' },
  { slotId: 'monitor', category: 'monitor', label: '显示器' },
  { slotId: 'os', category: 'os', label: '操作系统' },
]

function ComparePage() {
  const builds = useAppStore((s) => s.builds)
  const compareBuildIds = useAppStore((s) => s.compareBuildIds)
  const toggleCompareBuild = useAppStore((s) => s.toggleCompareBuild)
  const clearCompare = useAppStore((s) => s.clearCompare)
  const setCurrentBuild = useAppStore((s) => s.setCurrentBuild)
  const getComponentById = useAppStore((s) => s.getComponentById)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)
  const getBuildComponents = useAppStore((s) => s.getBuildComponents)
  const components = useAppStore((s) => s.components)

  const selectedBuilds = compareBuildIds
    .map((id) => builds.find((b) => b.id === id))
    .filter((b): b is Build => !!b)

  const performanceData = useMemo(() => {
    return selectedBuilds.map((build) => {
      const buildComps = getBuildComponents(build.id)
        .filter((x) => x.component)
        .map((x) => x.component!)
      return estimatePerformance(buildComps)
    })
  }, [selectedBuilds, getBuildComponents])

  const getBetterBuildIndex = (values: number[], higherIsBetter = true) => {
    if (values.length < 2) return -1
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values)
    if (values.every((v) => v === best)) return -1
    return values.indexOf(best)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">方案对比</h1>
          <div className="page-subtitle">
            选择 2 个方案进行详细对比 · 已选 {selectedBuilds.length}/2
          </div>
        </div>
        {compareBuildIds.length > 0 && (
          <button className="btn btn-secondary" onClick={clearCompare}>
            清空选择
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <span>📋</span> 选择对比方案
        </div>
        {builds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div>暂无方案，请先创建装机方案</div>
          </div>
        ) : (
          <div className="grid grid-4 gap-3">
            {builds.map((build) => {
              const total = getBuildTotalPrice(build.id)
              const selected = compareBuildIds.includes(build.id)
              return (
                <div
                  key={build.id}
                  className="component-card"
                  style={{
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? 'var(--primary)' : undefined,
                  }}
                  onClick={() => toggleCompareBuild(build.id)}
                >
                  <div className="component-card-header">
                    <div>
                      <div className="component-name">
                        {build.isFavorite && '⭐ '}
                        {build.name}
                      </div>
                      <div className="component-brand">
                        {build.clientName ? `客户：${build.clientName}` : '未指定客户'}
                      </div>
                    </div>
                    <div className="component-price">¥{total.toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between align-center" style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      更新于 {new Date(build.updatedAt).toLocaleDateString('zh-CN')}
                    </div>
                    {selected ? (
                      <span className="badge badge-success">已选中</span>
                    ) : (
                      <span className="badge badge-default">点击选择</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedBuilds.length === 2 && (
        <div className="card">
          <div className="card-title">
            <span>⚖️</span> 详细对比
          </div>

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 180 }}>对比项</th>
                {selectedBuilds.map((build, i) => (
                  <th key={build.id}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {build.isFavorite && '⭐ '}
                        {build.name}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>
                        {build.clientName || '方案 ' + (i + 1)}
                      </div>
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ marginTop: 6 }}
                        onClick={() => setCurrentBuild(build.id)}
                      >
                        编辑方案
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="compare-label">💰 方案总价</td>
                {selectedBuilds.map((build, i) => {
                  const prices = selectedBuilds.map((b) => getBuildTotalPrice(b.id))
                  const bestIdx = getBetterBuildIndex(prices, false)
                  return (
                    <td
                      key={build.id}
                      className={`compare-value ${bestIdx === i ? 'better' : ''}`}
                      style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                    >
                      ¥{getBuildTotalPrice(build.id).toLocaleString()}
                      {bestIdx === i && <span style={{ fontSize: 12, marginLeft: 6 }}>👈 更低</span>}
                    </td>
                  )
                })}
              </tr>

              {SLOT_LABELS.map((slotConfig) => {
                const comps = selectedBuilds.map((build) => {
                  const slotData = getBuildComponents(build.id).find(
                    (x) => x.slot.slotId === slotConfig.slotId
                  )
                  return slotData?.component ?? null
                })
                const prices = comps.map((c) => c?.price ?? 0)
                const bestIdx = prices.every((p) => p === 0) ? -1 : getBetterBuildIndex(prices, false)
                return (
                  <tr key={slotConfig.slotId}>
                    <td className="compare-label">
                      <span style={{ marginRight: 6 }}>{CATEGORY_ICONS[slotConfig.category]}</span>
                      {slotConfig.label}
                    </td>
                    {comps.map((comp, i) => (
                      <td
                        key={i}
                        className={`compare-value ${bestIdx === i ? 'better' : ''}`}
                      >
                        {comp ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{comp.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              {comp.brand} · ¥{comp.price.toLocaleString()}
                            </div>
                            {!comp.inStock && (
                              <span className="badge badge-danger" style={{ marginTop: 4 }}>缺货</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">未选择</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}

              <tr style={{ background: 'var(--bg-darker)' }}>
                <td colSpan={3} style={{ padding: 16 }}>
                  <strong>📊 性能对比</strong>
                </td>
              </tr>

              <tr>
                <td className="compare-label">⭐ 综合性能评分</td>
                {performanceData.map((perf, i) => {
                  const bestIdx = getBetterBuildIndex(performanceData.map((p) => p.overallScore))
                  return (
                    <td key={i} className={`compare-value ${bestIdx === i ? 'better' : ''}`} style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>{perf.overallScore}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/100</span>
                      {bestIdx === i && <span style={{ marginLeft: 6 }}>👈</span>}
                    </td>
                  )
                })}
              </tr>

              <tr>
                <td className="compare-label">💼 生产力评分</td>
                {performanceData.map((perf, i) => {
                  const bestIdx = getBetterBuildIndex(performanceData.map((p) => p.productivityScore))
                  return (
                    <td key={i} className={`compare-value ${bestIdx === i ? 'better' : ''}`} style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>{perf.productivityScore}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/100</span>
                      {bestIdx === i && <span style={{ marginLeft: 6 }}>👈</span>}
                    </td>
                  )
                })}
              </tr>

              <tr>
                <td className="compare-label">⚡ 满载功耗</td>
                {performanceData.map((perf, i) => {
                  const bestIdx = getBetterBuildIndex(
                    performanceData.map((p) => p.powerConsumption.load),
                    false
                  )
                  return (
                    <td key={i} className={`compare-value ${bestIdx === i ? 'better' : ''}`} style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 700 }}>{perf.powerConsumption.load}</span>
                      <span style={{ color: 'var(--text-muted)' }}>W</span>
                      {bestIdx === i && <span style={{ marginLeft: 6 }}>👈</span>}
                    </td>
                  )
                })}
              </tr>

              <tr>
                <td className="compare-label">🎯 性能瓶颈</td>
                {performanceData.map((perf, i) => (
                  <td key={i} className="compare-value" style={{ textAlign: 'center' }}>
                    {perf.bottleneckInfo.bottleneckComponent === 'Balanced' ? (
                      <span className="badge badge-success">配置均衡</span>
                    ) : (
                      <span className="badge badge-warning">
                        {perf.bottleneckInfo.bottleneckComponent} 瓶颈 {perf.bottleneckInfo.bottleneckPercentage}%
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="compare-label">🔌 推荐电源</td>
                {performanceData.map((perf, i) => (
                  <td key={i} className="compare-value" style={{ textAlign: 'center' }}>
                    <strong>{perf.powerConsumption.recommendedPsu}W</strong>
                  </td>
                ))}
              </tr>

              <tr style={{ background: 'var(--bg-darker)' }}>
                <td colSpan={3} style={{ padding: 16 }}>
                  <strong>🎮 游戏帧率估算 (1440P)</strong>
                </td>
              </tr>

              {Object.keys(performanceData[0]?.gamingFps ?? {}).map((game) => (
                <tr key={game}>
                  <td className="compare-label">{game}</td>
                  {performanceData.map((perf, i) => {
                    const bestIdx = getBetterBuildIndex(performanceData.map((p) => p.gamingFps[game] || 0))
                    return (
                      <td
                        key={i}
                        className={`compare-value ${bestIdx === i ? 'better' : ''}`}
                        style={{ textAlign: 'center' }}
                      >
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{perf.gamingFps[game]}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> FPS</span>
                        {bestIdx === i && <span style={{ marginLeft: 6 }}>👈</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedBuilds.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚖️</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>请从上方选择 2 个方案进行对比</div>
            <div className="text-secondary">点击方案卡片即可选中或取消</div>
          </div>
        </div>
      )}

      {selectedBuilds.length === 1 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚖️</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>请再选择一个方案进行对比</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparePage
