import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// Export nomeado preservado (regressão histórica — checar a cada rodada)
export { pb }
