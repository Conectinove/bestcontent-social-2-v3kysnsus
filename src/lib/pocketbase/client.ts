import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter SEMPRE o duplo export (default + nomeado) — regressão
// histórica de 10+ rodadas; use-app-theme, ai-studio, crm, image-bank etc.
// importam o nomeado { pb }.
export default pb
export { pb }
