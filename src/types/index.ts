export type ComponentCategory =
  | 'cpu'
  | 'motherboard'
  | 'gpu'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'monitor'
  | 'os'

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  cpu: 'CPU 处理器',
  motherboard: '主板',
  gpu: '显卡',
  ram: '内存',
  storage: '存储',
  psu: '电源',
  case: '机箱',
  cooler: '散热器',
  monitor: '显示器',
  os: '操作系统',
}

export const CATEGORY_ICONS: Record<ComponentCategory, string> = {
  cpu: '⚡',
  motherboard: '🔲',
  gpu: '🎮',
  ram: '💾',
  storage: '📦',
  psu: '🔌',
  case: '🖥️',
  cooler: '❄️',
  monitor: '🖼️',
  os: '💿',
}

export const CATEGORY_ORDER: ComponentCategory[] = [
  'cpu',
  'motherboard',
  'gpu',
  'ram',
  'storage',
  'psu',
  'case',
  'cooler',
  'monitor',
  'os',
]

export type CPUSocket =
  | 'LGA 1700'
  | 'LGA 1200'
  | 'AM5'
  | 'AM4'
  | 'LGA 2066'
  | 'sWRX8'

export type CPUGeneration =
  | 'Intel 14th Gen'
  | 'Intel 13th Gen'
  | 'Intel 12th Gen'
  | 'Intel 11th Gen'
  | 'AMD Ryzen 7000'
  | 'AMD Ryzen 5000'
  | 'AMD Ryzen 3000'

export type MotherboardChipset =
  | 'Z790'
  | 'B760'
  | 'H770'
  | 'Z690'
  | 'B660'
  | 'X670E'
  | 'X670'
  | 'B650E'
  | 'B650'
  | 'X570'
  | 'B550'

export type MotherboardFormFactor = 'E-ATX' | 'ATX' | 'Micro-ATX' | 'Mini-ITX'

export type MemoryType = 'DDR5' | 'DDR4' | 'DDR3'

export type GPUPcieSlot = 'PCIe 5.0 x16' | 'PCIe 4.0 x16' | 'PCIe 3.0 x16'

export type StorageInterface =
  | 'M.2 NVMe PCIe 5.0'
  | 'M.2 NVMe PCIe 4.0'
  | 'M.2 NVMe PCIe 3.0'
  | 'M.2 SATA'
  | '2.5" SATA'
  | '3.5" SATA'

export type PSUFormFactor = 'ATX' | 'SFX' | 'SFX-L' | 'TFX'

export type PSUEfficiency =
  | '80+ White'
  | '80+ Bronze'
  | '80+ Silver'
  | '80+ Gold'
  | '80+ Platinum'
  | '80+ Titanium'

export type CoolerType =
  | 'Air Low Profile'
  | 'Air Tower'
  | 'Air Dual Tower'
  | 'AIO 120mm'
  | 'AIO 240mm'
  | 'AIO 280mm'
  | 'AIO 360mm'
  | 'Custom Loop'

