import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { CATEGORY_LABELS, CATEGORY_ICONS, ComponentCategory } from '@/types'
import type { Component } from '@/types'
import ComponentPicker from '@/components/ComponentPicker'

const SLOT_CONFIG: { slotId: string; category: ComponentCategory; label: string; required?: boolean }[] = [
  { slotId: 'cpu', category: 'cpu', label: 'CPU 处理器', required: true },
  { slotId: 'motherboard', category: 'motherboard', label: '主板', required: true },
  { slotId: 'gpu', category: 'gpu', label: '显卡' },
  { slotId: 'ram', category: 'ram', label: '内存', required: true },
  { slotId: 'storage-primary', category: 'storage', label: '主存储', required: true },
  { slotId: 'storage-secondary', category: 'storage', label: '副存储' },
  { slotId: 'psu', category: 'psu', label: '电源', required: true },
  { slotId: 'case', category: 'case', label: '机箱', required: true },
  { slotId: 'cooler', category: 'cooler', label: '散热器', required: true },
  { slotId: 'monitor', category: 'monitor', label: '显示器' },
  { slotId: 'os', category: 'os', label: '操作系统' },
]

function BuildEditor() {
  const currentBuild = useAppStore((s) => s.getCurrentBuild())
  const getBuildComponents = useAppStore((s) => s.getBuildComponents)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)
  const addComponentToBuild = useAppStore((s) => s.addComponentToBuild)
  const removeComponentFromBuild = useAppStore((s) => s.removeComponentFromBuild)
  const updateBuild = useAppStore((s) => s.updateBuild)
  const duplicateBuild = useAppStore((s) => s.duplicateBuild)
  const deleteBuild = useAppStore((s) => s.deleteBuild)
  const setCurrentBuild = useAppStore((s) => s.setCurrentBuild)
  const compatibilityIssues = useAppStore((s) => s.compatibilityIssues)
  const components = useAppStore((s) => s.components)

  const [pickerSlot, setPickerSlot] = useState<{ slotId: string; category: ComponentCategory } | null>(null)

  const buildComponents = currentBuild ? getBuildComponents(currentBuild.id) : []
  const totalPrice = currentBuild ? getBuildTotalPrice(currentBuild.id) : 0

  const errorIssues = compatibilityIssues.filter((i) => i.severity === 'error')
  const warningIssues = compatibilityIssues.filter((i) => i.severity === 'warning')
  const infoIssues = compatibilityIssues.filter((i) => i.severity === 'info')

  const selectedIds = useMemo(
    () => new Set(buildComponents.filter((x) => x.component).map((x) => x.component!.id)),
    [buildComponents]
  )

  const handlePick = (component: Component) => {
    if (currentBuild && pickerSlot) {
      addComponentToBuild(currentBuild.id, pickerSlot.slotId, component.id)
    }
    setPickerSlot(null)
  }

  if (!currentBuild) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔧</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>请选择或创建一个装机方案</div>
        <div className="text-secondary">从左侧列表选择方案，或点击顶部"新建方案"按钮</div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="flex align-center gap-3">
            <h1 className="page-title">{currentBuild.name}</h1>
            {currentBuild.isFavorite && <span style={{ fontSize: 20 }}>⭐</span>}
          </div>
          <div className="page-subtitle">
            {currentBuild.description || '配置您的电脑硬件方案'}
            {currentBuild.clientName && ` · 客户：${currentBuild.clientName}`}
          </div>
        </div>
        <div className="flex gap-2 align-center">
          <div className="price-large">¥{totalPrice.toLocaleString()}</div>
          {currentBuild.budgetLimit && (
            <div className={`text-sm ${totalPrice > currentBuild.budgetLimit ? 'text-danger' : 'text-success'}`}>
              预算: ¥{currentBuild.budgetLimit.toLocaleString()}
              <div style={{ fontSize: 12 }}>
                {totalPrice > currentBuild.budgetLimit
                  ? `超支 ¥${(totalPrice - currentBuild.budgetLimit).toLocaleString()}`
                  : `剩余 ¥${(currentBuild.budgetLimit - totalPrice).toLocaleString()}`}
              </div>
            </div>
          )}
          <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 8px' }} />
          <button
            className="btn btn-secondary"
            onClick={() => {
              const name = prompt('修改方案名称：', currentBuild.name)
              if (name) updateBuild(currentBuild.id, { name })
            }}
          >
            ✏️ 重命名
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const id = duplicateBuild(currentBuild.id)
              setCurrentBuild(id)
            }}
          >
            📋 复制
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm(`确定删除方案"${currentBuild.name}"吗？`)) {
                deleteBuild(currentBuild.id)
              }
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 380px' }}>
        <div>
          <div className="card">
            <div className="card-title">
              <span>🧩</span> 配置清单
            </div>
            <div className="grid gap-3">
              {SLOT_CONFIG.map((slotConfig) => {
                const slotData = buildComponents.find((x) => x.slot.slotId === slotConfig.slotId)
                const comp = slotData?.component
                return (
                  <div key={slotConfig.slotId} className="flex gap-3 align-center" style={{ padding: '4px 0' }}>
                    <div style={{ width: 36, textAlign: 'center', fontSize: 20 }}>
                      {CATEGORY_ICONS[slotConfig.category]}
                    </div>
                    <div style={{ width: 90, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {slotConfig.label}
                      {slotConfig.required && <span className="text-danger"> *</span>}
                    </div>
                    <div className="flex-1">
                      {comp ? (
                        <div className="slot-filled">
                          <div className="slot-header">
                            <div>
                              <div style={{ fontWeight: 600 }}>{comp.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {comp.brand} · {comp.model}
                              </div>
                            </div>
                            <div className="flex align-center gap-2">
                              <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                                ¥{comp.price.toLocaleString()}
                              </div>
                              {!comp.inStock && (
                                <span className="badge badge-danger">缺货</span>
                              )}
                              <button
                                className="icon-btn danger"
                                onClick={() =>
                                  removeComponentFromBuild(currentBuild.id, slotConfig.slotId)
                                }
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="slot-empty"
                          onClick={() =>
                            setPickerSlot({ slotId: slotConfig.slotId, category: slotConfig.category })
                          }
                        >
                          <div>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>＋</div>
                            <div style={{ fontSize: 12 }}>点击选择{CATEGORY_LABELS[slotConfig.category]}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>💰</span> 预算与偏好设置
            </div>
            <div className="grid grid-2 gap-3">
              <div className="form-group">
                <label className="label">预算上限 (¥)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="如：15000"
                  value={currentBuild.budgetLimit ?? ''}
                  onChange={(e) =>
                    updateBuild(currentBuild.id, {
                      budgetLimit: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">客户名称</label>
                <input
                  className="input"
                  placeholder="客户姓名或公司"
                  value={currentBuild.clientName ?? ''}
                  onChange={(e) => updateBuild(currentBuild.id, { clientName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">方案描述</label>
                <textarea
                  className="textarea"
                  placeholder="描述这个方案的用途和特点"
                  value={currentBuild.description ?? ''}
                  onChange={(e) => updateBuild(currentBuild.id, { description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">标签</label>
                <input
                  className="input"
                  placeholder="多个标签用逗号分隔，如：游戏, 办公, AMD"
                  value={currentBuild.tags.join(', ')}
                  onChange={(e) =>
                    updateBuild(currentBuild.id, {
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
                {currentBuild.tags.length > 0 && (
                  <div className="tags-container" style={{ marginTop: 8 }}>
                    {currentBuild.tags.map((tag, i) => (
                      <span key={i} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">
              <span>⚠️</span> 兼容性检查
              {errorIssues.length > 0 && (
                <span className="badge badge-danger">{errorIssues.length} 个严重问题</span>
              )}
              {warningIssues.length > 0 && errorIssues.length === 0 && (
                <span className="badge badge-warning">{warningIssues.length} 个警告</span>
              )}
              {errorIssues.length === 0 && warningIssues.length === 0 && buildComponents.every((x) => x.component) && (
                <span className="badge badge-success">全部兼容</span>
              )}
            </div>

            {compatibilityIssues.length === 0 ? (
              <div className="text-secondary" style={{ padding: '12px 0' }}>
                {buildComponents.filter((x) => x.component).length < 5
                  ? '请选择更多配件以进行兼容性检查...'
                  : '✅ 当前选择的配件全部兼容'}
              </div>
            ) : (
              <div>
                {errorIssues.map((issue, i) => (
                  <div key={`e-${i}`} className="issue-item error">
                    <span className="issue-icon">❌</span>
                    <div className="issue-content">
                      <div className="issue-message">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="issue-suggestion">💡 {issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
                {warningIssues.map((issue, i) => (
                  <div key={`w-${i}`} className="issue-item warning">
                    <span className="issue-icon">⚠️</span>
                    <div className="issue-content">
                      <div className="issue-message">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="issue-suggestion">💡 {issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
                {infoIssues.map((issue, i) => (
                  <div key={`i-${i}`} className="issue-item info">
                    <span className="issue-icon">ℹ️</span>
                    <div className="issue-content">
                      <div className="issue-message">{issue.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <span>📊</span> 价格汇总
            </div>
            <div style={{ marginBottom: 12 }}>
              {SLOT_CONFIG.map((slotConfig) => {
                const slotData = buildComponents.find((x) => x.slot.slotId === slotConfig.slotId)
                const comp = slotData?.component
                return (
                  <div
                    key={slotConfig.slotId}
                    className="flex justify-between"
                    style={{ padding: '6px 0', fontSize: 13 }}
                  >
                    <span className="text-secondary">{slotConfig.label}</span>
                    <span style={{ fontWeight: comp ? 500 : 400, color: comp ? undefined : 'var(--text-muted)' }}>
                      {comp ? `¥${comp.price.toLocaleString()}` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
            <div
              className="flex justify-between"
              style={{
                padding: '12px 0',
                borderTop: '1px solid var(--border)',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              <span>合计</span>
              <span style={{ color: 'var(--primary-light)' }}>¥{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {pickerSlot && (
        <ComponentPicker
          category={pickerSlot.category}
          excludeIds={selectedIds}
          onSelect={handlePick}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  )
}

export default BuildEditor
