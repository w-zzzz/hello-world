// Minimal Node ESM loader that turns *.css and `server-only` imports into
// empty modules, so cross-package tooling (e.g. check:ai-prompts) can
// require workspace packages that themselves import CSS or `server-only`
// at module load time.

export function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.css') || specifier === 'server-only') {
    return { url: `data:text/javascript,export default {};`, shortCircuit: true }
  }
  return nextResolve(specifier, context)
}