export interface BaseComponent {
  id: string
  category: ComponentCategory
  name: string
  brand: string
  model: string
  price: number
  stock: number
  inStock: boolean
  alternativeIds: string[]
  specs: Record<string, string>
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface CPUComponent extends BaseComponent {
  category: 'cpu'
  socket: CPUSocket
  generation: CPUGeneration
  cores: number
  threads: number
  baseClock: number
  boostClock: number
  tdp: number
  memoryType: MemoryType[]
  memoryChannels: number
  integratedGpu: boolean
  coolerIncluded: boolean
  performanceScore: number
  gamingScore: number
  productivityScore: number
}

export interface MotherboardComponent extends BaseComponent {
  category: 'motherboard'
  socket: CPUSocket
  chipset: MotherboardChipset
  formFactor: MotherboardFormFactor
  memoryType: MemoryType
  memorySlots: number
  maxMemory: number
  m2Slots: number
  sataPorts: number
  pcieX16Slots: number
  hasWifi: boolean
  hasBluetooth: boolean
  vrmPhases: number
}

export interface GPUComponent extends BaseComponent {
  category: 'gpu'
  chipset: string
  vram: number
  vramType: string
  coreClock: number
  boostClock: number
  tdp: number
  length: number
  pcieSlot: GPUPcieSlot
  powerConnectors: string
  displayOutputs: string
  gamingScore: number
  productivityScore: number
  rayTracing: boolean
  dlssSupport: boolean
}

export interface RAMComponent extends BaseComponent {
  category: 'ram'
  memoryType: MemoryType
  capacity: number
  modules: number
  speed: number
  casLatency: string
  voltage: number
  rgb: boolean
  heatsink: boolean
}

export interface StorageComponent extends BaseComponent {
  category: 'storage'
  storageType: 'SSD' | 'HDD'
  interface: StorageInterface
  capacity: number
  readSpeed: number
  writeSpeed: number
  tbw?: number
  formFactor: string
  cache?: number
}

export interface PSUComponent extends BaseComponent {
  category: 'psu'
  wattage: number
  formFactor: PSUFormFactor
  efficiency: PSUEfficiency
  modular: 'Non-Modular' | 'Semi-Modular' | 'Full-Modular'
  atxVersion: string
  pcie5Connectors: number
  connectors: Record<string, number>
}

export interface CaseComponent extends BaseComponent {
  category: 'case'
  formFactor: MotherboardFormFactor[]
  gpuMaxLength: number
  cpuCoolerMaxHeight: number
  psuFormFactor: PSUFormFactor[]
  radiators: string[]
  driveBays: Record<string, number>
  fansIncluded: number
  rgb: boolean
  temperedGlass: boolean
}

export interface CoolerComponent extends BaseComponent {
  category: 'cooler'
  coolerType: CoolerType
  sockets: CPUSocket[]
  tdpRating: number
  height?: number
  radiatorSize?: number
  fans: number
  fanSpeed: string
  noiseLevel: string
  rgb: boolean
}

export interface MonitorComponent extends BaseComponent {
  category: 'monitor'
  size: number
  resolution: string
  refreshRate: number
  panelType: string
  responseTime: string
  hdr: boolean
  brightness: number
  adaptiveSync: 'FreeSync' | 'G-Sync' | 'None'
  ports: string
}

export interface OSComponent extends BaseComponent {
  category: 'os'
  osType: 'Windows' | 'Linux' | 'macOS'
  version: string
  edition: string
  licenseType: 'Retail' | 'OEM'
}

export type Component =
  | CPUComponent
  | MotherboardComponent
  | GPUComponent
  | RAMComponent
  | StorageComponent
  | PSUComponent
  | CaseComponent
  | CoolerComponent
  | MonitorComponent
  | OSComponent

export interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info'
  category: ComponentCategory | 'general'
  componentId?: string
  componentName?: string
  message: string
  suggestion?: string
}

export interface BuildComponent {
  slotId: string
  category: ComponentCategory
  componentId: string | null
  quantity: number
}

export interface Build {
  id: string
  name: string
  description?: string
  clientName?: string
  components: BuildComponent[]
  budgetLimit?: number
  brandPreferences?: string[]
  createdAt: number
  updatedAt: number
  isFavorite: boolean
  tags: string[]
}

export interface PerformanceEstimate {
  gamingFps: Record<string, number>
  productivityScore: number
  overallScore: number
  bottleneckInfo: {
    cpuUtilization: number
    gpuUtilization: number
    bottleneckComponent: 'CPU' | 'GPU' | 'Balanced'
    bottleneckPercentage: number
  }
  powerConsumption: {
    idle: number
    load: number
    psuHeadroom: number
    recommendedPsu: number
  }
}

export interface QuoteItem {
  category: string
  name: string
  brand: string
  model: string
  quantity: number
  unitPrice: number
  totalPrice: number
  warranty?: string
}

export interface QuoteData {
  buildId: string
  buildName: string
  clientName: string
  date: string
  quoteNumber: string
  items: QuoteItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountRate: number
  discountAmount: number
  total: number
  warrantyInfo: string
  notes: string
}
