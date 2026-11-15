import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA DE REGRESSÃO (8ª ocorrência): manter SEMPRE o duplo export —
// default E nomeado. Vários arquivos importam `{ pb }` como named export.
export { pb }
