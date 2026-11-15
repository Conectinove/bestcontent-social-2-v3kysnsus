import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA (regra da casa — 8 regressões): manter SEMPRE o duplo export.
// O default alimenta imports `import pb from ...` e o nomeado `import { pb } from ...`.
// NÃO remover nenhuma das duas linhas de export abaixo.
export default pb
export { pb }
