import fs from 'fs'
import path from 'path'
import { compile } from 'sass'
import { globbySync } from 'globby'
import terser from '@rollup/plugin-terser'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const banner = `
/* @bornova/tabulator-tables v${pkg.version}
 * Copyright (c) 2015-2026 Oli Folkerd, ${new Date().getFullYear()} Timur Atalay 
 */`

fs.rmSync('dist', { recursive: true, force: true })

// Copy built assets to docs/ for the playground
function copyDocsAssets() {
  const jsSrc = 'dist/js/browser/tabulator.min.js'
  const cssSrc = 'dist/css/themes/default/tabulator.min.css'
  if (fs.existsSync(jsSrc)) fs.copyFileSync(jsSrc, 'docs/tabulator.min.js')
  if (fs.existsSync(cssSrc)) fs.copyFileSync(cssSrc, 'docs/tabulator.min.css')
  process.stdout.write('Assets copied to docs/.\n')
}

process.stdout.write('Compiling SCSS files...')
for (const inputFile of globbySync(['src/scss/themes/*/{,*/}[!_]*.scss'])) {
  const relativeFile = inputFile.replace('src/scss/', '')
  const outputCss = `dist/css/${relativeFile.replace('.scss', '.css')}`
  const outputMinCss = `dist/css/${relativeFile.replace('.scss', '.min.css')}`
  const outputMap = `dist/css/${relativeFile.replace('.scss', '.min.css.map')}`
  const sourceMapFile = path.basename(outputMap)
  const fullResult = compile(inputFile, { style: 'expanded' })
  const minResult = compile(inputFile, { style: 'compressed', sourceMap: true })
  const minCssWithSourceMap = `${minResult.css}\n/*# sourceMappingURL=${sourceMapFile} */`

  fs.mkdirSync(path.dirname(outputCss), { recursive: true })
  fs.writeFileSync(outputCss, fullResult.css)
  fs.writeFileSync(outputMinCss, minCssWithSourceMap)
  fs.writeFileSync(outputMap, JSON.stringify(minResult.sourceMap))
}
process.stdout.write('done.\n')

const browserInput = 'src/js/core/TabulatorFull.js'
const browserOutput = { format: 'iife', name: 'Tabulator', exports: 'default', banner }

const esmInput = 'src/js/index.js'
const esmOutput = { format: 'esm', banner }

const stripComments = terser({ compress: false, mangle: false, format: { comments: false } })

export default [
  // Browser IIFE — unminified
  {
    input: browserInput,
    output: { ...browserOutput, file: 'dist/js/browser/tabulator.js' },
    plugins: [stripComments]
  },
  // Browser IIFE — minified with source map
  {
    input: browserInput,
    output: { ...browserOutput, file: 'dist/js/browser/tabulator.min.js', sourcemap: true },
    plugins: [
      terser({ format: { comments: false } }),
      {
        name: 'copy-docs-assets',
        closeBundle() {
          copyDocsAssets()
        }
      }
    ]
  },
  // ESM — tree-shakable (one file per module)
  {
    input: esmInput,
    output: {
      ...esmOutput,
      dir: 'dist/js/esm',
      preserveModules: true,
      preserveModulesRoot: 'src/js'
    },
    plugins: [stripComments]
  }
]
