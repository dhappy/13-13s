import React, { useEffect, useState } from 'react'
import { Flex, Grid, GridItem, Heading, Stack } from '@chakra-ui/react'
import { useImmer } from 'use-immer'
import groups from './groups.json'
import colorList from './colors.json'

interface Point {
  x: number
  y: number
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
  const colors = colorList as Record<string, string>

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

  const src = dragStart ? dynAxes : axes

  return (
    <Flex>
      {Object.entries(src).map(([type, entries], idx) => (
        <Stack key={idx}>
          <Heading mx={2} fontSize={20}>{type}</Heading>
          <Grid>
            {entries.map((entry, iidx) => (
              <GridItem
                mixBlendMode="difference"
                key={`${idx}:${iidx}`}
                p={3}
                gridColumn={idx + 1} gridRow={iidx + 1}
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
                {entry}
              </GridItem>
            ))}
          </Grid>
        </Stack>
      ))}
    </Flex>
  )
}
