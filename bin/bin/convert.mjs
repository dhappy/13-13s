#!/usr/bin/env node

// Hand to God, `json5 groups.json` outputs JSON. I've not been able to
// get JSON5 out of the CLI, so this is a workaround.

import JSON5 from 'json5'
import fs from 'node:fs'
import path from 'path'

const __dirname = (
  (new URL(import.meta.url)).pathname.split('/').slice(0, -1).join('/')
)

await Promise.all(
  ['groups', 'realms', 'colors', 'months', 'projects'].map(async (type) => {
    const data = JSON.parse((await fs.promises.readFile(
      path.join(__dirname, `../public/${type}.json`)
    )).toString())
    return fs.promises.writeFile(`${type}.json5`, JSON5.stringify(data, null, 2))
  })
)
