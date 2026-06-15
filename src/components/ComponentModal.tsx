import { useState, useEffect } from 'react'
import type { Component, ComponentCategory, CPUSocket, CPUGeneration, MemoryType, MotherboardFormFactor, MotherboardChipset, GPUPcieSlot, StorageInterface, PSUFormFactor, PSUEfficiency, CoolerType } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/types'
import { useAppStore } from '@/store'

interface Props {
  component: Component | null
  onSave: (data: any) => void
  onClose: () => void
}

const CPU_SOCKETS: CPUSocket[] = ['LGA 1700', 'LGA 1200', 'AM5', 'AM4', 'LGA 2066', 'sWRX8']
const CPU_GENERATIONS: CPUGeneration[] = [
  'Intel 14th Gen',
  'Intel 13th Gen',
  'Intel 12th Gen',
  'Intel 11th Gen',
  'AMD Ryzen 7000',
  'AMD Ryzen 5000',
  'AMD Ryzen 3000',
]
const MEMORY_TYPES: MemoryType[] = ['DDR5', 'DDR4', 'DDR3']
const MOTHERBOARD_FORM_FACTORS: MotherboardFormFactor[] = ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX']
const MOTHERBOARD_CHIPSETS: MotherboardChipset[] = [
  'Z790',
  'B760',
  'H770',
  'Z690',
  'B660',
  'X670E',
  'X670',
  'B650E',
  'B650',
  'X570',
  'B550',
]
const PCIE_SLOTS: GPUPcieSlot[] = ['PCIe 5.0 x16', 'PCIe 4.0 x16', 'PCIe 3.0 x16']
const STORAGE_INTERFACES: StorageInterface[] = [
  'M.2 NVMe PCIe 5.0',
  'M.2 NVMe PCIe 4.0',
  'M.2 NVMe PCIe 3.0',
  'M.2 SATA',
  '2.5" SATA',
  '3.5" SATA',
]
const PSU_FORM_FACTORS: PSUFormFactor[] = ['ATX', 'SFX', 'SFX-L', 'TFX']
const PSU_EFFICIENCIES: PSUEfficiency[] = [
  '80+ White',
  '80+ Bronze',
  '80+ Silver',
  '80+ Gold',
  '80+ Platinum',
  '80+ Titanium',
]
const COOLER_TYPES: CoolerType[] = [
  'Air Low Profile',
  'Air Tower',
  'Air Dual Tower',
  'AIO 120mm',
  'AIO 240mm',
  'AIO 280mm',
  'AIO 360mm',
  'Custom Loop',
]

const REQUIRED_SPECS: Record<ComponentCategory, { field: string; label: string }[]> = {
  cpu: [
    { field: 'socket', label: 'CPU 接口' },
    { field: 'tdp', label: 'TDP 功耗' },
    { field: 'cores', label: '核心数' },
    { field: 'threads', label: '线程数' },
    { field: 'baseClock', label: '基础频率' },
    { field: 'boostClock', label: '睿频频率' },
  ],
  motherboard: [
    { field: 'socket', label: 'CPU 接口' },
    { field: 'formFactor', label: '板型尺寸' },
    { field: 'memoryType', label: '内存类型' },
    { field: 'maxMemory', label: '最大内存' },
    { field: 'memorySlots', label: '内存插槽数' },
  ],
  gpu: [
    { field: 'tdp', label: 'TDP 功耗' },
    { field: 'length', label: '显卡长度' },
    { field: 'pcieSlot', label: 'PCIe 插槽' },
    { field: 'memorySize', label: '显存容量' },
    { field: 'memoryType', label: '显存类型' },
  ],
  ram: [
    { field: 'memoryType', label: '内存类型' },
    { field: 'capacity', label: '单条容量' },
    { field: 'speed', label: '内存频率' },
    { field: 'modules', label: '条数' },
  ],
  storage: [
    { field: 'interface', label: '接口类型' },
    { field: 'capacity', label: '容量' },
    { field: 'type', label: '存储类型' },
    { field: 'formFactor', label: '尺寸规格' },
  ],
  psu: [
    { field: 'wattage', label: '额定功率' },
    { field: 'formFactor', label: '电源规格' },
    { field: 'efficiency', label: '认证等级' },
  ],
  case: [
    { field: 'formFactor', label: '支持板型' },
    { field: 'maxGpuLength', label: '显卡限长' },
    { field: 'maxCoolerHeight', label: '散热器限高' },
  ],
  cooler: [
    { field: 'type', label: '散热类型' },
    { field: 'tdpRating', label: '散热能力' },
    { field: 'heightOrRadiatorSize', label: '高度/冷排尺寸' },
    { field: 'supportedSockets', label: '支持接口' },
  ],
  os: [
    { field: 'edition', label: '版本' },
  ],
  monitor: [
    { field: 'size', label: '屏幕尺寸' },
    { field: 'resolution', label: '分辨率' },
    { field: 'panelType', label: '面板类型' },
  ],
}

