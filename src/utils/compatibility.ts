import type {
  Component,
  CPUComponent,
  MotherboardComponent,
  GPUComponent,
  RAMComponent,
  StorageComponent,
  PSUComponent,
  CaseComponent,
  CoolerComponent,
  CompatibilityIssue,
} from '@/types'

export function checkCompatibility(components: Component[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = []

  const cpu = components.find((c) => c.category === 'cpu') as CPUComponent | undefined
  const motherboard = components.find((c) => c.category === 'motherboard') as MotherboardComponent | undefined
  const gpu = components.find((c) => c.category === 'gpu') as GPUComponent | undefined
  const rams = components.filter((c) => c.category === 'ram') as RAMComponent[]
  const storages = components.filter((c) => c.category === 'storage') as StorageComponent[]
  const psu = components.find((c) => c.category === 'psu') as PSUComponent | undefined
  const pcCase = components.find((c) => c.category === 'case') as CaseComponent | undefined
  const cooler = components.find((c) => c.category === 'cooler') as CoolerComponent | undefined

  if (cpu && motherboard) {
    if (cpu.socket !== motherboard.socket) {
      issues.push({
        severity: 'error',
        category: 'cpu',
        componentId: cpu.id,
        componentName: cpu.name,
        message: `CPU 接口 ${cpu.socket} 与主板接口 ${motherboard.socket} 不兼容`,
        suggestion: `请更换为 ${motherboard.socket} 接口的 CPU，或更换匹配 ${cpu.socket} 接口的主板`,
      })
    }

    if (!cpu.memoryType.includes(motherboard.memoryType)) {
      issues.push({
        severity: 'error',
        category: 'ram',
        componentId: motherboard.id,
        componentName: motherboard.name,
        message: `CPU 不支持主板的 ${motherboard.memoryType} 内存类型`,
        suggestion: `CPU 支持的内存类型: ${cpu.memoryType.join(', ')}`,
      })
    }
  }

  if (rams.length > 0 && motherboard) {
    rams.forEach((ram) => {
      if (ram.memoryType !== motherboard.memoryType) {
        issues.push({
          severity: 'error',
          category: 'ram',
          componentId: ram.id,
          componentName: ram.name,
          message: `内存 ${ram.memoryType} 与主板 ${motherboard.memoryType} 不兼容`,
          suggestion: `请更换为 ${motherboard.memoryType} 类型的内存`,
        })
      }
    })

    const totalModules = rams.reduce((sum, r) => sum + r.modules, 0)
    if (totalModules > motherboard.memorySlots) {
      issues.push({
        severity: 'error',
        category: 'ram',
        message: `内存插槽不足：需要 ${totalModules} 个插槽，主板仅 ${motherboard.memorySlots} 个`,
        suggestion: '请减少内存条数量或更换有更多插槽的主板',
      })
    }

    const totalCapacity = rams.reduce((sum, r) => sum + r.capacity, 0)
    if (totalCapacity > motherboard.maxMemory) {
      issues.push({
        severity: 'warning',
        category: 'ram',
        message: `内存总容量 ${totalCapacity}GB 超过主板最大支持 ${motherboard.maxMemory}GB`,
        suggestion: '请减少内存容量或更换支持更大容量的主板',
      })
    }
  }

  if (storages.length > 0 && motherboard) {
    const m2Count = storages.filter((s) => s.interface.startsWith('M.2')).length
    const sataCount = storages.filter((s) => s.interface.includes('SATA') && !s.interface.startsWith('M.2')).length

    if (m2Count > motherboard.m2Slots) {
      issues.push({
        severity: 'error',
        category: 'storage',
        message: `M.2 接口不足：需要 ${m2Count} 个，主板仅 ${motherboard.m2Slots} 个`,
        suggestion: '请减少 M.2 存储设备数量或更换有更多 M.2 插槽的主板',
      })
    }

    if (sataCount > motherboard.sataPorts) {
      issues.push({
        severity: 'error',
        category: 'storage',
        message: `SATA 接口不足：需要 ${sataCount} 个，主板仅 ${motherboard.sataPorts} 个`,
        suggestion: '请减少 SATA 存储设备数量或更换有更多 SATA 接口的主板',
      })
    }
  }

  if (gpu && pcCase) {
    if (gpu.length > pcCase.gpuMaxLength) {
      issues.push({
        severity: 'error',
        category: 'gpu',
        componentId: gpu.id,
        componentName: gpu.name,
        message: `显卡长度 ${gpu.length}mm 超过机箱最大支持 ${pcCase.gpuMaxLength}mm`,
        suggestion: '请更换更短的显卡或更大的机箱',
      })
    }
  }

  if (motherboard && pcCase) {
    if (!pcCase.formFactor.includes(motherboard.formFactor)) {
      issues.push({
        severity: 'error',
        category: 'motherboard',
        componentId: motherboard.id,
        componentName: motherboard.name,
        message: `主板 ${motherboard.formFactor} 与机箱支持的板型不兼容`,
        suggestion: `机箱支持: ${pcCase.formFactor.join(', ')}`,
      })
    }
  }

  if (cooler && pcCase) {
    if (cooler.height && cooler.height > pcCase.cpuCoolerMaxHeight) {
      issues.push({
        severity: 'error',
        category: 'cooler',
        componentId: cooler.id,
        componentName: cooler.name,
        message: `散热器高度 ${cooler.height}mm 超过机箱限高 ${pcCase.cpuCoolerMaxHeight}mm`,
        suggestion: '请更换更矮的散热器或更高的机箱',
      })
    }
  }

  if (psu && pcCase) {
    if (!pcCase.psuFormFactor.includes(psu.formFactor)) {
      issues.push({
        severity: 'error',
        category: 'psu',
        componentId: psu.id,
        componentName: psu.name,
        message: `电源 ${psu.formFactor} 与机箱不兼容`,
        suggestion: `机箱支持电源规格: ${pcCase.psuFormFactor.join(', ')}`,
      })
    }
  }

  if (cpu && cooler) {
    if (!cooler.sockets.includes(cpu.socket)) {
      issues.push({
        severity: 'error',
        category: 'cooler',
        componentId: cooler.id,
        componentName: cooler.name,
        message: `散热器不支持 CPU 接口 ${cpu.socket}`,
        suggestion: `散热器支持: ${cooler.sockets.join(', ')}`,
      })
    }

    if (cooler.tdpRating < cpu.tdp) {
      issues.push({
        severity: 'warning',
        category: 'cooler',
        componentId: cooler.id,
        componentName: cooler.name,
        message: `散热器 TDP 额定 ${cooler.tdpRating}W 低于 CPU TDP ${cpu.tdp}W`,
        suggestion: '建议更换散热能力更强的散热器',
      })
    }
  }

  if (psu) {
    let totalPower = 50
    if (cpu) totalPower += cpu.tdp
    if (gpu) totalPower += gpu.tdp
    totalPower += rams.length * 10
    totalPower += storages.length * 10

    const recommendedPsu = Math.ceil(totalPower * 1.4 / 50) * 50

    if (psu.wattage < totalPower) {
      issues.push({
        severity: 'error',
        category: 'psu',
        componentId: psu.id,
        componentName: psu.name,
        message: `电源功率 ${psu.wattage}W 不足，系统满载功耗约 ${totalPower}W`,
        suggestion: `建议使用 ${recommendedPsu}W 以上的电源`,
      })
    } else if (psu.wattage < totalPower * 1.2) {
      issues.push({
        severity: 'warning',
        category: 'psu',
        componentId: psu.id,
        componentName: psu.name,
        message: `电源余量不足，建议保留 20% 以上余量`,
        suggestion: `建议使用 ${recommendedPsu}W 以上的电源`,
      })
    }

    if (gpu) {
      const needsPcie5 = gpu.powerConnectors.includes('16pin') || gpu.powerConnectors.includes('12VHPWR')
      if (needsPcie5 && psu.pcie5Connectors === 0 && !psu.atxVersion.includes('3.0')) {
        issues.push({
          severity: 'warning',
          category: 'psu',
          componentId: psu.id,
          componentName: psu.name,
          message: '电源可能不支持显卡的 12VHPWR 接口，需确认转接线',
          suggestion: '建议使用 ATX 3.0 标准电源或带原生 16pin 接口的电源',
        })
      }
    }
  }

  if (gpu && !cpu) {
    issues.push({
      severity: 'info',
      category: 'cpu',
      message: '已选择独立显卡，无需 CPU 核显',
    })
  }

  if (!gpu && cpu && !cpu.integratedGpu) {
    issues.push({
      severity: 'error',
      category: 'gpu',
      message: 'CPU 无核显且未选择独立显卡，系统无法显示输出',
      suggestion: '请选择独立显卡或带核显的 CPU',
    })
  }

  components.forEach((c) => {
    if (!c.inStock) {
      issues.push({
        severity: 'warning',
        category: c.category,
        componentId: c.id,
        componentName: c.name,
        message: `${c.name} 当前缺货`,
        suggestion: c.alternativeIds && c.alternativeIds.length > 0 ? '可查看替代配件' : '建议选择其他有库存的配件',
      })
    }
  })

  return issues
}
