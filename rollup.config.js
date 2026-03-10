import fs from 'fs-extra'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const pkg = JSON.parse(fs.readFileSync('./package.json'))
const banner = `/* Tabulator v${pkg.version} (c) Oliver Folkerd ${new Date().getFullYear()} */`

const minifyTerser = terser({ format: { preamble: banner } })
const beautifyTerser = terser({ compress: false, mangle: false, format: { beautify: true, preamble: banner } })

process.stdout.write('Creating JS bundles...')

fs.rmSync('dist/js', { recursive: true, force: true })

function jsBundle() {
  const browserConfig = {
    input: 'src/js/builds/browser.js',
    output: [
      {
        format: 'iife',
        file: 'dist/js/browser/tabulator.js',
        name: 'Tabulator',
        plugins: [beautifyTerser]
      },
      {
        format: 'iife',
        file: 'dist/js/browser/tabulator.min.js',
        name: 'Tabulator',
        plugins: [minifyTerser],
        sourcemap: true
      }
    ],
    plugins: [nodeResolve()]
  }

  const esmConfig = {
    input: 'src/js/builds/esm.js',
    output: [
      {
        file: 'dist/js/esm/tabulator.js',
        plugins: [beautifyTerser]
      },
      {
        file: 'dist/js/esm/tabulator.min.js',
        plugins: [minifyTerser]
      }
    ],
    plugins: [nodeResolve()]
  }

  return [browserConfig, esmConfig]
}

const bundles = [...jsBundle()]

export default bundles
