import fs from 'fs-extra'
import path from 'path'
import { compile } from 'sass'
import { globbySync } from 'globby'

const inputFiles = globbySync(['src/scss/themes/*/{,*/}[!_]*.scss'])

process.stdout.write('Compiling SCSS files...')

for (const inputFile of inputFiles) {
  const relativeFile = inputFile.replace('src/scss/', '')
  const outputCss = `dist/css/${relativeFile.replace('.scss', '.css')}`
  const outputMinCss = `dist/css/${relativeFile.replace('.scss', '.min.css')}`
  const outputMap = `dist/css/${relativeFile.replace('.scss', '.min.css.map')}`

  const sourceMapFile = path.basename(outputMap)

  const fullResult = compile(inputFile, { style: 'expanded' })
  const minResult = compile(inputFile, { style: 'compressed', sourceMap: true })

  const minCssWithSourceMap = `${minResult.css}\n/*# sourceMappingURL=${sourceMapFile} */`

  fs.ensureDirSync(path.dirname(outputCss))
  fs.writeFileSync(outputCss, fullResult.css)
  fs.writeFileSync(outputMinCss, minCssWithSourceMap)
  fs.writeFileSync(outputMap, JSON.stringify(minResult.sourceMap))
}

process.stdout.write('done.\n')
