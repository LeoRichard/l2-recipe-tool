import type { AppState } from '../types'

export function exportState(state: AppState): void {
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `l2-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importState(onSuccess: (state: AppState) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as AppState
        if (!Array.isArray(parsed.inventory) || !Array.isArray(parsed.queue)) {
          throw new Error('Invalid backup file format')
        }
        onSuccess(parsed)
      } catch {
        alert('Failed to load backup: invalid file format.')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
