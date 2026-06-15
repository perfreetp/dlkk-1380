import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Component, Build, CompatibilityIssue, PerformanceEstimate, QuoteData, ComponentCategory } from '@/types'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/types'
import { sampleComponents } from '@/data/sampleComponents'
import { checkCompatibility } from '@/utils/compatibility'
import { estimatePerformance } from '@/utils/performance'
import { generateQuote } from '@/utils/quote'
import { v4 as uuidv4 } from 'uuid'

interface AppState {
  components: Component[]
  builds: Build[]
  currentBuildId: string | null
  compareBuildIds: string[]
  searchQuery: string
  filterCategory: ComponentCategory | 'all'
  filterBrand: string
  filterInStockOnly: boolean
  sortByBrandPreference: boolean
  compatibilityIssues: CompatibilityIssue[]
  performanceEstimate: PerformanceEstimate | null
  quoteData: QuoteData | null
  lastReplacedComponent: { fromId: string; toId: string; buildId: string } | null

  addComponent: (component: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateComponent: (id: string, updates: Partial<Component>) => void
  deleteComponent: (id: string) => void
  getComponentById: (id: string | null | undefined) => Component | undefined
  getAlternativeComponents: (componentId: string) => Component[]
  addAlternative: (componentId: string, alternativeId: string) => void
  removeAlternative: (componentId: string, alternativeId: string) => void
  replaceComponentInBuild: (buildId: string, slotId: string, oldComponentId: string, newComponentId: string, reason?: 'out_of_stock' | 'preference' | 'upgrade' | 'other') => void

  createBuild: (name: string, description?: string) => string
  updateBuild: (id: string, updates: Partial<Build>) => void
  deleteBuild: (id: string) => void
  setCurrentBuild: (id: string | null) => void
  addComponentToBuild: (buildId: string, slotId: string, componentId: string, quantity?: number) => void
  removeComponentFromBuild: (buildId: string, slotId: string) => void
  swapSlotsInBuild: (buildId: string, slotId1: string, slotId2: string) => void
  toggleBuildFavorite: (id: string) => void
  duplicateBuild: (id: string) => string
  setBrandPreferences: (buildId: string, brands: string[]) => void
  addBrandPreference: (buildId: string, brand: string) => void
  removeBrandPreference: (buildId: string, brand: string) => void
  getBrandPreferences: (buildId: string) => string[]
  isBrandPreferred: (buildId: string, brand: string) => boolean
  getNonPreferredComponentsInBuild: (buildId: string) => { slot: Build['components'][0]; component: Component }[]
  getSortedByBrandPreference: (components: Component[], buildId: string) => Component[]
  getBudgetOverrun: (buildId: string) => number
  getBudgetStatus: (buildId: string) => { status: 'ok' | 'warning' | 'over'; overrun: number; percentage: number }

  toggleCompareBuild: (id: string) => void
  clearCompare: () => void

  setSearchQuery: (query: string) => void
  setFilterCategory: (category: ComponentCategory | 'all') => void
  setFilterBrand: (brand: string) => void
  setFilterInStockOnly: (only: boolean) => void
  setSortByBrandPreference: (enabled: boolean) => void

  runCompatibilityCheck: (buildId: string) => void
  runPerformanceEstimate: (buildId: string) => void
  generateQuote: (buildId: string, clientName: string) => void

  getBuildComponents: (buildId: string) => { slot: Build['components'][0]; component: Component | null }[]
  getBuildTotalPrice: (buildId: string) => number
  getBuildPowerConsumption: (buildId: string) => number
  getBrands: () => string[]
  getCurrentBuild: () => Build | null
  getBuildsByCategory: (category: ComponentCategory | 'all') => Build[]
  refreshAllEstimates: (buildId: string) => void
}

function createEmptyBuildComponents(): Build['components'] {
  return [
    { slotId: 'cpu', category: 'cpu', componentId: null, quantity: 1 },
    { slotId: 'motherboard', category: 'motherboard', componentId: null, quantity: 1 },
    { slotId: 'gpu', category: 'gpu', componentId: null, quantity: 1 },
    { slotId: 'ram', category: 'ram', componentId: null, quantity: 1 },
    { slotId: 'storage-primary', category: 'storage', componentId: null, quantity: 1 },
    { slotId: 'storage-secondary', category: 'storage', componentId: null, quantity: 1 },
    { slotId: 'psu', category: 'psu', componentId: null, quantity: 1 },
    { slotId: 'case', category: 'case', componentId: null, quantity: 1 },
    { slotId: 'cooler', category: 'cooler', componentId: null, quantity: 1 },
    { slotId: 'monitor', category: 'monitor', componentId: null, quantity: 1 },
    { slotId: 'os', category: 'os', componentId: null, quantity: 1 },
  ]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      components: sampleComponents,
      builds: [],
      currentBuildId: null,
      compareBuildIds: [],
      searchQuery: '',
      filterCategory: 'all',
      filterBrand: '',
      filterInStockOnly: false,
      sortByBrandPreference: true,
      compatibilityIssues: [],
      performanceEstimate: null,
      quoteData: null,
      lastReplacedComponent: null,

      addComponent: (component) => {
        const now = Date.now()
        const newId = uuidv4()
        const newComponent = {
          ...component,
          id: newId,
          createdAt: now,
          updatedAt: now,
        } as Component
        set((state) => ({ components: [...state.components, newComponent] }))
        
        if (component.alternativeIds && component.alternativeIds.length > 0) {
          component.alternativeIds.forEach((altId) => {
            const altComponent = get().getComponentById(altId)
            if (altComponent) {
              const altAlts = altComponent.alternativeIds ?? []
              if (!altAlts.includes(newId)) {
                get().updateComponent(altId, {
                  alternativeIds: [...altAlts, newId],
                })
              }
            }
          })
        }
      },

      updateComponent: (id, updates) => {
        const oldComponent = get().getComponentById(id)
        const oldAltIds = oldComponent?.alternativeIds ?? []
        const newAltIds = updates.alternativeIds ?? oldAltIds
        
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? ({ ...c, ...updates, updatedAt: Date.now() } as Component) : c
          ),
        }))
        
        if (updates.alternativeIds !== undefined) {
          const addedAlts = newAltIds.filter((altId) => !oldAltIds.includes(altId))
          const removedAlts = oldAltIds.filter((altId) => !newAltIds.includes(altId))
          
          addedAlts.forEach((altId) => {
            const altComponent = get().getComponentById(altId)
            if (altComponent) {
              const altAlts = altComponent.alternativeIds ?? []
              if (!altAlts.includes(id)) {
                set((state) => ({
                  components: state.components.map((c) =>
                    c.id === altId
                      ? ({ ...c, alternativeIds: [...altAlts, id], updatedAt: Date.now() } as Component)
                      : c
                  ),
                }))
              }
            }
          })
          
          removedAlts.forEach((altId) => {
            const altComponent = get().getComponentById(altId)
            if (altComponent) {
              const altAlts = altComponent.alternativeIds ?? []
              set((state) => ({
                components: state.components.map((c) =>
                  c.id === altId
                    ? ({ ...c, alternativeIds: altAlts.filter((aid) => aid !== id), updatedAt: Date.now() } as Component)
                    : c
                ),
              }))
            }
          })
        }
        
        const state = get()
        state.builds.forEach((b) => {
          const hasComponent = b.components.some((s) => s.componentId === id)
          if (hasComponent) {
            state.runCompatibilityCheck(b.id)
            state.runPerformanceEstimate(b.id)
          }
        })
      },

      deleteComponent: (id) => {
        set((state) => {
          const newBuilds = state.builds.map((b) => ({
            ...b,
            components: b.components.map((s) =>
              s.componentId === id ? { ...s, componentId: null } : s
            ),
            updatedAt: Date.now(),
          }))
          const newComponents = state.components
            .filter((c) => c.id !== id)
            .map((c) => ({
              ...c,
              alternativeIds: c.alternativeIds?.filter((altId) => altId !== id) ?? [],
            }))
          return {
            components: newComponents,
            builds: newBuilds,
          }
        })
      },

      getComponentById: (id) => {
        if (!id) return undefined
        return get().components.find((c) => c.id === id)
      },

      getAlternativeComponents: (componentId) => {
        const component = get().getComponentById(componentId)
        if (!component || !component.alternativeIds) return []
        return component.alternativeIds
          .map((id) => get().getComponentById(id))
          .filter((c): c is Component => !!c)
      },

      addAlternative: (componentId, alternativeId) => {
        const component = get().getComponentById(componentId)
        const alternative = get().getComponentById(alternativeId)
        if (!component || !alternative) return
        if (component.category !== alternative.category) {
          console.warn('替代件必须是同一类别')
          return
        }
        const currentAlts = component.alternativeIds ?? []
        if (currentAlts.includes(alternativeId)) return
        get().updateComponent(componentId, {
          alternativeIds: [...currentAlts, alternativeId],
        })
        const altAlts = alternative.alternativeIds ?? []
        if (!altAlts.includes(componentId)) {
          get().updateComponent(alternativeId, {
            alternativeIds: [...altAlts, componentId],
          })
        }
      },

      removeAlternative: (componentId, alternativeId) => {
        const component = get().getComponentById(componentId)
        const alternative = get().getComponentById(alternativeId)
        if (!component) return
        get().updateComponent(componentId, {
          alternativeIds: (component.alternativeIds ?? []).filter((id) => id !== alternativeId),
        })
        if (alternative) {
          get().updateComponent(alternativeId, {
            alternativeIds: (alternative.alternativeIds ?? []).filter((id) => id !== componentId),
          })
        }
      },

      replaceComponentInBuild: (buildId, slotId, oldComponentId, newComponentId, reason = 'other') => {
        const state = get()
        const oldComponent = state.getComponentById(oldComponentId)
        const newComponent = state.getComponentById(newComponentId)
        if (!oldComponent || !newComponent) return
        
        const historyEntry: Build['replacementHistory'][0] = {
          id: uuidv4(),
          slotId,
          oldComponentId,
          oldComponentName: oldComponent.name,
          oldComponentBrand: oldComponent.brand,
          oldPrice: oldComponent.price,
          newComponentId,
          newComponentName: newComponent.name,
          newComponentBrand: newComponent.brand,
          newPrice: newComponent.price,
          priceDiff: newComponent.price - oldComponent.price,
          reason,
          timestamp: Date.now(),
        }
        
        set((s) => ({
          builds: s.builds.map((b) =>
            b.id === buildId
              ? {
                  ...b,
                  components: b.components.map((slot) =>
                    slot.slotId === slotId
                      ? { ...slot, componentId: newComponentId }
                      : slot
                  ),
                  replacementHistory: [...b.replacementHistory, historyEntry],
                  updatedAt: Date.now(),
                }
              : b
          ),
          lastReplacedComponent: { fromId: oldComponentId, toId: newComponentId, buildId },
        }))
        
        if (buildId === get().currentBuildId) {
          get().runCompatibilityCheck(buildId)
          get().runPerformanceEstimate(buildId)
        }
      },

      createBuild: (name, description) => {
        const id = uuidv4()
        const now = Date.now()
        const newBuild: Build = {
          id,
          name,
          description,
          components: createEmptyBuildComponents(),
          createdAt: now,
          updatedAt: now,
          isFavorite: false,
          tags: [],
          brandPreferences: [],
          replacementHistory: [],
        }
        set((state) => ({
          builds: [...state.builds, newBuild],
          currentBuildId: id,
        }))
        return id
      },

      updateBuild: (id, updates) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
          ),
        }))
        if (updates.budgetLimit !== undefined || updates.brandPreferences !== undefined) {
          const state = get()
          state.runCompatibilityCheck(id)
          state.runPerformanceEstimate(id)
        }
      },

      deleteBuild: (id) => {
        set((state) => {
          const builds = state.builds.filter((b) => b.id !== id)
          const currentBuildId = state.currentBuildId === id ? (builds[0]?.id ?? null) : state.currentBuildId
          const compareBuildIds = state.compareBuildIds.filter((bid) => bid !== id)
          return { builds, currentBuildId, compareBuildIds }
        })
      },

      setCurrentBuild: (id) => {
        set({ currentBuildId: id })
        if (id) {
          get().runCompatibilityCheck(id)
          get().runPerformanceEstimate(id)
        } else {
          set({ compatibilityIssues: [], performanceEstimate: null })
        }
      },

      addComponentToBuild: (buildId, slotId, componentId, quantity = 1) => {
        set((state) => ({
          builds: state.builds.map((b) => {
            if (b.id !== buildId) return b
            return {
              ...b,
              components: b.components.map((slot) =>
                slot.slotId === slotId
                  ? { ...slot, componentId, quantity }
                  : slot
              ),
              updatedAt: Date.now(),
            }
          }),
        }))
        if (buildId === get().currentBuildId) {
          get().runCompatibilityCheck(buildId)
          get().runPerformanceEstimate(buildId)
        }
      },

      removeComponentFromBuild: (buildId, slotId) => {
        set((state) => ({
          builds: state.builds.map((b) => {
            if (b.id !== buildId) return b
            return {
              ...b,
              components: b.components.map((slot) =>
                slot.slotId === slotId
                  ? { ...slot, componentId: null, quantity: 1 }
                  : slot
              ),
              updatedAt: Date.now(),
            }
          }),
        }))
        if (buildId === get().currentBuildId) {
          get().runCompatibilityCheck(buildId)
          get().runPerformanceEstimate(buildId)
        }
      },

      swapSlotsInBuild: (buildId, slotId1, slotId2) => {
        set((state) => ({
          builds: state.builds.map((b) => {
            if (b.id !== buildId) return b
            const slot1 = b.components.find((s) => s.slotId === slotId1)
            const slot2 = b.components.find((s) => s.slotId === slotId2)
            if (!slot1 || !slot2) return b
            if (slot1.category !== slot2.category) {
              console.warn('只能交换同类别的槽位')
              return b
            }
            return {
              ...b,
              components: b.components.map((slot) => {
                if (slot.slotId === slotId1) {
                  return { ...slot, componentId: slot2.componentId, quantity: slot2.quantity }
                }
                if (slot.slotId === slotId2) {
                  return { ...slot, componentId: slot1.componentId, quantity: slot1.quantity }
                }
                return slot
              }),
              updatedAt: Date.now(),
            }
          }),
        }))
        if (buildId === get().currentBuildId) {
          get().runCompatibilityCheck(buildId)
          get().runPerformanceEstimate(buildId)
        }
      },

      toggleBuildFavorite: (id) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === id ? { ...b, isFavorite: !b.isFavorite, updatedAt: Date.now() } : b
          ),
        }))
      },

      duplicateBuild: (id) => {
        const source = get().builds.find((b) => b.id === id)
        if (!source) return ''
        const newId = uuidv4()
        const now = Date.now()
        const duplicated: Build = {
          ...source,
          id: newId,
          name: source.name + ' (副本)',
          createdAt: now,
          updatedAt: now,
          isFavorite: false,
          components: source.components.map((c) => ({ ...c })),
          brandPreferences: source.brandPreferences ? [...source.brandPreferences] : [],
          replacementHistory: [],
        }
        set((state) => ({ builds: [...state.builds, duplicated] }))
        return newId
      },

      setBrandPreferences: (buildId, brands) => {
        get().updateBuild(buildId, { brandPreferences: brands })
      },

      addBrandPreference: (buildId, brand) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return
        const prefs = build.brandPreferences ?? []
        if (!prefs.includes(brand)) {
          get().updateBuild(buildId, { brandPreferences: [...prefs, brand] })
        }
      },

      removeBrandPreference: (buildId, brand) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return
        get().updateBuild(buildId, {
          brandPreferences: (build.brandPreferences ?? []).filter((b) => b !== brand),
        })
      },

      getBrandPreferences: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        return build?.brandPreferences ?? []
      },

      isBrandPreferred: (buildId, brand) => {
        const prefs = get().getBrandPreferences(buildId)
        return prefs.length === 0 || prefs.includes(brand)
      },

      getNonPreferredComponentsInBuild: (buildId) => {
        const prefs = get().getBrandPreferences(buildId)
        if (prefs.length === 0) return []
        const buildComponents = get().getBuildComponents(buildId)
        return buildComponents.filter(
          (item): item is { slot: Build['components'][0]; component: Component } =>
            item.component !== null && !prefs.includes(item.component.brand)
        )
      },

      getSortedByBrandPreference: (components, buildId) => {
        const prefs = get().getBrandPreferences(buildId)
        if (prefs.length === 0 || !get().sortByBrandPreference) return [...components]
        return [...components].sort((a, b) => {
          const aPref = prefs.includes(a.brand) ? 0 : 1
          const bPref = prefs.includes(b.brand) ? 0 : 1
          if (aPref !== bPref) return aPref - bPref
          return b.price - a.price
        })
      },

      getBudgetOverrun: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build || !build.budgetLimit) return 0
        const total = get().getBuildTotalPrice(buildId)
        return Math.max(0, total - build.budgetLimit)
      },

      getBudgetStatus: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build || !build.budgetLimit) return { status: 'ok', overrun: 0, percentage: 0 }
        const total = get().getBuildTotalPrice(buildId)
        const percentage = (total / build.budgetLimit) * 100
        if (total <= build.budgetLimit) {
          return { status: 'ok', overrun: 0, percentage }
        } else if (total <= build.budgetLimit * 1.05) {
          return { status: 'warning', overrun: total - build.budgetLimit, percentage }
        } else {
          return { status: 'over', overrun: total - build.budgetLimit, percentage }
        }
      },

      toggleCompareBuild: (id) => {
        set((state) => {
          const exists = state.compareBuildIds.includes(id)
          if (exists) {
            return { compareBuildIds: state.compareBuildIds.filter((bid) => bid !== id) }
          }
          if (state.compareBuildIds.length >= 2) {
            return { compareBuildIds: [...state.compareBuildIds.slice(1), id] }
          }
          return { compareBuildIds: [...state.compareBuildIds, id] }
        })
      },

      clearCompare: () => {
        set({ compareBuildIds: [] })
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setFilterBrand: (brand) => set({ filterBrand: brand }),
      setFilterInStockOnly: (only) => set({ filterInStockOnly: only }),
      setSortByBrandPreference: (enabled) => set({ sortByBrandPreference: enabled }),

      runCompatibilityCheck: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) {
          set({ compatibilityIssues: [] })
          return
        }
        const buildComponents = build.components
          .map((slot) => ({
            slot,
            component: slot.componentId ? get().getComponentById(slot.componentId) : null,
          }))
          .filter((x) => x.component !== null) as { slot: Build['components'][0]; component: Component }[]
        const issues = checkCompatibility(buildComponents.map((x) => x.component))

        const prefs = build.brandPreferences ?? []
        if (prefs.length > 0) {
          buildComponents.forEach(({ slot, component }) => {
            if (!prefs.includes(component.brand)) {
              issues.push({
                severity: 'info',
                category: component.category,
                componentId: component.id,
                componentName: component.name,
                message: `${component.name} 的品牌 ${component.brand} 不在偏好品牌列表中`,
                suggestion: `偏好品牌: ${prefs.join(', ')}，可考虑更换为偏好品牌产品`,
              })
            }
          })
        }

        const budgetStatus = get().getBudgetStatus(buildId)
        if (budgetStatus.status === 'over') {
          issues.push({
            severity: 'error',
            category: 'general',
            message: `预算超支 ¥${budgetStatus.overrun.toLocaleString()}，已超出预算 ${(budgetStatus.percentage - 100).toFixed(1)}%`,
            suggestion: '建议更换更低价格的配件或调整预算上限',
          })
        } else if (budgetStatus.status === 'warning') {
          issues.push({
            severity: 'warning',
            category: 'general',
            message: `预算即将超支，已使用预算的 ${budgetStatus.percentage.toFixed(1)}%`,
            suggestion: '注意控制配件价格，避免超出预算',
          })
        }

        set({ compatibilityIssues: issues })
      },

      runPerformanceEstimate: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) {
          set({ performanceEstimate: null })
          return
        }
        const buildComponents = build.components
          .map((slot) => ({
            slot,
            component: slot.componentId ? get().getComponentById(slot.componentId) : null,
          }))
          .filter((x) => x.component !== null) as { slot: Build['components'][0]; component: Component }[]
        const estimate = estimatePerformance(buildComponents.map((x) => x.component))
        set({ performanceEstimate: estimate })
      },

      generateQuote: (buildId, clientName) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) {
          set({ quoteData: null })
          return
        }
        const buildComponents = build.components
          .map((slot) => ({
            slot,
            component: slot.componentId ? get().getComponentById(slot.componentId) : null,
          }))
          .filter((x) => x.component !== null) as { slot: Build['components'][0]; component: Component }[]
        const quote = generateQuote(build, buildComponents.map((x) => x.component), clientName)

        const lastReplacement = get().lastReplacedComponent
        if (lastReplacement && lastReplacement.buildId === buildId) {
          const fromComp = get().getComponentById(lastReplacement.fromId)
          const toComp = get().getComponentById(lastReplacement.toId)
          if (fromComp && toComp) {
            quote.notes += `\\n\\n📝 配件变更记录：由「${fromComp.name}」替换为「${toComp.name}」，差价 ¥${(toComp.price - fromComp.price).toLocaleString()}`
          }
        }

        set({ quoteData: quote })
      },

      getBuildComponents: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return []
        return build.components.map((slot) => ({
          slot,
          component: slot.componentId ? get().getComponentById(slot.componentId) ?? null : null,
        }))
      },

      getBuildTotalPrice: (buildId) => {
        const items = get().getBuildComponents(buildId)
        return items.reduce((sum, item) => {
          if (item.component) {
            return sum + item.component.price * item.slot.quantity
          }
          return sum
        }, 0)
      },

      getBuildPowerConsumption: (buildId) => {
        const items = get().getBuildComponents(buildId)
        let total = 50
        items.forEach((item) => {
          if (!item.component) return
          if (item.component.category === 'cpu') {
            const tdp = (item.component as any).tdp
            if (tdp && tdp > 0) total += tdp
            else total += 65
          } else if (item.component.category === 'gpu') {
            const tdp = (item.component as any).tdp
            if (tdp && tdp > 0) total += tdp
            else total += 150
          } else if (item.component.category === 'storage') {
            total += 10
          } else if (item.component.category === 'ram') {
            total += 10
          } else if (item.component.category === 'cooler') {
            total += 5
          } else if (item.component.category === 'motherboard') {
            total += 25
          }
        })
        return total
      },

      getBrands: () => {
        const brands = new Set(get().components.map((c) => c.brand))
        return Array.from(brands).sort()
      },

      getCurrentBuild: () => {
        const id = get().currentBuildId
        if (!id) return null
        return get().builds.find((b) => b.id === id) ?? null
      },

      getBuildsByCategory: (category) => {
        if (category === 'all') return [...get().builds]
        return get().builds.filter((b) =>
          b.components.some(
            (s) => s.category === category && s.componentId !== null
          )
        )
      },

      refreshAllEstimates: (buildId) => {
        get().runCompatibilityCheck(buildId)
        get().runPerformanceEstimate(buildId)
      },
    }),
    {
      name: 'pc-builder-pro-store',
    }
  )
)
