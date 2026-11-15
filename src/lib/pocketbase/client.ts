import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA DE REGRESSÃO (21ª ocorrência): NUNCA remover o export nomeado abaixo.
// Diversos arquivos importam { pb } (nomeado) — ex. src/pages/Library.tsx.
// Manter SEMPRE o duplo export: default + nomeado.
export default pb

export { pb }
