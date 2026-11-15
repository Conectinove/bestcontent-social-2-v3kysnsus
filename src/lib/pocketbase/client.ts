import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA DE REGRESSÃO: manter SEMPRE o export nomeado { pb } além do default —
// já perdeu 13 vezes na árvore e quebra silenciosamente imports `import { pb } from ...`
export { pb }
