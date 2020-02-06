
export let measures = {} as any

export const init = () => {
  measures = {}
}

export const measure = <T>(name: string, f: () => T) => {
  const t = Date.now()
  const r = f()
  const duration = Date.now() - t
  measures[name] = (measures[name] || 0) + duration
  return r
}
