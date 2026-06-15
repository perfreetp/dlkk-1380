import { useMemo, useState } from 'react'
import { useAppStore } from '@/store'
import type { Component, ComponentCategory } from '@/types'
import { CATEGORY_LABELS } from '@/types'

interface Props {
  category: ComponentCategory
  excludeIds: Set<string>
  onSelect: (component: Component) => void
  onClose: () => void
  buildId?: string
}

function ComponentPicker({ category, excludeIds, onSelect, onClose, buildId }: Props) {
  const components = useAppStore((s) => s.components)
  const getSortedByBrandPreference = useAppStore((s) => s.getSortedByBrandPreference)
  const getBrandPreferences = useAppStore((s) => s.getBrandPreferences)
  const [search, setSearch] = useState('')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [brandsFilter, setBrandsFilter] = useState('')

  const brandPreferences = buildId ? getBrandPreferences(buildId) : []

  const list = useMemo(() => {
    let arr = components.filter(
      (c) => c.category === category && !excludeIds.has(c.id)
    )
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q)
      )
    }
    if (onlyInStock) {
      arr = arr.filter((c) => c.inStock)
    }
    if (brandsFilter) {
      arr = arr.filter((c) => c.brand === brandsFilter)
    }
    
    if (buildId && brandPreferences.length > 0) {
      arr = getSortedByBrandPreference(arr, buildId)
    } else {
      arr = arr.sort((a, b) => b.price - a.price)
    }
    
    return arr
  }, [components, category, excludeIds, search, onlyInStock, brandsFilter, buildId, brandPreferences.length, getSortedByBrandPreference])

  const availableBrands = useMemo(() => {
    return Array.from(new Set(components.filter((c) => c.category === category).map((c) => c.brand))).sort()
  }, [components, category])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 800, width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            选择 {CATEGORY_LABELS[category]}
            {brandPreferences.length > 0 && (
              <span className="badge badge-info" style={{ marginLeft: 8, fontSize: 11 }}>
                偏好：{brandPreferences.join(' / ')}
              </span>
            )}
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="flex gap-2" style={{ marginBottom: 16 }}>
            <div className="search-box flex-1">
              <span className="search-icon">🔍</span>
              <input
                className="input"
                placeholder={`搜索${CATEGORY_LABELS[category]}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <select
              className="select"
              style={{ width: 140 }}
              value={brandsFilter}
              onChange={(e) => setBrandsFilter(e.target.value)}
            >
              <option value="">全部品牌</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <label className="checkbox" style={{ padding: '0 8px' }}>
              <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
              现货
            </label>
          </div>

          {list.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div>没有找到符合条件的配件</div>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto', marginRight: -8, paddingRight: 8 }}>
              <div className="grid grid-2 gap-3">
                {list.map((c) => (
                  <div
                    key={c.id}
                    className="component-card"
                    onClick={() => onSelect(c)}
                  >
                    <div className="component-card-header">
                      <div>
                        <div className="component-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {c.name}
                          {brandPreferences.length > 0 && !brandPreferences.includes(c.brand) && (
                            <span className="badge badge-warning" style={{ fontSize: 10, padding: '1px 4px' }}>
                              非偏好
                            </span>
                          )}
                          {brandPreferences.length > 0 && brandPreferences.includes(c.brand) && (
                            <span className="badge badge-success" style={{ fontSize: 10, padding: '1px 4px' }}>
                              推荐
                            </span>
                          )}
                        </div>
                        <div className="component-brand">
                          {c.brand} · {c.model}
                        </div>
                      </div>
                      <div className="component-price">¥{c.price.toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2" style={{ marginTop: 8 }}>
                      {c.inStock ? (
                        <span className="badge badge-success">现货 {c.stock}</span>
                      ) : (
                        <span className="badge badge-danger">缺货</span>
                      )}
                    </div>
                    <div className="component-specs">
                      {Object.entries(c.specs)
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <span key={k}>
                            {k}: {v}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComponentPicker
