import fs from 'fs-extra'
import { build } from 'esbuild'

const pkg = JSON.parse(fs.readFileSync('./package.json'))
const banner = `/* Tabulator v${pkg.version} (c) Oliver Folkerd ${new Date().getFullYear()} */`

process.stdout.write('Creating JS bundles...')

fs.rmSync('dist/js', { recursive: true, force: true })

const sharedConfig = {
  banner: { js: banner },
  bundle: true
}

await Promise.all([
  build({
    ...sharedConfig,
    entryPoints: ['src/js/builds/browser.js'],
    format: 'iife',
    outfile: 'dist/js/browser/tabulator.js'
  }),
  build({
    ...sharedConfig,
    entryPoints: ['src/js/builds/browser.js'],
    format: 'iife',
    minify: true,
    outfile: 'dist/js/browser/tabulator.min.js',
    sourcemap: true
  }),
  build({
    ...sharedConfig,
    entryPoints: ['src/js/builds/esm.js'],
    format: 'esm',
    outfile: 'dist/js/esm/tabulator.js'
  }),
  build({
    ...sharedConfig,
    entryPoints: ['src/js/builds/esm.js'],
    format: 'esm',
    minify: true,
    outfile: 'dist/js/esm/tabulator.min.js',
    sourcemap: true
  })
])

process.stdout.write('done.\n')
