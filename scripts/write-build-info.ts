import fs from 'fs'
import path from 'path'
const info = { buildDate: new Date().toISOString() }
fs.writeFileSync(path.join(process.cwd(), 'public', 'build-info.json'), JSON.stringify(info))
console.log('[build-info] written:', info.buildDate)
