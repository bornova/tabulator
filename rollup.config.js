import fs from 'fs-extra'
import path from 'path'
import { compile } from 'sass'
import { globbySync } from 'globby'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const pkg = JSON.parse(fs.readFileSync('./package.json'))
const banner = `/* Tabulator v${pkg.version} (c) Oliver Folkerd ${new Date().getFullYear()} */`

const minifyTerser = terser({ format: { preamble: banner } })
const beautifyTerser = terser({ compress: false, mangle: false, format: { beautify: true, preamble: banner } })

const inputFiles = globbySync(['src/scss/themes/*/{,*/}[!_]*.scss'])

console.log('Building Tabulator...')

process.stdout.write('- Cleaning dist folder...')
fs.rmSync('dist', { recursive: true, force: true })
process.stdout.write(fs.existsSync('dist') ? ' failed.\n' : ' done.\n')

process.stdout.write('- Compiling SCSS files...')
for (const inputFile of inputFiles) {
  const relativeFile = inputFile.replace('src/scss/', '')
  const outputCss = `dist/css/${relativeFile.replace('.scss', '.css')}`
  const outputMinCss = `dist/css/${relativeFile.replace('.scss', '.min.css')}`

  const fullResult = compile(inputFile, { style: 'expanded' })
  const minResult = compile(inputFile, { style: 'compressed' })

  fs.ensureDirSync(path.dirname(outputCss))
  fs.writeFileSync(outputCss, fullResult.css)
  fs.writeFileSync(outputMinCss, minResult.css)
}
process.stdout.write(' done.\n')

console.log('- Creating JS bundles...')

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
