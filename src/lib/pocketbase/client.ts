import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA DE REGRESSÃO: manter o export nomeado { pb } — já perdeu 9 vezes.
export { pb }
