import { useAppStore } from '@/store'
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/types'
import { useState, useMemo } from 'react'

export default function BudgetPage() {
  const currentBuild = useAppStore((state) => state.getCurrentBuild())
  const getBuildTotalPrice = useAppStore((state) => state.getBuildTotalPrice)
  const getBuildComponents = useAppStore((state) => state.getBuildComponents)
  const getBudgetStatus = useAppStore((state) => state.getBudgetStatus)
  const getBrandPreferences = useAppStore((state) => state.getBrandPreferences)
  const setBrandPreferences = useAppStore((state) => state.setBrandPreferences)
  const getBrands = useAppStore((state) => state.getBrands)
  const getNonPreferredComponentsInBuild = useAppStore((state) =>
    state.getNonPreferredComponentsInBuild
  )
  const isBrandPreferred = useAppStore((state) => state.isBrandPreferred)
  const updateBuild = useAppStore((state) => state.updateBuild)
  const getAlternativeComponents = useAppStore((state) => state.getAlternativeComponents)
  const replaceComponentInBuild = useAppStore((state) => state.replaceComponentInBuild)

  const [budgetInput, setBudgetInput] = useState('')
  const [showBrandPicker, setShowBrandPicker] = useState(false)

  const allBrands = useMemo(() => getBrands(), [getBrands])

  if (!currentBuild) {
    return (
      <div className="page-empty">
        <div className="empty-icon">💰</div>
        <h2>请先选择一个方案</h2>
        <p>在方案编辑中创建或选择一个方案后，即可在此进行预算控制</p>
      </div>
    )
  }

  const totalPrice = getBuildTotalPrice(currentBuild.id)
  const budgetLimit = currentBuild.budgetLimit ?? 0
  const budgetStatus = getBudgetStatus(currentBuild.id)
  const brandPreferences = getBrandPreferences(currentBuild.id)
  const buildComponents = getBuildComponents(currentBuild.id)
  const nonPreferredComponents = getNonPreferredComponentsInBuild(currentBuild.id)

  const priceByCategory = buildComponents.reduce(
    (acc, item) => {
      if (item.component) {
        const category = item.slot.category
        acc[category] =
          (acc[category] || 0) + item.component.price * item.slot.quantity
      }
      return acc
    },
    {} as Record<string, number>
  )

  const outOfStockItems = buildComponents.filter(
    (item): item is { slot: typeof item.slot; component: NonNullable<typeof item.component> } =>
      item.component !== null && (!item.component.inStock || item.component.stock <= 0)
  )

  const handleSetBudget = () => {
    const budget = parseFloat(budgetInput)
    if (budget > 0) {
      updateBuild(currentBuild.id, { budgetLimit: budget })
    }
  }

  const toggleBrandPreference = (brand: string) => {
    if (brandPreferences.includes(brand)) {
      setBrandPreferences(
        currentBuild.id,
        brandPreferences.filter((b) => b !== brand)
      )
    } else {
      setBrandPreferences(currentBuild.id, [...brandPreferences, brand])
    }
  }

  const handleReplaceComponent = (slotId: string, oldId: string, newId: string) => {
    replaceComponentInBuild(currentBuild.id, slotId, oldId, newId)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>💰 预算控制</h1>
          <p className="page-subtitle">
            方案: <strong>{currentBuild.name}</strong>
          </p>
        </div>
      </div>

      <div className="budget-overview">
        <div className="budget-summary">
          <div className="budget-total">
            <span className="budget-label">当前总价</span>
            <span className="budget-amount">¥{totalPrice.toLocaleString()}</span>
          </div>
          {budgetLimit > 0 && (
            <>
              <div className="budget-vs">
                <span className="budget-label">预算上限</span>
                <span className="budget-amount">¥{budgetLimit.toLocaleString()}</span>
              </div>
              <div className={`budget-result budget-${budgetStatus.status}`}>
                {budgetStatus.status === 'ok' && (
                  <>
                    ✅ 预算内，剩余 ¥{(budgetLimit - totalPrice).toLocaleString()}
                  </>
                )}
                {budgetStatus.status === 'warning' && (
                  <>
                    ⚠️ 即将超支，已使用 {budgetStatus.percentage.toFixed(1)}%
                  </>
                )}
                {budgetStatus.status === 'over' && (
                  <>
                    ❌ 已超支 ¥{budgetStatus.overrun.toLocaleString()} (
                    {(budgetStatus.percentage - 100).toFixed(1)}%)
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {budgetLimit > 0 && (
          <div className="budget-progress-container">
            <div className="budget-progress-bar">
              <div
                className={`budget-progress-fill ${budgetStatus.status}`}
                style={{ width: `${Math.min(budgetStatus.percentage, 120)}%` }}
              />
            </div>
            <div className="budget-progress-labels">
              <span>¥0</span>
              <span>¥{(budgetLimit / 2).toLocaleString()}</span>
              <span>¥{budgetLimit.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <h3>🎯 预算设置</h3>
          <div className="budget-input-group">
            <input
              type="number"
              className="input"
              placeholder="输入预算上限"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSetBudget}>
              设置预算
            </button>
            {budgetLimit > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  updateBuild(currentBuild.id, { budgetLimit: undefined })
                  setBudgetInput('')
                }}
              >
                清除
              </button>
            )}
          </div>
          {budgetLimit > 0 && (
            <p className="setting-hint">
              当前预算上限: <strong>¥{budgetLimit.toLocaleString()}</strong>
            </p>
          )}
        </div>

        <div className="setting-card">
          <h3>🏷️ 品牌偏好</h3>
          {brandPreferences.length > 0 ? (
            <div className="brand-tags">
              {brandPreferences.map((brand) => (
                <span key={brand} className="brand-tag" onClick={() => toggleBrandPreference(brand)}>
                  {brand} ×
                </span>
              ))}
            </div>
          ) : (
            <p className="setting-hint">未设置品牌偏好，所有品牌一视同仁</p>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => setShowBrandPicker(!showBrandPicker)}
          >
            {showBrandPicker ? '收起品牌选择' : '设置偏好品牌'}
          </button>
          {showBrandPicker && (
            <div className="brand-picker">
              <div className="brand-grid">
                {allBrands.map((brand) => (
                  <label
                    key={brand}
                    className={`brand-checkbox ${brandPreferences.includes(brand) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={brandPreferences.includes(brand)}
                      onChange={() => toggleBrandPreference(brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="budget-breakdown">
        <h3>📊 预算分类明细</h3>
        <div className="category-breakdown">
          {Object.entries(priceByCategory).map(([category, price]) => {
            const cat = category as keyof typeof CATEGORY_LABELS
            const percentage = totalPrice > 0 ? (price / totalPrice) * 100 : 0
            return (
              <div key={category} className="category-item">
                <div className="category-header">
                  <span>
                    {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="category-amount">
                    ¥{price.toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="category-bar">
                  <div
                    className="category-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {nonPreferredComponents.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠️ 以下配件不符合品牌偏好：</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {nonPreferredComponents.map(({ slot, component }) => (
              <li key={slot.slotId}>
                {CATEGORY_ICONS[component.category]} {component.brand} {component.name}
                {brandPreferences.length > 0 && (
                  <span style={{ opacity: 0.7, marginLeft: '8px' }}>
                    (偏好品牌: {brandPreferences.join(', ')})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {outOfStockItems.length > 0 && (
        <div className="alert alert-error">
          <strong>📦 以下配件缺货，可考虑替代件：</strong>
          {outOfStockItems.map(({ slot, component }) => {
            const alternatives = getAlternativeComponents(component.id)
            return (
              <div key={slot.slotId} className="out-of-stock-item">
                <div className="oos-header">
                  <span>
                    {CATEGORY_ICONS[component.category]} {component.brand} {component.name}
                    <span className="oos-badge">缺货</span>
                  </span>
                </div>
                {alternatives.length > 0 ? (
                  <div className="alternative-list">
                    <span className="alt-label">可用替代件：</span>
                    {alternatives.map((alt) => (
                      <button
                        key={alt.id}
                        className="btn btn-sm btn-primary"
                        onClick={() => handleReplaceComponent(slot.slotId, component.id, alt.id)}
                        disabled={
                          !isBrandPreferred(currentBuild.id, alt.brand) &&
                          brandPreferences.length > 0
                        }
                      >
                        {alt.brand} {alt.name} (¥{alt.price.toLocaleString()})
                        {!isBrandPreferred(currentBuild.id, alt.brand) &&
                          brandPreferences.length > 0 && (
                            <span style={{ opacity: 0.6 }}> (非偏好)</span>
                          )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="oos-hint">暂无设置替代件，请在配件库中维护</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .budget-overview {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid var(--border-color);
        }
        .budget-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 20px;
        }
        .budget-total, .budget-vs {
          text-align: center;
        }
        .budget-label {
          display: block;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .budget-amount {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .budget-result {
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          grid-column: 1 / -1;
        }
        .budget-ok {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        .budget-warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        .budget-over {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .budget-progress-container {
          margin-top: 16px;
        }
        .budget-progress-bar {
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        .budget-progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .budget-progress-fill.ok {
          background: linear-gradient(90deg, #22c55e, #16a34a);
        }
        .budget-progress-fill.warning {
          background: linear-gradient(90deg, #f59e0b, #d97706);
        }
        .budget-progress-fill.over {
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }
        .budget-progress-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .setting-card {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color);
        }
        .setting-card h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
        }
        .budget-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .budget-input-group .input {
          flex: 1;
        }
        .setting-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 8px 0 0 0;
        }
        .brand-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .brand-tag {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .brand-tag:hover {
          background: rgba(59, 130, 246, 0.3);
        }
        .brand-picker {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }
        .brand-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }
        .brand-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .brand-checkbox:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .brand-checkbox.selected {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }
        .budget-breakdown {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid var(--border-color);
          margin-bottom: 16px;
        }
        .budget-breakdown h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
        }
        .category-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .category-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        .category-amount {
          font-weight: 600;
          color: var(--text-primary);
        }
        .category-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .category-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
        }
        .out-of-stock-item {
          background: rgba(255, 255, 255, 0.03);
          padding: 12px;
          border-radius: 6px;
          margin-top: 8px;
        }
        .oos-header {
          margin-bottom: 8px;
        }
        .oos-badge {
          background: #ef4444;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          margin-left: 8px;
        }
        .alternative-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .alt-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .oos-hint {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
