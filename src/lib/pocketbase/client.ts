import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter SEMPRE o duplo export (default + nomeado) — já houve 13 regressões
// de rodadas anteriores removendo um dos dois e quebrando imports `import { pb }`.
export default pb
export { pb }
