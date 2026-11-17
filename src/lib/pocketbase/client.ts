import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: o export nomeado `pb` é exigido por dezenas de módulos — não remover
// (duplo export default + nomeado; regressão 27x no histórico do projeto).
export { pb }
export default pb
