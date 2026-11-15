import PocketBase from 'pocketbase'

// GUARDA: este arquivo DEVE manter o duplo export (default + nomeado pb).
// A perda do export nomeado já quebrou o build 9 vezes (v0.0.179, 181, 188,
// 190, 211, 221…). NÃO remova `export { pb }` ao editar este arquivo.
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb
export { pb }
