import { ReactElement, useEffect, useState } from 'react'
import {
  Box, Button, Grid, GridItem, Heading, Stack,
  StackProps, Tooltip,
} from '@chakra-ui/react'
import { useImmer } from 'use-immer'
import groups from './groups.json'
import colorList from './colors.json'
import realms from './realms.json'
import projects from './projects.json'
import months from './months.json'

interface Point {
  x: number
  y: number
}

interface TooltipProps {
  label: string
  children: ReactElement | ReactElement[] | string
}

// eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  const [axes, setAxes] = (
    useImmer<Record<string, string[]>>(groups)
  )
  const [dynAxes, setDynAxes] = (
    useImmer<Record<string, string[]>>(axes)
  )
  const [dragStart, setDragStart] = (
    useState<Point | null>(null)
  )
  const [dragOver, setDragOver] = (
    useState<Point | null>(null)
  )
  const [sortOn, setSortOn] = useState('months')
  const [sortAsc, setSortAsc] = useState(false)
  const colors = colorList as Record<string, string>
  const details: Record<string, Record<string, string>> = {
    realms, projects, months,
  }
  const src = dragStart ? dynAxes : axes

  const download = () => {
    const json = new Blob(
      [JSON.stringify(axes, null, 2)],
      { type: 'application/json' }
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
          sorted = Object.keys(months) // unicode sort order misplaces ⛎
        }
        if(sortAsc) {
          sorted = sorted.reverse()
        }
        const idxs = sorted.map((entry) => {
          const idx = orig.indexOf(
            entry, seen[entry] === undefined ? 0 : seen[entry] + 1
          )
          return seen[entry] = idx
        })
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

  return <Stack>
    <Grid
      isolation="isolate"
      templateColumns={`repeat(${Object.keys(axes).length}, 0fr)`}
    >
      {Object.entries(src).map(([type, entries], idx) => {
        let MaybeTooltip = ({ label = '', children }: TooltipProps) => (
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
            {entries.map((entry, iidx) => (
              <GridItem
                mixBlendMode="color"
                key={`${idx}:${iidx}`}
                px={5} py={1} whiteSpace="pre" mt="0 !important"
                gridColumn={idx + 1} gridRow={iidx + 2}
                draggable={true}
                bg={colors[src.colors[iidx].toLowerCase()]}
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
            ))}
          </Stack>
        )
      })}
    </Grid>
    <Button onClick={download} title="Download">↯</Button>
  </Stack>
}
