import { createRequire } from 'node:module'

import Bundler from './Bundler.mjs'
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const bundler = new Bundler(pkg.version, process.env.TARGET)

export default bundler.bundle()
