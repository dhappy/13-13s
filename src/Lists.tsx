import React, {
  HTMLAttributes, ReactElement, useEffect, useState,
} from 'react'
import { useImmer } from 'use-immer'
import JSON5 from 'json5'

interface Point {
  x: number
  y: number
}

interface Data {
  groups?: Array<Record<string, string>>
  colors?: Record<string, string>
  realms?: Record<string, string>
  projects?: Record<string, string>
  months?: Record<string, string>
}

interface TooltipProps {
  label: string
  children: ReactElement | ReactElement[] | string
}

export const Lists = () => {
  const [data, setData] = useState<Data>({})
  const [axes, setAxes] = (
    useImmer<Record<string, string[]>>({})
  )
  const [dynAxes, setDynAxes] = (
    useImmer<Record<string, string[]>>({})
  )
  const [dragStart, setDragStart] = (
    useState<Point | null>(null)
  )
  const [dragOver, setDragOver] = (
    useState<Point | null>(null)
  )
  const [height, setHeight] = useState(0)
  const [sortOn, setSortOn] = useState('months')
  const [sortAsc, setSortAsc] = useState(false)
  const src = dragStart ? dynAxes : axes
  const { realms = {}, projects = {}, months = {} } = data
  const details: Record<string, Record<string, string>> = {
    realms, projects, months,
  }

  useEffect(() => {
    const load = async () => {
      const sources = [
        'groups', 'colors', 'realms', 'projects', 'months',
      ]
      const data = Object.fromEntries(
        await Promise.all(sources.map(
          async (src) => {
            try {
              const res = await fetch(`${src}.json5`)
              const body = await res.text()
              return [src, JSON5.parse(body)]
            } catch(error) {
              return [src, null]
            }
          }
        ))
      )

      setData(data)
      setAxes(data.groups)
      setDynAxes(data.groups)
      setHeight(
        Object.values(data.groups).reduce(
          (acc, vals) => Math.max(
            acc as number,
            (vals as Array<unknown>).length
          ),
          0,
        ) as number
      )
    }
    load()
  }, [setAxes, setDynAxes])

  const invert = (color: string, base = 16) => {
    const digits = (
      Array.from({ length: base }).map((_,i) => i.toString(base))
    )
    const map = Object.fromEntries(
      digits.map((digit: string, idx: number) => (
        [digit, digits.toReversed()[idx]]
      ))
    )
    return (
      color
      .toLowerCase()
      .split('')
      .map((digit) => digit in map ? map[digit] : digit)
      .join('')
    )
  }

  function download({ url, name }: { url: string, name: string }) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadArray = () => {
    const json = new Blob(
      [JSON5.stringify(axes, null, 2)],
      { type: 'application/json5' },
    )
    download({
      url: URL.createObjectURL(json),
      name: 'Yggdrasil.by groups.json5',
    })
  }
  const downloadObject = () => {
    const out = []
    for(const idx in Array.from({
      length: Object.keys(axes).length
    })) {
      const collect = {}
      for(const [type, entries] of Object.entries(axes)) {
        collect[type] = entries[idx]
      }
      out.push(collect)
    }
    const json = new Blob(
      [JSON5.stringify(out, null, 2)],
      { type: 'application/json5' },
    )
    download({
      url: URL.createObjectURL(json),
      name: 'Yggdrasil.by teams.json5',
    })
  }

  const load = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = JSON5.parse(e.target?.result as string)
      if(Array.isArray(data)) {
        const keys = Array.from(new Set([
          ...data.map((datum) => Object.keys(datum)).flat()
        ]))
        const loaded = {}
        for(const set of data) {
          for(const key of keys) {
            loaded[key] ??= []
            loaded[key].push(set[key] ?? '')
          }
        }
        console.debug({ loaded })
        setAxes(loaded)
      } else {
        setAxes(data)
      }
    }
    reader.readAsText(file)
  }

  const SortOn = (
    { column, ...props }:
    HTMLAttributes<HTMLDivElement> & { column: string }
  ) => {
    const sort = (sortAsc = true) => {
      setSortAsc(sortAsc)
      setSortOn(column)
      setDynAxes((axes: Record<string, string[]>) => {
        const seen: Record<string, number> = {}
        const orig = [...axes[column]]
        let sorted = [...axes[column]].sort()
        if(column === 'months' && data.months) {
          // unicode sort order misplaces ⛎
          sorted = Object.keys(data.months)
        }
        if(sortAsc) {
          sorted.reverse()
        }
        const idxs = sorted.map((entry) => (
          seen[entry] = orig.indexOf(
            entry, seen[entry] === undefined ? 0 : seen[entry] + 1
          )
        ))
        Object.entries(axes).forEach(([type, entries]) => {
          axes[type] = idxs.map((idx) => entries[idx])
        })
      })
    }
    return (
      <div
        style={{ display: 'grid', placeItems: 'center' }}
        {...props}
      >
        <div
          title={`Sort on ${column} ascending`}
          style={{
            opacity: sortOn === column && sortAsc ? 1 : 0.5,
            margin: 0,
            padding: 0,
            cursor: 'n-resize',
            lineHeight: 0.75,
          }}
          onClick={() => sort(true)}
        >▴</div>
        <div
          title={`Sort on ${column} descending`}
          style={{
            opacity: sortOn === column && !sortAsc ? 1 : 0.5,
            margin: 0,
            padding: 0,
            cursor: 's-resize',
            lineHeight: 0.75,
          }}
          onClick={() => sort(false)}
        >▾</div>
      </div>
    )
  }

  useEffect(() => {
    if(!dragStart) {
      setAxes(dynAxes)
    } else if(dragStart.x === dragOver?.x) {
      const column = Object.keys(dynAxes)[dragStart.x - 1]
      const orig = [...Object.values(axes)[dragStart.x - 1]]
      const hold = orig[dragStart.y - 1]
      orig[dragStart.y - 1] = orig[dragOver.y - 1]
      orig[dragOver.y - 1] = hold
      if(dynAxes[column][dragStart.y - 1] !== orig[dragStart.y - 1]) {
        setDynAxes((dynAxes) => { dynAxes[column] = orig })
      }
    }
  }, [dragStart, dragOver, axes, dynAxes, setAxes, setDynAxes])

  return (
    <section style={{ marginInline: 15, display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <object style={{ maxHeight: '30vh' }} data="Yggdrasil%20w⁄%20Text.svg">Yggdrasil</object>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ textAlign: 'center' }}>
            This interface is to align the 13 sets of 13 things that combine to form the 13 teams of{' '}
            <a
              href="https://notes.trwb.live"
              target="_blank"
              style={{
                textDecoration: 'underline',
                marginLeft: 1,
              }}
              // _hover={{ borderBottom: '1px dashed' }}
            >Yggdrasil</a>.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <button onClick={downloadArray}>Download Group Sorted</button>
            <button onClick={downloadObject}>Download Team Sorted</button>
          </div>
          <label style={{ marginTop: '2rem' }}>
            Load Configuration:{' '}
            <input
              type="file"
              accept=".json5"
              onChange={({ target: { files } }) => {
                if(files && files.length > 0) load(files[0])
              }}
            />
          </label>
        </div>
        <object style={{ maxHeight: '30vh', background: 'transparent' }} data="pie.svg" wmode="transparent">Yggdrasil</object>
        {/* <object style={{ maxHeight: '30vh' }} data="13%20Norse%20Settings.svg">The Tree</object> */}
      </header>
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Object.keys(axes).length}, 0fr)`,
          marginInline: 'auto',
        }}
      >
        {Object.entries(src).map(([type, entries], idx) => {
          let MaybeTooltip = ({ children }: TooltipProps) => (
            <>{children}</>
          )
          if(Object.keys(details).includes(type)) {
            MaybeTooltip = ({ label, children }: TooltipProps) => (
              <span title={label}>{children}</span>
            )
          }

          return (
            <ul key={idx} style={{ display: 'contents', listStyle: 'none' }}>
              <li style={{ display: 'flex' }}>
                <h3
                  style={{
                    marginInline: '0.25rem',
                    marginBlock: 0,
                    fontSize: 20,
                    textAlign: 'center',
                    textTransform: 'capitalize',
                  }}
                >
                  {type}
                </h3>
                <SortOn column={type}/>
              </li>
              {Array.from({ length: height }).map(
                (_, iidx) => {
                  const entry = entries[iidx]
                  const color = (
                    data?.colors?.[src.colors[iidx].toLowerCase()]
                    ?? '#000'
                  )
                  return (
                    <li
                      key={`${idx}:${iidx}`}
                      style={{
                        mixBlendMode: 'difference',
                        // filter: 'invert(100%)',
                        // backdropFilter: 'invert(100%)',
                        WebkitTextStroke: '0.5px black',
                        fontWeight: 'bold',
                        paddingInline: '0.1rem',
                        paddingBlock: 1,
                        whiteSpace: 'pre',
                        marginTop: '0',
                        gridColumn: idx + 1,
                        gridRow: iidx + 2,
                        backgroundColor: color,
                        color: invert(color),
                      }}
                      draggable={true}
                      onDragStart={() => {
                        setDragStart({
                          x: idx + 1, y: iidx + 1,
                        })
                      }}
                      onDragEnd={() => setDragStart(null)}
                      onDragEnter={() => {
                        setDragOver({
                          x: idx + 1, y: iidx + 1,
                        })
                      }}
                      // onDragLeave={() => {
                      //   console.debug({ m: 'Drag Leave', x: idx + 1, y: iidx + 1 })
                      //   setDragOver(null)
                      // }}
                    >
                      <MaybeTooltip label={details[type]?.[entry.toLowerCase()]}>
                        {entry}
                      </MaybeTooltip>
                    </li>
                  )
                }
              )}
            </ul>
          )
        })}
      </main>
      <button onClick={downloadObject} title="Download">↯</button>
    </section>
  )
}

export default Lists