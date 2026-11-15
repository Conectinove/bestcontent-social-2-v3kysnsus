import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA: manter SEMPRE o duplo export (default + nomeado). Regressão recorrente
// (v0.0.179, 181, 188, 190, 211, 221, 235): o export nomeado `pb` já foi perdido
// 11 vezes e quebra o build — não remover esta linha.
export { pb }
