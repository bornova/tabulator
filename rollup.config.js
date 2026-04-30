import fs from 'fs'
import path from 'path'
import { compile } from 'sass'
import { globbySync } from 'globby'
import terser from '@rollup/plugin-terser'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const banner = `
/* @bornova/tabulator v${pkg.version}
 * Copyright (c) 2015-2026 Oli Folkerd, ${new Date().getFullYear()} Timur Atalay 
 */`

fs.rmSync('dist', { recursive: true, force: true })

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

const browserInput = 'src/js/builds/browser.js'
const esmInput = 'src/js/builds/esm.js'

const browserOutput = {
  format: 'iife',
  name: 'Tabulator',
  exports: 'default',
  banner
}

const esmOutput = {
  format: 'esm',
  banner
}

export default [
  // Browser IIFE — unminified
  {
    input: browserInput,
    output: { ...browserOutput, file: 'dist/js/browser/tabulator.js' }
  },
  // Browser IIFE — minified with source map
  {
    input: browserInput,
    output: { ...browserOutput, file: 'dist/js/browser/tabulator.min.js', sourcemap: true },
    plugins: [terser({ format: { comments: /^!/ } })]
  },
  // ESM — unminified
  {
    input: esmInput,
    output: { ...esmOutput, file: 'dist/js/esm/tabulator.js' }
  }
]
