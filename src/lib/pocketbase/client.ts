import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA: manter SEMPRE o export nomeado junto do default.
// Já é a 25ª vez que este export é perdido em reescritas do arquivo —
// ~35 arquivos importam { pb } e o build quebra (TS2614/MISSING_EXPORT).
export { pb }
