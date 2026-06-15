import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

interface DraggableSlotProps {
  slotId: string
  category: ComponentCategory
  label: string
  required?: boolean
  component: Component | null
  slotData: any
  onRemove: () => void
  onPick: () => void
  buildId: string
  alternatives: Component[]
  isBrandPreferred: boolean
}

function DraggableSlot({
  slotId,
  category,
  label,
  required,
  component,
  onRemove,
  onPick,
  buildId,
  alternatives,
  isBrandPreferred,
}: DraggableSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slotId, data: { category, componentId: component?.id } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [showAlternatives, setShowAlternatives] = useState(false)
  const store = useAppStore.getState()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-3 align-center"
    >
      <div style={{ width: 36, textAlign: 'center', fontSize: 20 }}>
        {CATEGORY_ICONS[category]}
      </div>
      <div style={{ width: 90, fontSize: 13, color: 'var(--text-secondary)' }}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </div>
      <div className="flex-1">
        {component ? (
          <div className="slot-filled">
            <div className="slot-header">
              <div
                style={{ cursor: 'grab' }}
                {...attributes}
                {...listeners}
                title="可拖拽到其他同类别槽位交换"
              >
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>⋮⋮</span>
                  {component.name}
                  {!isBrandPreferred && (
                    <span
                      className="badge badge-warning"
                      style={{ fontSize: 10, padding: '1px 4px' }}
                      title="非偏好品牌"
                    >
                      非偏好
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {component.brand} · {component.model}
                </div>
              </div>
              <div className="flex align-center gap-2">
                <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                  ¥{component.price.toLocaleString()}
                </div>
                {!component.inStock && (
                  <>
                    <span className="badge badge-danger">缺货</span>
                    {alternatives.length > 0 && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setShowAlternatives(!showAlternatives)}
                      >
                        查看替代件 ({alternatives.length})
                      </button>
                    )}
                  </>
                )}
                {showAlternatives && alternatives.length > 0 && (
                  <div className="alternatives-dropdown">
                    <div className="dropdown-header">选择替代件：</div>
                    {alternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="alternative-item"
                        onClick={() => {
                          store.replaceComponentInBuild(buildId, slotId, component.id, alt.id, 'out_of_stock')
                          setShowAlternatives(false)
                        }}
                      >
                        <div>
                          <div className="alt-name">{alt.name}</div>
                          <div className="alt-brand">
                            {alt.brand} · ¥{alt.price.toLocaleString()}
                            {!store.isBrandPreferred(buildId, alt.brand) && (
                              <span style={{ opacity: 0.6, marginLeft: 4 }}>(非偏好)</span>
                            )}
                          </div>
                        </div>
                        {alt.inStock ? (
                          <span className="badge badge-success">有货</span>
                        ) : (
                          <span className="badge badge-danger">缺货</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="icon-btn danger"
                  onClick={onRemove}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="slot-empty droppable-slot"
            onClick={onPick}
            data-category={category}
            data-slot-id={slotId}
          >
            <div>
              <div style={{ fontSize: 20, marginBottom: 4 }}>＋</div>
              <div style={{ fontSize: 12 }}>点击或拖拽{CATEGORY_LABELS[category]}到此处</div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .alternatives-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px;
          min-width: 280px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          z-index: 100;
          margin-top: 4px;
        }
        .dropdown-header {
          font-size: 12px;
          color: var(--text-secondary);
          padding: 4px 8px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 4px;
        }
        .alternative-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .alternative-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .alt-name {
          font-size: 13px;
          font-weight: 500;
        }
        .alt-brand {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .slot-filled {
          position: relative;
        }
        .droppable-slot.drag-over {
          border-color: var(--accent-color);
          background: rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  )
}

interface DraggableComponentItemProps {
  component: Component
  isPreferred: boolean
}

function DraggableComponentItem({ component, isPreferred }: DraggableComponentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `comp-${component.id}`, data: { type: 'component', component } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="component-item-draggable"
      {...attributes}
      {...listeners}
    >
      <div className="component-item-header">
        <span className="component-icon">{CATEGORY_ICONS[component.category]}</span>
        <div className="component-item-info">
          <div className="component-item-name">
            {component.name}
            {!isPreferred && (
              <span
                className="badge badge-warning"
                style={{ fontSize: 9, padding: '1px 3px', marginLeft: 4 }}
              >
                非偏好
              </span>
            )}
          </div>
          <div className="component-item-brand">{component.brand}</div>
        </div>
      </div>
      <div className="component-item-price">¥{component.price.toLocaleString()}</div>
      {!component.inStock && <span className="oos-small">缺货</span>}
      <style>{`
        .component-item-draggable {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          border: 1px solid var(--border-color);
          cursor: grab;
          transition: all 0.2s;
          position: relative;
        }
        .component-item-draggable:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--accent-color);
        }
        .component-item-draggable:active {
          cursor: grabbing;
        }
        .component-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .component-icon {
          font-size: 18px;
        }
        .component-item-info {
          min-width: 0;
        }
        .component-item-name {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .component-item-brand {
          font-size: 10px;
          color: var(--text-secondary);
        }
        .component-item-price {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-light);
          margin-left: 8px;
        }
        .oos-small {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

function BuildEditor() {
  const currentBuild = useAppStore((s) => s.getCurrentBuild())
  const getBuildComponents = useAppStore((s) => s.getBuildComponents)
  const getBuildTotalPrice = useAppStore((s) => s.getBuildTotalPrice)
  const addComponentToBuild = useAppStore((s) => s.addComponentToBuild)
  const removeComponentFromBuild = useAppStore((s) => s.removeComponentFromBuild)
  const swapSlotsInBuild = useAppStore((s) => s.swapSlotsInBuild)
  const updateBuild = useAppStore((s) => s.updateBuild)
  const duplicateBuild = useAppStore((s) => s.duplicateBuild)
  const deleteBuild = useAppStore((s) => s.deleteBuild)
  const setCurrentBuild = useAppStore((s) => s.setCurrentBuild)
  const compatibilityIssues = useAppStore((s) => s.compatibilityIssues)
  const components = useAppStore((s) => s.components)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const filterCategory = useAppStore((s) => s.filterCategory)
  const filterBrand = useAppStore((s) => s.filterBrand)
  const filterInStockOnly = useAppStore((s) => s.filterInStockOnly)
  const getBrandPreferences = useAppStore((s) => s.getBrandPreferences)
  const getSortedByBrandPreference = useAppStore((s) => s.getSortedByBrandPreference)
  const getAlternativeComponents = useAppStore((s) => s.getAlternativeComponents)
  const isBrandPreferred = useAppStore((s) => s.isBrandPreferred)
  const refreshAllEstimates = useAppStore((s) => s.refreshAllEstimates)

  const [pickerSlot, setPickerSlot] = useState<{ slotId: string; category: ComponentCategory } | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [showComponentLibrary, setShowComponentLibrary] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const buildComponents = currentBuild ? getBuildComponents(currentBuild.id) : []
  const totalPrice = currentBuild ? getBuildTotalPrice(currentBuild.id) : 0
  const brandPreferences = currentBuild ? getBrandPreferences(currentBuild.id) : []

  const errorIssues = compatibilityIssues.filter((i) => i.severity === 'error')
  const warningIssues = compatibilityIssues.filter((i) => i.severity === 'warning')
  const infoIssues = compatibilityIssues.filter((i) => i.severity === 'info')

  const selectedIds = useMemo(
    () => new Set(buildComponents.filter((x) => x.component).map((x) => x.component!.id)),
    [buildComponents]
  )

  const filteredComponents = useMemo(() => {
    let result = [...components]
    if (filterCategory !== 'all') {
      result = result.filter((c) => c.category === filterCategory)
    }
    if (filterBrand) {
      result = result.filter((c) => c.brand === filterBrand)
    }
    if (filterInStockOnly) {
      result = result.filter((c) => c.inStock && c.stock > 0)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q)
      )
    }
    if (currentBuild) {
      result = getSortedByBrandPreference(result, currentBuild.id)
    }
    return result
  }, [components, filterCategory, filterBrand, filterInStockOnly, searchQuery, currentBuild, getSortedByBrandPreference])

  const handlePick = (component: Component) => {
    if (currentBuild && pickerSlot) {
      addComponentToBuild(currentBuild.id, pickerSlot.slotId, component.id)
    }
    setPickerSlot(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event

    if (!over || !currentBuild) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId.startsWith('comp-')) {
      const component = active.data.current?.component as Component
      const targetSlot = SLOT_CONFIG.find((s) => s.slotId === overId)
      if (targetSlot && targetSlot.category === component.category) {
        addComponentToBuild(currentBuild.id, targetSlot.slotId, component.id)
      }
      return
    }

    const activeSlot = SLOT_CONFIG.find((s) => s.slotId === activeId)
    const overSlot = SLOT_CONFIG.find((s) => s.slotId === overId)

    if (activeSlot && overSlot && activeSlot.category === overSlot.category) {
      swapSlotsInBuild(currentBuild.id, activeSlot.slotId, overSlot.slotId)
    }
  }

  const getActiveDragComponent = () => {
    if (!activeDragId) return null
    if (activeDragId.startsWith('comp-')) {
      const compId = activeDragId.replace('comp-', '')
      return components.find((c) => c.id === compId) || null
    }
    const slotData = buildComponents.find((b) => b.slot.slotId === activeDragId)
    return slotData?.component || null
  }

  const activeDragComponent = getActiveDragComponent()

  if (!currentBuild) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔧</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>请选择或创建一个装机方案</div>
        <div className="text-secondary">从左侧列表选择方案，或点击顶部"新建方案"按钮</div>
      </div>
    )
  }

  const slotOrder = SLOT_CONFIG.map((s) => s.slotId)
  const draggableComponentIds = filteredComponents.map((c) => `comp-${c.id}`)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              {brandPreferences.length > 0 && (
                <span style={{ marginLeft: 8 }}>
                  · 品牌偏好: <strong>{brandPreferences.join(', ')}</strong>
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 align-center">
            <div className="price-large">¥{totalPrice.toLocaleString()}</div>
            {currentBuild.budgetLimit && (
              <div
                className={`text-sm ${totalPrice > currentBuild.budgetLimit ? 'text-danger' : 'text-success'}`}
              >
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
              className={`btn ${showComponentLibrary ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowComponentLibrary(!showComponentLibrary)}
            >
              📦 {showComponentLibrary ? '收起配件库' : '显示配件库'}
            </button>
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
              title="复制整个方案为新方案，可快速修改几个配件"
            >
              📋 复制方案
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => refreshAllEstimates(currentBuild.id)}
            >
              🔄 刷新
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

        <div className="grid" style={{ gridTemplateColumns: showComponentLibrary ? '280px 1fr 380px' : '1fr 380px' }}>
          {showComponentLibrary && (
            <div className="card" style={{ maxHeight: 'calc(100vh - 180px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="card-title">
                <span>📦</span> 配件库 (拖拽使用)
              </div>
              <div className="filter-bar" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  共 {filteredComponents.length} 个配件，可拖拽到槽位
                </div>
              </div>
              <SortableContext
                items={draggableComponentIds}
                strategy={verticalListSortingStrategy}
                disabled
              >
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {filteredComponents.length === 0 ? (
                    <div className="empty-text">暂无匹配的配件</div>
                  ) : (
                    filteredComponents.map((component) => (
                      <DraggableComponentItem
                        key={`comp-${component.id}`}
                        component={component}
                        isPreferred={isBrandPreferred(currentBuild.id, component.brand)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          )}

          <div>
            <div className="card">
              <div className="card-title">
                <span>🧩</span> 配置清单
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                  提示：槽位间可拖拽交换，也可从左侧配件库拖拽
                </span>
              </div>
              <SortableContext items={slotOrder} strategy={verticalListSortingStrategy}>
                <div className="grid gap-3">
                  {SLOT_CONFIG.map((slotConfig) => {
                    const slotData = buildComponents.find((x) => x.slot.slotId === slotConfig.slotId)
                    const comp = slotData?.component
                    const alternatives = comp ? getAlternativeComponents(comp.id) : []
                    return (
                      <DraggableSlot
                        key={slotConfig.slotId}
                        slotId={slotConfig.slotId}
                        category={slotConfig.category}
                        label={slotConfig.label}
                        required={slotConfig.required}
                        component={comp || null}
                        slotData={slotData}
                        onRemove={() =>
                          removeComponentFromBuild(currentBuild.id, slotConfig.slotId)
                        }
                        onPick={() =>
                          setPickerSlot({ slotId: slotConfig.slotId, category: slotConfig.category })
                        }
                        buildId={currentBuild.id}
                        alternatives={alternatives}
                        isBrandPreferred={comp ? isBrandPreferred(currentBuild.id, comp.brand) : true}
                      />
                    )
                  })}
                </div>
              </SortableContext>
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
      </div>

      <DragOverlay>
        {activeDragComponent ? (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--card-bg)',
              border: '2px solid var(--accent-color)',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              opacity: 0.9,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {CATEGORY_ICONS[activeDragComponent.category]} {activeDragComponent.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {activeDragComponent.brand} · ¥{activeDragComponent.price.toLocaleString()}
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {pickerSlot && (
        <ComponentPicker
          category={pickerSlot.category}
          excludeIds={selectedIds}
          onSelect={handlePick}
          onClose={() => setPickerSlot(null)}
          buildId={currentBuild.id}
        />
      )}
    </DndContext>
  )
}

export default BuildEditor
