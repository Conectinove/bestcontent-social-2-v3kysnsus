import PocketBase from 'pocketbase'

// GUARDRAIL: manter SEMPRE os dois exports (nomeado e default) —
// parte do app importa { pb } e outra parte importa o default.
const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090')

export { pb }
export default pb
