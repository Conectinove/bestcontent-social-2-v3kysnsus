import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA (regra da casa): manter SEMPRE o duplo export — default + nomeado.
// Este export nomeado já foi perdido 7 vezes (v0.0.179, 181, 188, 190, 211...);
// nunca remover `export { pb }` ao editar este arquivo.
export default pb
export { pb }
