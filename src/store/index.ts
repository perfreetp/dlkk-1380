import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Component, Build, CompatibilityIssue, PerformanceEstimate, QuoteData } from '@/types'
import { ComponentCategory, CATEGORY_ORDER } from '@/types'
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
  compatibilityIssues: CompatibilityIssue[]
  performanceEstimate: PerformanceEstimate | null
  quoteData: QuoteData | null

  addComponent: (component: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateComponent: (id: string, updates: Partial<Component>) => void
  deleteComponent: (id: string) => void
  getComponentById: (id: string | null | undefined) => Component | undefined

  createBuild: (name: string, description?: string) => string
  updateBuild: (id: string, updates: Partial<Build>) => void
  deleteBuild: (id: string) => void
  setCurrentBuild: (id: string | null) => void
  addComponentToBuild: (buildId: string, slotId: string, componentId: string, quantity?: number) => void
  removeComponentFromBuild: (buildId: string, slotId: string) => void
  toggleBuildFavorite: (id: string) => void
  duplicateBuild: (id: string) => string

  toggleCompareBuild: (id: string) => void
  clearCompare: () => void

  setSearchQuery: (query: string) => void
  setFilterCategory: (category: ComponentCategory | 'all') => void
  setFilterBrand: (brand: string) => void
  setFilterInStockOnly: (only: boolean) => void

  runCompatibilityCheck: (buildId: string) => void
  runPerformanceEstimate: (buildId: string) => void
  generateQuote: (buildId: string, clientName: string) => void

  getBuildComponents: (buildId: string) => { slot: Build['components'][0]; component: Component | null }[]
  getBuildTotalPrice: (buildId: string) => number
  getBuildPowerConsumption: (buildId: string) => number
  getBrands: () => string[]
  getCurrentBuild: () => Build | null
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
      compatibilityIssues: [],
      performanceEstimate: null,
      quoteData: null,

      addComponent: (component) => {
        const now = Date.now()
        const newComponent = {
          ...component,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        } as Component
        set((state) => ({ components: [...state.components, newComponent] }))
      },

      updateComponent: (id, updates) => {
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? ({ ...c, ...updates, updatedAt: Date.now() } as Component) : c
          ),
        }))
      },

      deleteComponent: (id) => {
        set((state) => ({
          components: state.components.filter((c) => c.id !== id),
        }))
      },

      getComponentById: (id) => {
        if (!id) return undefined
        return get().components.find((c) => c.id === id)
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
        }
        set((state) => ({ builds: [...state.builds, duplicated] }))
        return newId
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
            total += (item.component as any).tdp || 65
          } else if (item.component.category === 'gpu') {
            total += (item.component as any).tdp || 150
          } else if (item.component.category === 'storage') {
            total += 10
          } else if (item.component.category === 'ram') {
            total += 10
          } else if (item.component.category === 'cooler') {
            total += 5
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
    }),
    {
      name: 'pc-builder-pro-store',
    }
  )
)
