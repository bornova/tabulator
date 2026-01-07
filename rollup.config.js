import fs from 'fs-extra'
import { globbySync } from 'globby'

import { nodeResolve } from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import terser from '@rollup/plugin-terser'

const pkg = JSON.parse(fs.readFileSync('./package.json'))
const banner = `/* Tabulator v${pkg.version} (c) Oliver Folkerd ${new Date().getFullYear()} */`

const minifyTerser = terser({ format: { preamble: banner } })
const beautifyTerser = terser({ compress: false, mangle: false, format: { beautify: true, preamble: banner } })
const resolverPlugin = nodeResolve()

console.log('Starting Build Process...')

console.log('- Clearing Dist files')
fs.rmSync('dist', { recursive: true, force: true })

function cssConfig(minify) {
  console.log(`- Generating ${minify ? 'Minified' : 'Full'} CSS Bundles`)

  return globbySync('src/scss/**/*.scss').map((inputFile) => {
    const file = inputFile.replace('src/scss/', '')

    return {
      input: inputFile,
      output: [{ file: './dist/css/' + file.replace('.scss', minify ? '.min.css' : '.css') }],
      plugins: [
        postcss({
          modules: false,
          extract: true,
          minimize: minify,
          sourceMap: minify,
          use: { sass: { silenceDeprecations: ['legacy-js-api'] } }
        })
      ],
      onwarn(warning, warn) {
        if (warning.code === 'FILE_NAME_CONFLICT') return
        warn(warning)
      }
    }
  })
}

function jsConfig() {
  console.log('- Generating JS Bundles')

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
    plugins: [resolverPlugin]
  }

  const esmConfig = {
    input: 'src/js/builds/esm.js',
    output: [
      {
        format: 'esm',
        file: 'dist/js/esm/tabulator.js',
        plugins: [beautifyTerser]
      },
      {
        format: 'esm',
        file: 'dist/js/esm/tabulator.min.js',
        plugins: [minifyTerser]
      }
    ],
    plugins: [resolverPlugin]
  }

  return [browserConfig, esmConfig]
}

const bundles = [...cssConfig(false), ...cssConfig(true), ...jsConfig()]

console.log('Starting Rollup Build...')

export default bundles
