import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// Guarda da casa (regressão já aconteceu 20×): manter o DUPLO EXPORT —
// default E nomeado — qualquer rodada que toque imports de pb confere aqui.
export { pb }
export default pb
