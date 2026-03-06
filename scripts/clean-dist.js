import fs from 'fs-extra'

process.stdout.write('Cleaning dist folder...')

fs.rmSync('dist', { recursive: true, force: true })

if (fs.existsSync('dist')) {
  throw new Error('Failed to clean dist folder')
}

process.stdout.write('done.\n')
