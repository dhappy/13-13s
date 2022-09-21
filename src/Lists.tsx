import { ReactElement, useEffect, useState } from 'react'
import {
  Box, Button, Flex, Grid, GridItem, Heading,
  Link, Stack, StackProps, Text, Tooltip,
} from '@chakra-ui/react'
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

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
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
            const filename = `${src}.json5`
            let body
            try {
              const res = await fetch(filename)
              body = await res.text()
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

  const download = () => {
    const json = new Blob(
      [JSON5.stringify(axes, null, 2)],
      { type: 'application/json5' }
    )
    window.open(URL.createObjectURL(json))
  }

  const SortOn = ({ column, ...props }: StackProps & { column: string }) => {
    const sort = (sortAsc = true) => {
      setSortAsc(sortAsc)
      setSortOn(column)
      setDynAxes((axes) => {
        const seen: Record<string, number> = {}
        const orig = [...axes[column]]
        let sorted = [...axes[column]].sort()
        if(column === 'months') {
          sorted = Object.keys(data.months ?? {}) // unicode sort order misplaces ⛎
        }
        if(sortAsc) {
          sorted = sorted.reverse()
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
      <Stack align="center" {...props}>
        <Box
          title={`Sort on ${column} ascending`}
          opacity={sortOn === column && sortAsc ? 1 : 0.5}
          onClick={() => sort(true)}
          m={0} p={0} cursor="n-resize"
          lineHeight={0.75}
        >▴</Box>
        <Box
          title={`Sort on ${column} descending`}
          opacity={sortOn === column && !sortAsc ? 1 : 0.5}
          onClick={() => sort(false)}
          m="0 !important" p={0} cursor="s-resize"
          lineHeight={0.75}
        >▾</Box>
      </Stack>
    )
  }

  useEffect(() => {
    if(!dragStart) {
      setAxes(dynAxes)
    } else if(dragStart.x === dragOver?.x) {
      setDynAxes((dynAxes) => {
        const orig = [...Object.values(axes)[dragStart.x - 1]]
        const hold = orig[dragStart.y - 1]
        orig[dragStart.y - 1] = orig[dragOver.y - 1]
        orig[dragOver.y - 1] = hold
        dynAxes[Object.keys(dynAxes)[dragStart.x - 1]] = orig
      })
    }
  }, [dragStart, dragOver, axes, dynAxes, setAxes, setDynAxes])

  return (
    <Stack mx={15}>
      <Flex>
        <object style={{ maxHeight: '30vh' }} data="Yggdrasil.svg">Yggdrasil</object>
        <Text textAlign="center">
          This interface is to align the 13 sets of 13 things that combine to form the 13 teams of
          <Link
            href="https://discord.gg/xuwe6rxAzg" isExternal
            textDecoration="underline"
            ml={1}
            _hover={{ borderBottom: '1px dashed' }}
          >Yggdrasil</Link>.
        </Text>
        <object style={{ maxHeight: '30vh' }} data="pie.svg">Yggdrasil</object>
        <object style={{ maxHeight: '30vh' }} data="13%20Norse%20Settings.svg">The Tree</object>
      </Flex>
      <Grid
        isolation="isolate"
        templateColumns={`repeat(${Object.keys(axes).length}, 0fr)`}
      >
        {Object.entries(src).map(([type, entries], idx) => {
          let MaybeTooltip = ({ children }: TooltipProps) => (
            <>{children}</>
          )
          if(Object.keys(details).includes(type)) {
            MaybeTooltip = ({ label, children }: TooltipProps) => (
              <Tooltip {...{ label }}>{children}</Tooltip>
            )
          }

          return (
            <Stack key={idx} display="contents">
              <GridItem gridColumn={idx + 1} gridRow={1}>
                <Heading
                  mx={2} mb={0} fontSize={20} textAlign="center"
                  textTransform="capitalize"
                >
                  {type}
                </Heading>
                <SortOn column={type} m="0 !important"/>
              </GridItem>
              {Array.from({ length: height }).map(
                (_, iidx) => {
                  const entry = entries[iidx]
                  return (
                    <GridItem
                      mixBlendMode="color"
                      key={`${idx}:${iidx}`}
                      px={5} py={1} whiteSpace="pre" mt="0 !important"
                      gridColumn={idx + 1} gridRow={iidx + 2}
                      draggable={true}
                      bg={data?.colors?.[src.colors[iidx].toLowerCase()]}
                      onDragStart={() => setDragStart({
                        x: idx + 1, y: iidx + 1,
                      })}
                      onDragEnd={() => setDragStart(null)}
                      onDragEnter={() => setDragOver({
                        x: idx + 1, y: iidx + 1,
                      })}
                      onDragLeave={() => setDragOver(null)}
                    >
                      <MaybeTooltip label={details[type]?.[entry.toLowerCase()]}>
                        {entry}
                      </MaybeTooltip>
                    </GridItem>
                  )
                }
              )}
            </Stack>
          )
        })}
      </Grid>
      <Button onClick={download} title="Download">↯</Button>
    </Stack>
  )
}
