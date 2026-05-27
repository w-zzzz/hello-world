// Register the CSS / `server-only` stripping loader (see script-loader.mjs)
// so Node treats those imports as no-ops when running Node-only scripts that
// transitively load Next-aware workspace packages.
import { register } from 'node:module'

register('./script-loader.mjs', import.meta.url)
