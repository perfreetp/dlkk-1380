import { useAppStore } from '@/store'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types'
import { useState } from 'react'

export default function CompatibilityPage() {
  const currentBuild = useAppStore((state) => state.getCurrentBuild())
  const issues = useAppStore((state) => state.compatibilityIssues)
  const getComponentById = useAppStore((state) => state.getComponentById)
  const refreshAllEstimates = useAppStore((state) => state.refreshAllEstimates)
  const buildComponents = useAppStore((state) =>
    currentBuild ? state.getBuildComponents(currentBuild.id) : []
  )
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all')

  if (!currentBuild) {
    return (
      <div className="page-empty">
        <div className="empty-icon">⚠️</div>
        <h2>请先选择一个方案</h2>
        <p>在方案编辑中创建或选择一个方案后，即可在此查看兼容性检查结果</p>
      </div>
    )
  }

  const filteredIssues =
    filterSeverity === 'all'
      ? issues
      : issues.filter((issue) => issue.severity === filterSeverity)

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const infoCount = issues.filter((i) => i.severity === 'info').length

  const missingComponents = buildComponents.filter((item) => item.component === null)

  const incompleteSpecs = buildComponents
    .filter(
      (item): item is { slot: typeof item.slot; component: NonNullable<typeof item.component> } =>
        item.component !== null
    )
    .filter(({ component }) => {
      if (component.category === 'cpu') {
        return !component.socket || !component.tdp || component.tdp <= 0
      }
      if (component.category === 'motherboard') {
        return !component.socket || !component.formFactor || !component.memoryType
      }
      if (component.category === 'gpu') {
        return !component.tdp || component.tdp <= 0 || !component.length
      }
      if (component.category === 'psu') {
        return !component.wattage || component.wattage <= 0
      }
      if (component.category === 'case') {
        return !component.formFactor || component.formFactor.length === 0
      }
      if (component.category === 'cooler') {
        return !component.tdpRating || component.tdpRating <= 0 || !component.sockets?.length
      }
      return false
    })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>🔍 兼容性检查</h1>
          <p className="page-subtitle">
            方案: <strong>{currentBuild.name}</strong> | 共检查到{' '}
            <strong>{issues.length}</strong> 个问题
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => refreshAllEstimates(currentBuild.id)}
        >
          🔄 重新检查
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className={`stat-card ${errorCount > 0 ? 'stat-error' : ''}`}>
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{errorCount}</div>
            <div className="stat-label">严重错误</div>
          </div>
        </div>
        <div className={`stat-card ${warningCount > 0 ? 'stat-warning' : ''}`}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{warningCount}</div>
            <div className="stat-label">警告</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">ℹ️</div>
          <div className="stat-content">
            <div className="stat-value">{infoCount}</div>
            <div className="stat-label">提示</div>
          </div>
        </div>
        <div className={`stat-card ${missingComponents.length > 0 ? 'stat-warning' : ''}`}>
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{missingComponents.length}</div>
            <div className="stat-label">空缺槽位</div>
          </div>
        </div>
      </div>

      {incompleteSpecs.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
          <strong>⚠️ 以下配件规格不完整，可能导致检查不准确：</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {incompleteSpecs.map(({ slot, component }) => (
              <li key={slot.slotId}>
                {CATEGORY_ICONS[component.category]} {CATEGORY_LABELS[component.category]}:{' '}
                <strong>{component.name}</strong>
                {component.category === 'cpu' &&
                  (!component.socket ? ' 缺少接口规格' : component.tdp <= 0 ? ' 缺少功耗数据' : '')}
                {component.category === 'motherboard' &&
                  (!component.socket
                    ? ' 缺少接口规格'
                    : !component.formFactor
                      ? ' 缺少板型尺寸'
                      : ' 缺少内存代数')}
                {component.category === 'gpu' &&
                  (component.tdp <= 0 ? ' 缺少功耗数据' : ' 缺少长度尺寸')}
                {component.category === 'psu' && ' 缺少额定功率'}
                {component.category === 'case' && ' 缺少支持板型尺寸'}
                {component.category === 'cooler' &&
                  (component.tdpRating <= 0 ? ' 缺少散热能力' : ' 缺少支持接口')}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: '8px', fontSize: '13px', opacity: 0.8 }}>
            建议在配件库中完善这些配件的规格信息，以获得更准确的兼容性检查结果。
          </p>
        </div>
      )}

      <div className="filter-bar" style={{ marginBottom: '16px' }}>
        <span>筛选：</span>
        {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
          <button
            key={sev}
            className={`btn ${filterSeverity === sev ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterSeverity(sev)}
          >
            {sev === 'all'
              ? `全部 (${issues.length})`
              : sev === 'error'
                ? `错误 (${errorCount})`
                : sev === 'warning'
                  ? `警告 (${warningCount})`
                  : `提示 (${infoCount})`}
          </button>
        ))}
      </div>

      {filteredIssues.length === 0 ? (
        <div className="page-empty">
          <div className="empty-icon">✅</div>
          <h2>兼容性检查通过！</h2>
          <p>当前方案未发现兼容性问题</p>
        </div>
      ) : (
        <div className="issues-list">
          {filteredIssues.map((issue, index) => (
            <div
              key={index}
              className={`issue-card issue-${issue.severity}`}
            >
              <div className="issue-header">
                <span className="issue-icon">
                  {issue.severity === 'error'
                    ? '❌'
                    : issue.severity === 'warning'
                      ? '⚠️'
                      : 'ℹ️'}
                </span>
                <span className="issue-severity">
                  {issue.severity === 'error'
                    ? '严重错误'
                    : issue.severity === 'warning'
                      ? '警告'
                      : '提示'}
                </span>
                <span className="issue-category">
                  {issue.category === 'general'
                    ? '综合'
                    : `${CATEGORY_ICONS[issue.category]} ${CATEGORY_LABELS[issue.category]}`}
                </span>
              </div>
              <div className="issue-body">
                <p className="issue-message">{issue.message}</p>
                {issue.componentName && (
                  <p className="issue-component">
                    相关配件：<strong>{issue.componentName}</strong>
                    {issue.componentId && getComponentById(issue.componentId) && (
                      <span style={{ opacity: 0.7, marginLeft: '8px' }}>
                        ({getComponentById(issue.componentId)?.brand})
                      </span>
                    )}
                  </p>
                )}
                {issue.suggestion && (
                  <div className="issue-suggestion">
                    <strong>💡 建议：</strong>
                    {issue.suggestion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .issue-card {
          background: var(--card-bg);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .issue-error {
          border-left: 4px solid #ef4444;
        }
        .issue-warning {
          border-left: 4px solid #f59e0b;
        }
        .issue-info {
          border-left: 4px solid #3b82f6;
        }
        .issue-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-color);
        }
        .issue-icon {
          font-size: 18px;
        }
        .issue-severity {
          font-weight: 600;
          color: var(--text-primary);
        }
        .issue-error .issue-severity {
          color: #ef4444;
        }
        .issue-warning .issue-severity {
          color: #f59e0b;
        }
        .issue-info .issue-severity {
          color: #3b82f6;
        }
        .issue-category {
          margin-left: auto;
          font-size: 13px;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .issue-body {
          padding: 16px;
        }
        .issue-message {
          font-size: 14px;
          margin: 0 0 8px 0;
          line-height: 1.6;
        }
        .issue-component {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 8px 0;
        }
        .issue-suggestion {
          font-size: 13px;
          background: rgba(59, 130, 246, 0.1);
          padding: 8px 12px;
          border-radius: 6px;
          line-height: 1.6;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--card-bg);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        .stat-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
        .stat-warning {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }
        .stat-icon {
          font-size: 28px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .stat-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}
