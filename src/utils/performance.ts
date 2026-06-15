import type {
  Component,
  CPUComponent,
  GPUComponent,
  RAMComponent,
  PerformanceEstimate,
} from '@/types'

const GAME_BASELINE_FPS: Record<string, { '1080p': number; '1440p': number; '4k': number }> = {
  '赛博朋克 2077': { '1080p': 60, '1440p': 45, '4k': 28 },
  '原神': { '1080p': 144, '1440p': 120, '4k': 80 },
  '英雄联盟': { '1080p': 240, '1440p': 200, '4k': 144 },
  'CS2': { '1080p': 300, '1440p': 240, '4k': 160 },
  '艾尔登法环': { '1080p': 90, '1440p': 70, '4k': 45 },
  '荒野大镖客 2': { '1080p': 80, '1440p': 60, '4k': 38 },
  '地平线 5': { '1080p': 100, '1440p': 80, '4k': 55 },
  '使命召唤 现代战争3': { '1080p': 144, '1440p': 110, '4k': 70 },
}

export function estimatePerformance(components: Component[]): PerformanceEstimate {
  const cpu = components.find((c) => c.category === 'cpu') as CPUComponent | undefined
  const gpu = components.find((c) => c.category === 'gpu') as GPUComponent | undefined
  const rams = components.filter((c) => c.category === 'ram') as RAMComponent[]

  const cpuScore = cpu?.performanceScore ?? 0
  const gpuScore = gpu?.gamingScore ?? 0
  const cpuGamingScore = cpu?.gamingScore ?? 0
  const cpuProductivityScore = cpu?.productivityScore ?? 0
  const gpuProductivityScore = gpu?.productivityScore ?? 0

  const totalRam = rams.reduce((sum, r) => sum + (r.capacity ?? 0), 0)
  const ramSpeed = rams.length > 0 ? Math.max(...rams.map((r) => r.speed ?? 0)) : 0

  const ramFactor = Math.min(1, totalRam / 32) * (ramSpeed >= 6000 ? 1 : ramSpeed >= 5200 ? 0.95 : 0.9)

  const overallScore = isNaN(cpuScore) || isNaN(gpuScore) ? 0 : Math.round(
    (cpuScore * 0.4 + gpuScore * 0.5 + ramFactor * 10)
  )

  const productivityScore = isNaN(cpuProductivityScore) || isNaN(gpuProductivityScore) ? 0 : Math.round(
    (cpuProductivityScore * 0.6 + gpuProductivityScore * 0.25 + ramFactor * 15)
  )

  const gamingFps: Record<string, number> = {}
  Object.entries(GAME_BASELINE_FPS).forEach(([game, baseline]) => {
    const safeGpuScore = isNaN(gpuScore) || gpuScore <= 0 ? 50 : gpuScore
    const safeCpuGamingScore = isNaN(cpuGamingScore) || cpuGamingScore <= 0 ? 50 : cpuGamingScore
    const gpuRatio = (safeGpuScore / 100) * 0.85 + (safeCpuGamingScore / 100) * 0.1
    const resolutionMultiplier = safeGpuScore >= 90 ? baseline['4k'] : safeGpuScore >= 75 ? baseline['1440p'] : baseline['1080p']
    const fps = Math.round(resolutionMultiplier * gpuRatio * ramFactor)
    gamingFps[game] = isNaN(fps) || fps <= 0 ? 30 : fps
  })

  let cpuUtilization = 50
  let gpuUtilization = 50
  let bottleneckComponent: 'CPU' | 'GPU' | 'Balanced' = 'Balanced'
  let bottleneckPercentage = 0

  if (cpuScore && gpuScore && cpuGamingScore && gpuScore) {
    const diff = Math.abs(cpuGamingScore - gpuScore)
    if (cpuGamingScore < gpuScore - 10) {
      bottleneckComponent = 'CPU'
      bottleneckPercentage = gpuScore > 0 ? Math.round((1 - cpuGamingScore / gpuScore) * 100) : 20
      cpuUtilization = 95
      gpuUtilization = Math.round(Math.max(20, 80 - bottleneckPercentage))
    } else if (gpuScore < cpuGamingScore - 10) {
      bottleneckComponent = 'GPU'
      bottleneckPercentage = cpuGamingScore > 0 ? Math.round((1 - gpuScore / cpuGamingScore) * 100) : 20
      gpuUtilization = 95
      cpuUtilization = Math.round(Math.max(20, 80 - bottleneckPercentage))
    } else {
      cpuUtilization = 85
      gpuUtilization = 85
      bottleneckPercentage = 0
    }
  } else if (cpuScore && !gpuScore) {
    bottleneckComponent = 'GPU'
    bottleneckPercentage = 50
    cpuUtilization = 40
    gpuUtilization = 100
  } else if (!cpuScore && gpuScore) {
    bottleneckComponent = 'CPU'
    bottleneckPercentage = 50
    cpuUtilization = 100
    gpuUtilization = 40
  }

  let idlePower = 40
  let loadPower = 50
  components.forEach((c) => {
    if (c.category === 'cpu') {
      idlePower += 15
      const tdp = (c as CPUComponent).tdp
      loadPower += tdp && tdp > 0 ? tdp : 65
    } else if (c.category === 'gpu') {
      idlePower += 20
      const tdp = (c as GPUComponent).tdp
      loadPower += tdp && tdp > 0 ? tdp : 150
    } else if (c.category === 'ram') {
      idlePower += 3
      loadPower += 8
    } else if (c.category === 'storage') {
      idlePower += 2
      loadPower += 8
    } else if (c.category === 'cooler') {
      idlePower += 3
      loadPower += 10
    } else if (c.category === 'motherboard') {
      idlePower += 10
      loadPower += 25
    }
  })

  const psu = components.find((c) => c.category === 'psu')
  const psuWattage = (psu as any)?.wattage ?? 0
  const psuHeadroom = psuWattage && psuWattage > 0 && loadPower > 0 ? Math.round((1 - loadPower / psuWattage) * 100) : 0
  const recommendedPsu = Math.max(500, Math.ceil(loadPower * 1.4 / 50) * 50)

  return {
    gamingFps,
    productivityScore: isNaN(productivityScore) ? 0 : productivityScore,
    overallScore: isNaN(overallScore) ? 0 : overallScore,
    bottleneckInfo: {
      cpuUtilization: isNaN(cpuUtilization) ? 50 : Math.max(0, Math.min(100, cpuUtilization)),
      gpuUtilization: isNaN(gpuUtilization) ? 50 : Math.max(0, Math.min(100, gpuUtilization)),
      bottleneckComponent,
      bottleneckPercentage: isNaN(bottleneckPercentage) ? 0 : Math.max(0, bottleneckPercentage),
    },
    powerConsumption: {
      idle: idlePower,
      load: loadPower,
      psuHeadroom: isNaN(psuHeadroom) ? 0 : psuHeadroom,
      recommendedPsu,
    },
  }
}
