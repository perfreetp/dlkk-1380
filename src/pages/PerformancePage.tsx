import { useAppStore } from '@/store'
import { CATEGORY_LABELS } from '@/types'

function PerformancePage() {
  const currentBuild = useAppStore((s) => s.getCurrentBuild())
  const performance = useAppStore((s) => s.performanceEstimate)
  const getBuildComponents = useAppStore((s) => s.getBuildComponents)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)

  if (!currentBuild) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>请先选择一个装机方案</div>
        <div className="text-secondary">从左侧列表选择方案以查看性能估算</div>
      </div>
    )
  }

  const buildComponents = getBuildComponents(currentBuild.id)
  const totalPrice = getBuildTotalPrice(currentBuild.id)
  const filled = buildComponents.filter((x) => x.component).length

  if (!performance) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>数据不足</div>
        <div className="text-secondary">请在方案编辑器中选择足够的配件</div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--secondary)'
    if (score >= 70) return 'var(--info)'
    if (score >= 50) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">性能估算</h1>
          <div className="page-subtitle">
            方案：{currentBuild.name} · 已选 {filled}/11 个配件 · 总价 ¥{totalPrice.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">综合性能评分</div>
          <div className="stat-value" style={{ color: getScoreColor(performance.overallScore) }}>
            {performance.overallScore}
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div
              className="progress-fill primary"
              style={{ width: `${performance.overallScore}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">生产力评分</div>
          <div className="stat-value" style={{ color: getScoreColor(performance.productivityScore) }}>
            {performance.productivityScore}
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div className="progress-bar" style={{ marginTop: 10 }}>
            <div
              className="progress-fill info"
              style={{ width: `${performance.productivityScore}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">满载功耗</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {performance.powerConsumption.load}
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>W</span>
          </div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
            待机功耗：{performance.powerConsumption.idle}W
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">推荐电源</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>
            {performance.powerConsumption.recommendedPsu}
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>W</span>
          </div>
          {performance.powerConsumption.psuHeadroom > 0 && (
            <div
              className="text-muted"
              style={{
                fontSize: 12,
                marginTop: 10,
                color:
                  performance.powerConsumption.psuHeadroom >= 30
                    ? 'var(--secondary)'
                    : performance.powerConsumption.psuHeadroom >= 15
                    ? 'var(--warning)'
                    : 'var(--danger)',
              }}
            >
              当前电源余量：{performance.powerConsumption.psuHeadroom}%
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">
            <span>🎮</span> 游戏帧率估算
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            * 基于当前配置估算的 1440P 分辨率游戏帧率，实际性能可能因驱动和游戏优化而异
          </div>
          <div className="fps-grid">
            {Object.entries(performance.gamingFps).map(([game, fps]) => (
              <div key={game} className="fps-card">
                <div className="fps-game">{game}</div>
                <div className="fps-value">
                  {fps}
                  <span className="fps-unit"> FPS</span>
                </div>
                <div className="progress-bar" style={{ marginTop: 6 }}>
                  <div
                    className={`progress-fill ${fps >= 120 ? 'success' : fps >= 60 ? 'info' : fps >= 30 ? 'warning' : 'danger'}`}
                    style={{ width: `${Math.min(100, (fps / 240) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">
              <span>⚖️</span> 性能瓶颈分析
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="metric-bar">
                <span className="metric-label">CPU 利用率</span>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill"
                    style={{
                      width: `${performance.bottleneckInfo.cpuUtilization}%`,
                      background:
                        performance.bottleneckInfo.bottleneckComponent === 'CPU'
                          ? 'var(--warning)'
                          : 'var(--info)',
                    }}
                  />
                </div>
                <span className="metric-value">{performance.bottleneckInfo.cpuUtilization}%</span>
              </div>
              <div className="metric-bar">
                <span className="metric-label">GPU 利用率</span>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill"
                    style={{
                      width: `${performance.bottleneckInfo.gpuUtilization}%`,
                      background:
                        performance.bottleneckInfo.bottleneckComponent === 'GPU'
                          ? 'var(--warning)'
                          : 'var(--secondary)',
                    }}
                  />
                </div>
                <span className="metric-value">{performance.bottleneckInfo.gpuUtilization}%</span>
              </div>
            </div>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background:
                  performance.bottleneckInfo.bottleneckComponent === 'Balanced'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {performance.bottleneckInfo.bottleneckComponent === 'Balanced'
                  ? '✅ 配置均衡'
                  : performance.bottleneckInfo.bottleneckComponent === 'CPU'
                  ? '⚠️ CPU 瓶颈'
                  : '⚠️ GPU 瓶颈'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {performance.bottleneckInfo.bottleneckComponent === 'Balanced'
                  ? 'CPU 和 GPU 搭配均衡，能充分发挥各自性能'
                  : `预计存在约 ${performance.bottleneckInfo.bottleneckPercentage}% 的性能损失，建议升级${performance.bottleneckInfo.bottleneckComponent}以获得更好体验`}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>💼</span> 生产力应用评分
            </div>
            <div className="grid grid-2 gap-3">
              <div style={{ padding: 10, background: 'var(--bg-darker)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  视频渲染 (Premiere/达芬奇)
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: getScoreColor(performance.productivityScore) }}>
                  {Math.round(performance.productivityScore * 0.95)}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <div style={{ padding: 10, background: 'var(--bg-darker)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  3D 建模 (Blender/3ds Max)
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: getScoreColor(Math.round(performance.productivityScore * 0.9)) }}>
                  {Math.round(performance.productivityScore * 0.9)}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <div style={{ padding: 10, background: 'var(--bg-darker)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  代码编译 (VS/IDEA)
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: getScoreColor(Math.round(performance.productivityScore * 1.05)) }}>
                  {Math.min(100, Math.round(performance.productivityScore * 1.05))}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <div style={{ padding: 10, background: 'var(--bg-darker)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  AI/机器学习
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: getScoreColor(Math.round(performance.productivityScore * 0.85)) }}>
                  {Math.round(performance.productivityScore * 0.85)}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformancePage
