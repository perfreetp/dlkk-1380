import { useState } from 'react'
import type { Component, ComponentCategory } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/types'

interface Props {
  component: Component | null
  onSave: (data: any) => void
  onClose: () => void
}

function ComponentModal({ component, onSave, onClose }: Props) {
  const [category, setCategory] = useState<ComponentCategory>(component?.category ?? 'cpu')
  const [formData, setFormData] = useState<any>(
    component ?? {
      name: '',
      brand: '',
      model: '',
      price: 0,
      stock: 0,
      inStock: true,
      alternativeIds: [],
      specs: {},
      notes: '',
    }
  )

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      category,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div className="modal-title">{component ? '编辑配件' : '添加配件'}</div>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="grid grid-2">
              <div className="form-group">
                <label className="label">配件类别</label>
                <select
                  className="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">配件名称 *</label>
                <input
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="如：Intel Core i9-14900K"
                />
              </div>
              <div className="form-group">
                <label className="label">品牌 *</label>
                <input
                  className="input"
                  required
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="如：Intel"
                />
              </div>
              <div className="form-group">
                <label className="label">型号</label>
                <input
                  className="input"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="如：BX8071514900K"
                />
              </div>
              <div className="form-group">
                <label className="label">价格 (¥) *</label>
                <input
                  className="input"
                  type="number"
                  required
                  min={0}
                  value={formData.price}
                  onChange={(e) => handleChange('price', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="label">库存数量</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => handleChange('inStock', e.target.checked)}
                />
                有现货
              </label>
            </div>

            <div className="form-group">
              <label className="label">备注</label>
              <textarea
                className="textarea"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="可选备注信息"
              />
            </div>

            <div style={{ padding: 12, background: 'var(--bg-darker)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                💡 提示：更多详细规格（如接口、TDP、尺寸等）将在后续版本中支持自定义字段编辑。基础配件已可正常用于方案配置。
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {component ? '保存修改' : '添加配件'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ComponentModal
