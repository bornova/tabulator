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

  const fullResult = compile(inputFile, { style: 'expanded' })
  const minResult = compile(inputFile, { style: 'compressed' })

  fs.ensureDirSync(path.dirname(outputCss))
  fs.writeFileSync(outputCss, fullResult.css)
  fs.writeFileSync(outputMinCss, minResult.css)
}

process.stdout.write(' done.\n')