function ComponentModal({ component, onSave, onClose }: Props) {
  const components = useAppStore((state) => state.components)
  const getAlternativeComponents = useAppStore((state) => state.getAlternativeComponents)
  const addAlternative = useAppStore((state) => state.addAlternative)
  const removeAlternative = useAppStore((state) => state.removeAlternative)

  const [category, setCategory] = useState<ComponentCategory>(component?.category ?? 'cpu')
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'alternatives'>('basic')
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

  useEffect(() => {
    if (component) {
      setCategory(component.category)
      setFormData(component)
    }
  }, [component])

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSpecChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      specs: { ...prev.specs, [key]: value },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.name.trim()) {
      alert('请填写配件名称')
      return
    }
    if (!formData.price || formData.price <= 0) {
      alert('请填写有效的配件价格')
      return
    }
    
    const missingSpecs = REQUIRED_SPECS[category].filter((spec) => {
      const value = formData[spec.field]
      return value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))
    })
    
    if (missingSpecs.length > 0) {
      const specNames = missingSpecs.map((s) => s.label).join('、')
      const confirm = window.confirm(
        `以下关键规格未填写：\n${specNames}\n\n` +
        `缺少这些规格可能导致性能估算不准确和兼容性检查失效。\n\n` +
        `点击【确定】继续保存（不推荐）\n` +
        `点击【取消】去补充规格（推荐）`
      )
      if (!confirm) {
        setActiveTab('specs')
        return
      }
    }
    
    onSave({
      ...formData,
      category,
    })
  }

  const alternativeComponents = component
    ? getAlternativeComponents(component.id)
    : []

  const availableAlternatives = components.filter(
    (c) =>
      c.category === category &&
      c.id !== component?.id &&
      !formData.alternativeIds?.includes(c.id)
  )

  const handleAddAlternative = (altId: string) => {
    if (component) {
      addAlternative(component.id, altId)
    } else {
      handleChange('alternativeIds', [...(formData.alternativeIds ?? []), altId])
    }
  }

  const handleRemoveAlternative = (altId: string) => {
    if (component) {
      removeAlternative(component.id, altId)
    } else {
      handleChange(
        'alternativeIds',
        (formData.alternativeIds ?? []).filter((id: string) => id !== altId)
      )
    }
  }

  const renderCPUSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">CPU 接口 *</label>
        <select
          className="select"
          value={formData.socket || ''}
          onChange={(e) => handleChange('socket', e.target.value)}
        >
          <option value="">请选择接口</option>
          {CPU_SOCKETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">产品世代</label>
        <select
          className="select"
          value={formData.generation || ''}
          onChange={(e) => handleChange('generation', e.target.value)}
        >
          <option value="">请选择世代</option>
          {CPU_GENERATIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">核心数</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.cores || ''}
          onChange={(e) => handleChange('cores', Number(e.target.value))}
          placeholder="如：24"
        />
      </div>
      <div className="form-group">
        <label className="label">线程数</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.threads || ''}
          onChange={(e) => handleChange('threads', Number(e.target.value))}
          placeholder="如：32"
        />
      </div>
      <div className="form-group">
        <label className="label">基础频率 (GHz)</label>
        <input
          type="number"
          step="0.1"
          className="input"
          value={formData.baseClock || ''}
          onChange={(e) => handleChange('baseClock', Number(e.target.value))}
          placeholder="如：3.2"
        />
      </div>
      <div className="form-group">
        <label className="label">睿频频率 (GHz)</label>
        <input
          type="number"
          step="0.1"
          className="input"
          value={formData.boostClock || ''}
          onChange={(e) => handleChange('boostClock', Number(e.target.value))}
          placeholder="如：6.0"
        />
      </div>
      <div className="form-group">
        <label className="label">TDP 功耗 (W) *</label>
        <input
          type="number"
          className="input"
          min={1}
          required
          value={formData.tdp || ''}
          onChange={(e) => handleChange('tdp', Number(e.target.value))}
          placeholder="如：125"
        />
      </div>
      <div className="form-group">
        <label className="label">支持内存代数 *</label>
        <div className="checkbox-group">
          {MEMORY_TYPES.map((mt) => (
            <label key={mt} className="checkbox-inline">
              <input
                type="checkbox"
                checked={formData.memoryType?.includes(mt) || false}
                onChange={(e) => {
                  const current = formData.memoryType || []
                  if (e.target.checked) {
                    handleChange('memoryType', [...current, mt])
                  } else {
                    handleChange(
                      'memoryType',
                      current.filter((m: string) => m !== mt)
                    )
                  }
                }}
              />
              {mt}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="label">内存通道数</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.memoryChannels || ''}
          onChange={(e) => handleChange('memoryChannels', Number(e.target.value))}
          placeholder="如：2"
        />
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.integratedGpu || false}
            onChange={(e) => handleChange('integratedGpu', e.target.checked)}
          />
          集成核显
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.coolerIncluded || false}
            onChange={(e) => handleChange('coolerIncluded', e.target.checked)}
          />
          附赠散热器
        </label>
      </div>
    </div>
  )

  const renderMotherboardSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">CPU 接口 *</label>
        <select
          className="select"
          value={formData.socket || ''}
          onChange={(e) => handleChange('socket', e.target.value)}
        >
          <option value="">请选择接口</option>
          {CPU_SOCKETS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">芯片组</label>
        <select
          className="select"
          value={formData.chipset || ''}
          onChange={(e) => handleChange('chipset', e.target.value)}
        >
          <option value="">请选择芯片组</option>
          {MOTHERBOARD_CHIPSETS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">主板板型 *</label>
        <select
          className="select"
          value={formData.formFactor || ''}
          onChange={(e) => handleChange('formFactor', e.target.value)}
        >
          <option value="">请选择板型</option>
          {MOTHERBOARD_FORM_FACTORS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">内存代数 *</label>
        <select
          className="select"
          value={formData.memoryType || ''}
          onChange={(e) => handleChange('memoryType', e.target.value)}
        >
          <option value="">请选择内存类型</option>
          {MEMORY_TYPES.map((mt) => (
            <option key={mt} value={mt}>
              {mt}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">内存插槽数</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.memorySlots || ''}
          onChange={(e) => handleChange('memorySlots', Number(e.target.value))}
          placeholder="如：4"
        />
      </div>
      <div className="form-group">
        <label className="label">最大内存 (GB)</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.maxMemory || ''}
          onChange={(e) => handleChange('maxMemory', Number(e.target.value))}
          placeholder="如：128"
        />
      </div>
      <div className="form-group">
        <label className="label">M.2 插槽数</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.m2Slots || ''}
          onChange={(e) => handleChange('m2Slots', Number(e.target.value))}
          placeholder="如：3"
        />
      </div>
      <div className="form-group">
        <label className="label">SATA 接口数</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.sataPorts || ''}
          onChange={(e) => handleChange('sataPorts', Number(e.target.value))}
          placeholder="如：6"
        />
      </div>
      <div className="form-group">
        <label className="label">PCIe x16 插槽数</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.pcieX16Slots || ''}
          onChange={(e) => handleChange('pcieX16Slots', Number(e.target.value))}
          placeholder="如：1"
        />
      </div>
      <div className="form-group">
        <label className="label">VRM 供电相数</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.vrmPhases || ''}
          onChange={(e) => handleChange('vrmPhases', Number(e.target.value))}
          placeholder="如：16"
        />
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.hasWifi || false}
            onChange={(e) => handleChange('hasWifi', e.target.checked)}
          />
          内置 WiFi
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.hasBluetooth || false}
            onChange={(e) => handleChange('hasBluetooth', e.target.checked)}
          />
          内置蓝牙
        </label>
      </div>
    </div>
  )

  const renderGPUSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">显卡芯片</label>
        <input
          className="input"
          value={formData.chipset || ''}
          onChange={(e) => handleChange('chipset', e.target.value)}
          placeholder="如：RTX 4090"
        />
      </div>
      <div className="form-group">
        <label className="label">显存容量 (GB)</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.vram || ''}
          onChange={(e) => handleChange('vram', Number(e.target.value))}
          placeholder="如：24"
        />
      </div>
      <div className="form-group">
        <label className="label">显存类型</label>
        <input
          className="input"
          value={formData.vramType || ''}
          onChange={(e) => handleChange('vramType', e.target.value)}
          placeholder="如：GDDR6X"
        />
      </div>
      <div className="form-group">
        <label className="label">核心频率 (MHz)</label>
        <input
          type="number"
          className="input"
          value={formData.coreClock || ''}
          onChange={(e) => handleChange('coreClock', Number(e.target.value))}
          placeholder="如：2235"
        />
      </div>
      <div className="form-group">
        <label className="label">加速频率 (MHz)</label>
        <input
          type="number"
          className="input"
          value={formData.boostClock || ''}
          onChange={(e) => handleChange('boostClock', Number(e.target.value))}
          placeholder="如：2580"
        />
      </div>
      <div className="form-group">
        <label className="label">TDP 功耗 (W) *</label>
        <input
          type="number"
          className="input"
          min={1}
          required
          value={formData.tdp || ''}
          onChange={(e) => handleChange('tdp', Number(e.target.value))}
          placeholder="如：450"
        />
      </div>
      <div className="form-group">
        <label className="label">显卡长度 (mm) *</label>
        <input
          type="number"
          className="input"
          min={1}
          required
          value={formData.length || ''}
          onChange={(e) => handleChange('length', Number(e.target.value))}
          placeholder="如：336"
        />
      </div>
      <div className="form-group">
        <label className="label">PCIe 插槽</label>
        <select
          className="select"
          value={formData.pcieSlot || ''}
          onChange={(e) => handleChange('pcieSlot', e.target.value)}
        >
          <option value="">请选择</option>
          {PCIE_SLOTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">供电接口</label>
        <input
          className="input"
          value={formData.powerConnectors || ''}
          onChange={(e) => handleChange('powerConnectors', e.target.value)}
          placeholder="如：16pin × 2"
        />
      </div>
      <div className="form-group">
        <label className="label">显示输出</label>
        <input
          className="input"
          value={formData.displayOutputs || ''}
          onChange={(e) => handleChange('displayOutputs', e.target.value)}
          placeholder="如：HDMI 2.1 × 1, DP 1.4a × 3"
        />
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.rayTracing || false}
            onChange={(e) => handleChange('rayTracing', e.target.checked)}
          />
          支持光线追踪
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.dlssSupport || false}
            onChange={(e) => handleChange('dlssSupport', e.target.checked)}
          />
          支持 DLSS / FSR
        </label>
      </div>
    </div>
  )

  const renderPSUSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">额定功率 (W) *</label>
        <input
          type="number"
          className="input"
          min={1}
          required
          value={formData.wattage || ''}
          onChange={(e) => handleChange('wattage', Number(e.target.value))}
          placeholder="如：850"
        />
      </div>
      <div className="form-group">
        <label className="label">电源尺寸</label>
        <select
          className="select"
          value={formData.formFactor || ''}
          onChange={(e) => handleChange('formFactor', e.target.value)}
        >
          <option value="">请选择</option>
          {PSU_FORM_FACTORS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">认证等级</label>
        <select
          className="select"
          value={formData.efficiency || ''}
          onChange={(e) => handleChange('efficiency', e.target.value)}
        >
          <option value="">请选择</option>
          {PSU_EFFICIENCIES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">线材类型</label>
        <select
          className="select"
          value={formData.modular || ''}
          onChange={(e) => handleChange('modular', e.target.value)}
        >
          <option value="">请选择</option>
          <option value="Non-Modular">非模组</option>
          <option value="Semi-Modular">半模组</option>
          <option value="Full-Modular">全模组</option>
        </select>
      </div>
      <div className="form-group">
        <label className="label">ATX 版本</label>
        <input
          className="input"
          value={formData.atxVersion || ''}
          onChange={(e) => handleChange('atxVersion', e.target.value)}
          placeholder="如：ATX 3.0"
        />
      </div>
      <div className="form-group">
        <label className="label">PCIe 5.0 16pin 接口数</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.pcie5Connectors || ''}
          onChange={(e) => handleChange('pcie5Connectors', Number(e.target.value))}
          placeholder="如：2"
        />
      </div>
    </div>
  )

  const renderCaseSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">支持主板板型 *</label>
        <div className="checkbox-group">
          {MOTHERBOARD_FORM_FACTORS.map((f) => (
            <label key={f} className="checkbox-inline">
              <input
                type="checkbox"
                checked={formData.formFactor?.includes(f) || false}
                onChange={(e) => {
                  const current = formData.formFactor || []
                  if (e.target.checked) {
                    handleChange('formFactor', [...current, f])
                  } else {
                    handleChange(
                      'formFactor',
                      current.filter((m: string) => m !== f)
                    )
                  }
                }}
              />
              {f}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="label">支持显卡最大长度 (mm) *</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.gpuMaxLength || ''}
          onChange={(e) => handleChange('gpuMaxLength', Number(e.target.value))}
          placeholder="如：420"
        />
      </div>
      <div className="form-group">
        <label className="label">支持散热器最大高度 (mm) *</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.cpuCoolerMaxHeight || ''}
          onChange={(e) => handleChange('cpuCoolerMaxHeight', Number(e.target.value))}
          placeholder="如：165"
        />
      </div>
      <div className="form-group">
        <label className="label">支持电源尺寸</label>
        <div className="checkbox-group">
          {PSU_FORM_FACTORS.map((f) => (
            <label key={f} className="checkbox-inline">
              <input
                type="checkbox"
                checked={formData.psuFormFactor?.includes(f) || false}
                onChange={(e) => {
                  const current = formData.psuFormFactor || []
                  if (e.target.checked) {
                    handleChange('psuFormFactor', [...current, f])
                  } else {
                    handleChange(
                      'psuFormFactor',
                      current.filter((m: string) => m !== f)
                    )
                  }
                }}
              />
              {f}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="label">预装风扇数</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.fansIncluded || ''}
          onChange={(e) => handleChange('fansIncluded', Number(e.target.value))}
          placeholder="如：3"
        />
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.rgb || false}
            onChange={(e) => handleChange('rgb', e.target.checked)}
          />
          支持 RGB
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.temperedGlass || false}
            onChange={(e) => handleChange('temperedGlass', e.target.checked)}
          />
          钢化玻璃侧透
        </label>
      </div>
    </div>
  )

  const renderCoolerSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">散热器类型</label>
        <select
          className="select"
          value={formData.coolerType || ''}
          onChange={(e) => handleChange('coolerType', e.target.value)}
        >
          <option value="">请选择</option>
          {COOLER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">支持 CPU 接口 *</label>
        <div className="checkbox-group">
          {CPU_SOCKETS.map((s) => (
            <label key={s} className="checkbox-inline">
              <input
                type="checkbox"
                checked={formData.sockets?.includes(s) || false}
                onChange={(e) => {
                  const current = formData.sockets || []
                  if (e.target.checked) {
                    handleChange('sockets', [...current, s])
                  } else {
                    handleChange(
                      'sockets',
                      current.filter((m: string) => m !== s)
                    )
                  }
                }}
              />
              {s}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="label">散热能力 TDP (W) *</label>
        <input
          type="number"
          className="input"
          min={1}
          required
          value={formData.tdpRating || ''}
          onChange={(e) => handleChange('tdpRating', Number(e.target.value))}
          placeholder="如：240"
        />
      </div>
      <div className="form-group">
        <label className="label">散热器高度 (mm)</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.height || ''}
          onChange={(e) => handleChange('height', Number(e.target.value))}
          placeholder="风冷散热器必填"
        />
      </div>
      <div className="form-group">
        <label className="label">冷排尺寸 (mm)</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.radiatorSize || ''}
          onChange={(e) => handleChange('radiatorSize', Number(e.target.value))}
          placeholder="水冷散热器必填"
        />
      </div>
      <div className="form-group">
        <label className="label">风扇数量</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.fans || ''}
          onChange={(e) => handleChange('fans', Number(e.target.value))}
          placeholder="如：2"
        />
      </div>
      <div className="form-group">
        <label className="label">风扇转速 (RPM)</label>
        <input
          className="input"
          value={formData.fanSpeed || ''}
          onChange={(e) => handleChange('fanSpeed', e.target.value)}
          placeholder="如：600-1800"
        />
      </div>
      <div className="form-group">
        <label className="label">噪音水平 (dB)</label>
        <input
          className="input"
          value={formData.noiseLevel || ''}
          onChange={(e) => handleChange('noiseLevel', e.target.value)}
          placeholder="如：≤30"
        />
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.rgb || false}
            onChange={(e) => handleChange('rgb', e.target.checked)}
          />
          支持 RGB
        </label>
      </div>
    </div>
  )

  const renderRAMSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">内存代数</label>
        <select
          className="select"
          value={formData.memoryType || ''}
          onChange={(e) => handleChange('memoryType', e.target.value)}
        >
          <option value="">请选择</option>
          {MEMORY_TYPES.map((mt) => (
            <option key={mt} value={mt}>
              {mt}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">总容量 (GB)</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.capacity || ''}
          onChange={(e) => handleChange('capacity', Number(e.target.value))}
          placeholder="如：32"
        />
      </div>
      <div className="form-group">
        <label className="label">内存条数</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.modules || ''}
          onChange={(e) => handleChange('modules', Number(e.target.value))}
          placeholder="如：2"
        />
      </div>
      <div className="form-group">
        <label className="label">频率 (MHz)</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.speed || ''}
          onChange={(e) => handleChange('speed', Number(e.target.value))}
          placeholder="如：6400"
        />
      </div>
      <div className="form-group">
        <label className="label">CL 时序</label>
        <input
          className="input"
          value={formData.casLatency || ''}
          onChange={(e) => handleChange('casLatency', e.target.value)}
          placeholder="如：CL32"
        />
      </div>
      <div className="form-group">
        <label className="label">工作电压 (V)</label>
        <input
          type="number"
          step="0.01"
          className="input"
          value={formData.voltage || ''}
          onChange={(e) => handleChange('voltage', Number(e.target.value))}
          placeholder="如：1.35"
        />
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.rgb || false}
            onChange={(e) => handleChange('rgb', e.target.checked)}
          />
          支持 RGB
        </label>
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.heatsink || false}
            onChange={(e) => handleChange('heatsink', e.target.checked)}
          />
          自带散热马甲
        </label>
      </div>
    </div>
  )

  const renderStorageSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">存储类型</label>
        <select
          className="select"
          value={formData.storageType || ''}
          onChange={(e) => handleChange('storageType', e.target.value)}
        >
          <option value="">请选择</option>
          <option value="SSD">固态硬盘 (SSD)</option>
          <option value="HDD">机械硬盘 (HDD)</option>
        </select>
      </div>
      <div className="form-group">
        <label className="label">接口类型</label>
        <select
          className="select"
          value={formData.interface || ''}
          onChange={(e) => handleChange('interface', e.target.value)}
        >
          <option value="">请选择</option>
          {STORAGE_INTERFACES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">容量 (GB)</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.capacity || ''}
          onChange={(e) => handleChange('capacity', Number(e.target.value))}
          placeholder="如：2000"
        />
      </div>
      <div className="form-group">
        <label className="label">读取速度 (MB/s)</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.readSpeed || ''}
          onChange={(e) => handleChange('readSpeed', Number(e.target.value))}
          placeholder="如：7300"
        />
      </div>
      <div className="form-group">
        <label className="label">写入速度 (MB/s)</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.writeSpeed || ''}
          onChange={(e) => handleChange('writeSpeed', Number(e.target.value))}
          placeholder="如：6900"
        />
      </div>
      <div className="form-group">
        <label className="label">TBW 耐久度 (TB)</label>
        <input
          type="number"
          className="input"
          min={0}
          value={formData.tbw || ''}
          onChange={(e) => handleChange('tbw', Number(e.target.value))}
          placeholder="如：1200"
        />
      </div>
    </div>
  )

  const renderMonitorSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">屏幕尺寸 (英寸)</label>
        <input
          type="number"
          step="0.1"
          className="input"
          value={formData.size || ''}
          onChange={(e) => handleChange('size', Number(e.target.value))}
          placeholder="如：27"
        />
      </div>
      <div className="form-group">
        <label className="label">分辨率</label>
        <input
          className="input"
          value={formData.resolution || ''}
          onChange={(e) => handleChange('resolution', e.target.value)}
          placeholder="如：2560×1440"
        />
      </div>
      <div className="form-group">
        <label className="label">刷新率 (Hz)</label>
        <input
          type="number"
          className="input"
          min={1}
          value={formData.refreshRate || ''}
          onChange={(e) => handleChange('refreshRate', Number(e.target.value))}
          placeholder="如：165"
        />
      </div>
      <div className="form-group">
        <label className="label">面板类型</label>
        <input
          className="input"
          value={formData.panelType || ''}
          onChange={(e) => handleChange('panelType', e.target.value)}
          placeholder="如：IPS"
        />
      </div>
      <div className="form-group">
        <label className="label">响应时间 (ms)</label>
        <input
          className="input"
          value={formData.responseTime || ''}
          onChange={(e) => handleChange('responseTime', e.target.value)}
          placeholder="如：1ms GTG"
        />
      </div>
      <div className="form-group">
        <label className="label">峰值亮度 (nits)</label>
        <input
          type="number"
          className="input"
          value={formData.brightness || ''}
          onChange={(e) => handleChange('brightness', Number(e.target.value))}
          placeholder="如：400"
        />
      </div>
      <div className="form-group">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={formData.hdr || false}
            onChange={(e) => handleChange('hdr', e.target.checked)}
          />
          支持 HDR
        </label>
      </div>
      <div className="form-group">
        <label className="label">同步技术</label>
        <select
          className="select"
          value={formData.adaptiveSync || 'None'}
          onChange={(e) => handleChange('adaptiveSync', e.target.value)}
        >
          <option value="None">无</option>
          <option value="FreeSync">FreeSync</option>
          <option value="G-Sync">G-Sync</option>
        </select>
      </div>
    </div>
  )

  const renderOSSpecs = () => (
    <div className="specs-grid">
      <div className="form-group">
        <label className="label">系统类型</label>
        <select
          className="select"
          value={formData.osType || ''}
          onChange={(e) => handleChange('osType', e.target.value)}
        >
          <option value="">请选择</option>
          <option value="Windows">Windows</option>
          <option value="Linux">Linux</option>
          <option value="macOS">macOS</option>
        </select>
      </div>
      <div className="form-group">
        <label className="label">版本</label>
        <input
          className="input"
          value={formData.version || ''}
          onChange={(e) => handleChange('version', e.target.value)}
          placeholder="如：11"
        />
      </div>
      <div className="form-group">
        <label className="label">版本类型</label>
        <input
          className="input"
          value={formData.edition || ''}
          onChange={(e) => handleChange('edition', e.target.value)}
          placeholder="如：专业版"
        />
      </div>
      <div className="form-group">
        <label className="label">授权类型</label>
        <select
          className="select"
          value={formData.licenseType || ''}
          onChange={(e) => handleChange('licenseType', e.target.value)}
        >
          <option value="">请选择</option>
          <option value="Retail">零售版</option>
          <option value="OEM">OEM 版</option>
        </select>
      </div>
    </div>
  )

  const renderSpecsByCategory = () => {
    switch (category) {
      case 'cpu':
        return renderCPUSpecs()
      case 'motherboard':
        return renderMotherboardSpecs()
      case 'gpu':
        return renderGPUSpecs()
      case 'ram':
        return renderRAMSpecs()
      case 'storage':
        return renderStorageSpecs()
      case 'psu':
        return renderPSUSpecs()
      case 'case':
        return renderCaseSpecs()
      case 'cooler':
        return renderCoolerSpecs()
      case 'monitor':
        return renderMonitorSpecs()
      case 'os':
        return renderOSSpecs()
      default:
        return null
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div className="modal-title">{component ? '编辑配件' : '添加配件'}</div>
            <button type="button" className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="modal-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              基础信息
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              详细规格
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'alternatives' ? 'active' : ''}`}
              onClick={() => setActiveTab('alternatives')}
            >
              替代件
            </button>
          </div>

          <div className="modal-body modal-body-scrollable">
            {activeTab === 'basic' && (
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="label">配件类别</label>
                  <select
                    className="select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                    disabled={!!component}
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
            )}

            {activeTab === 'basic' && (
              <>
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
              </>
            )}

            {activeTab === 'specs' && (
              <div>
                <div className="section-title">{CATEGORY_LABELS[category]} 规格</div>
                {renderSpecsByCategory()}
                <div style={{ padding: 12, background: 'var(--bg-darker)', borderRadius: 8, marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <strong>💡 提示：</strong>
                    带 * 号的字段为关键规格，填写后可进行更准确的兼容性检查。
                    空字段会导致冲突提示不准确，建议完整填写。
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alternatives' && (
              <div>
                <div className="section-title">替代件管理</div>
                <p className="section-hint">
                  当该配件缺货时，系统会自动推荐以下替代件供客户选择。替代件必须是同一类别。
                </p>

                <div className="alternatives-section">
                  <div className="alternatives-list">
                    <h4>已添加的替代件</h4>
                    {alternativeComponents.length > 0 || formData.alternativeIds?.length > 0 ? (
                      <div className="alternatives-grid">
                        {(component ? alternativeComponents : formData.alternativeIds?.map((id: string) => components.find((c) => c.id === id)).filter(Boolean) || []).map((alt: Component) => (
                          <div key={alt.id} className="alternative-card">
                            <div className="alternative-info">
                              <div className="alternative-name">{alt.name}</div>
                              <div className="alternative-brand">
                                {alt.brand} · ¥{alt.price.toLocaleString()}
                                {!alt.inStock && (
                                  <span className="oos-badge">缺货</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveAlternative(alt.id)}
                            >
                              移除
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">暂无替代件</p>
                    )}
                  </div>

                  <div className="available-alternatives">
                    <h4>可添加的替代件</h4>
                    {availableAlternatives.length > 0 ? (
                      <div className="alternatives-grid">
                        {availableAlternatives.slice(0, 8).map((alt) => (
                          <div key={alt.id} className="alternative-card">
                            <div className="alternative-info">
                              <div className="alternative-name">{alt.name}</div>
                              <div className="alternative-brand">
                                {alt.brand} · ¥{alt.price.toLocaleString()}
                                {!alt.inStock && (
                                  <span className="oos-badge">缺货</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAddAlternative(alt.id)}
                            >
                              添加
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">
                        {components.filter((c) => c.category === category).length <= 1
                          ? '暂无其他同类别配件可添加为替代件'
                          : '所有同类别配件都已添加为替代件'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
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
      <style>{`
        .modal-large {
          max-width: 900px;
          max-height: 85vh;
        }
        .modal-body-scrollable {
          max-height: calc(85vh - 140px);
          overflow-y: auto;
          padding-right: 8px;
        }
        .modal-body-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .modal-body-scrollable::-webkit-scrollbar-track {
          background: var(--bg-darker);
        }
        .modal-body-scrollable::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }
        .modal-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
          padding: 0 20px;
        }
        .tab-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 12px 20px;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--text-primary);
        }
        .tab-btn.active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
        }
        .specs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }
        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 8px 0;
        }
        .checkbox-inline {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text-primary);
        }
        .section-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 16px;
          line-height: 1.6;
        }
        .alternatives-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .alternatives-section h4 {
          font-size: 14px;
          margin: 0 0 12px 0;
          color: var(--text-primary);
        }
        .alternatives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 8px;
        }
        .alternative-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        .alternative-name {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 2px;
        }
        .alternative-brand {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .empty-text {
          font-size: 13px;
          color: var(--text-secondary);
          font-style: italic;
          padding: 16px;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
        }
      `}</style>
    </div>
  )
}

export default ComponentModal
