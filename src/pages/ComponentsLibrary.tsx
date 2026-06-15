import { useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { CATEGORY_LABELS, ComponentCategory, CATEGORY_ORDER } from '@/types'
import type { Component } from '@/types'
import ComponentModal from '@/components/ComponentModal'

function ComponentsLibrary() {
  const components = useAppStore((s) => s.components)
  const addComponent = useAppStore((s) => s.addComponent)
  const updateComponent = useAppStore((s) => s.updateComponent)
  const deleteComponent = useAppStore((s) => s.deleteComponent)
  const getBrands = useAppStore((s) => s.getBrands)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const filterCategory = useAppStore((s) => s.filterCategory)
  const setFilterCategory = useAppStore((s) => s.setFilterCategory)
  const filterBrand = useAppStore((s) => s.filterBrand)
  const setFilterBrand = useAppStore((s) => s.setFilterBrand)
  const filterInStockOnly = useAppStore((s) => s.filterInStockOnly)
  const setFilterInStockOnly = useAppStore((s) => s.setFilterInStockOnly)

  const [showModal, setShowModal] = useState(false)
  const [editingComponent, setEditingComponent] = useState<Component | null>(null)

  const brands = getBrands()

  const filteredComponents = useMemo(() => {
    return components.filter((c) => {
      if (filterCategory !== 'all' && c.category !== filterCategory) return false
      if (filterBrand && c.brand !== filterBrand) return false
      if (filterInStockOnly && !c.inStock) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q) ||
          c.model.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [components, filterCategory, filterBrand, filterInStockOnly, searchQuery])

  const handleAdd = () => {
    setEditingComponent(null)
    setShowModal(true)
  }

  const handleEdit = (c: Component) => {
    setEditingComponent(c)
    setShowModal(true)
  }

  const handleDelete = (c: Component) => {
    if (confirm(`确定删除配件"${c.name}"吗？`)) {
      deleteComponent(c.id)
    }
  }

  const handleSave = (data: any) => {
    if (editingComponent) {
      updateComponent(editingComponent.id, data)
    } else {
      addComponent(data)
    }
    setShowModal(false)
    setEditingComponent(null)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">配件库</h1>
          <div className="page-subtitle">管理所有电脑配件，共 {components.length} 个配件</div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleAdd}>
          ＋ 添加配件
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            className="input"
            placeholder="搜索配件名称、品牌、型号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-tags">
          <span
            className={`filter-tag ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            全部
          </span>
          {CATEGORY_ORDER.map((cat) => (
            <span
              key={cat}
              className={`filter-tag ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </span>
          ))}
        </div>
        <select
          className="select"
          style={{ width: 160 }}
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
        >
          <option value="">全部品牌</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filterInStockOnly}
            onChange={(e) => setFilterInStockOnly(e.target.checked)}
          />
          仅显示现货
        </label>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>类别</th>
              <th>配件名称</th>
              <th>品牌</th>
              <th>型号</th>
              <th style={{ textAlign: 'right' }}>价格</th>
              <th style={{ textAlign: 'center' }}>库存</th>
              <th style={{ textAlign: 'center' }}>状态</th>
              <th style={{ width: 120, textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredComponents.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div>没有找到匹配的配件</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredComponents.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="badge badge-default">{CATEGORY_LABELS[c.category]}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                  </td>
                  <td>{c.brand}</td>
                  <td className="text-muted">{c.model}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary-light)' }}>
                    ¥{c.price.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>{c.stock}</td>
                  <td style={{ textAlign: 'center' }}>
                    {c.inStock ? (
                      <span className="badge badge-success">有货</span>
                    ) : (
                      <span className="badge badge-danger">缺货</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-row" style={{ justifyContent: 'center' }}>
                      <button className="icon-btn" title="编辑" onClick={() => handleEdit(c)}>
                        ✏️
                      </button>
                      <button
                        className="icon-btn danger"
                        title="删除"
                        onClick={() => handleDelete(c)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ComponentModal
          component={editingComponent}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingComponent(null)
          }}
        />
      )}
    </div>
  )
}

export default ComponentsLibrary
