import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter sempre o DUPLO EXPORT (named `pb` + default) — regressão histórica (16x)
export { pb }
export default pb
