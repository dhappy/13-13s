<script lang="ts">
  import JSON5 from 'json5'
  import { onMount } from 'svelte'
  import type { Team, Point, MetaInfo, Config } from '$lib/types'
  import { contrastColor, download, invert } from '$lib'
  import SortSelect from './SortSelect.svelte'

  let teams = $state<Array<Team>>([])
  let meta = $state<MetaInfo>()
  let cols = $state<Array<keyof Team>>([])
  let editing = $state<Point | null>()
  let editValue = $state<string>('')
  let dragStart = $state<Point | null>()
  let dragOver = $state<Point | null>()
  let sortAxis = $state<keyof Team>('months')
  let sortAsc = $state(false)
  let closed = $state<Record<string, boolean>>({})

  onMount(async () => {
    try {
      const res = await fetch(`data/default%20teams.json5`)
      parse(await res.text())
    } catch(err) {
      console.error((err as Error).message)
    }
  })

  export const downloadConfig = () => {
    const out: Config = { teams, meta: {} }
    for(const col of cols) {
      if(meta?.[col]) {
        out.meta[col] = meta[col]
      }
    }
    if(Object.values(closed).some((val) => val)) {
      out.meta.closed = closed
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

  export const load = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => parse(e.target?.result?.toString())
    reader.readAsText(file)
  }

  const parse = (config?: string) => {
    try {
      if(!config) {
        throw new Error('`config` is unset')
      }
      ({ teams, meta } = JSON5.parse(config))
      if(!teams) {
        throw new Error('No `teams` found.')
      }
      cols = Array.from(new Set([
        ...teams.map((team) => Object.keys(team)).flat()
      ])) as Array<keyof Team>
      closed = meta?.closed ?? Object.fromEntries(
        cols.map((col) => [col, false])
      )
    } catch(err) {
      console.error((err as Error).message)
    }
  }

  $effect(() => {
    teams = teams?.sort((a, b) => {
      const factor = sortAsc ? 1 : -1
      if(sortAxis === 'months' && meta?.months) {
        const aIdx = Object.keys(meta.months).indexOf(a.months)
        const bIdx = Object.keys(meta.months).indexOf(b.months)
        return factor * (aIdx - bIdx)
      } else {
        return factor * (
          (a[sortAxis] ?? '').localeCompare(b[sortAxis] ?? '')
        )
      }
    })
  })
</script>

<section>
  <ul>
    {#each cols as col, idx}
      <li
        class:condensed={closed[col]}
        style:grid-row-start={1}
        style:grid-row-end={!closed[col] ? 'span 1' : teams.length + 2}
      >
        <SortSelect bind:sortAxis bind:sortAsc column={col} bind:condensed={closed[col]}/>
      </li>
    {/each}
  </ul>

  {#each teams as team, rowIdx}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
    <ul onclick={(evt) => {
      if(!(evt.target instanceof HTMLInputElement)) {
        editing = null
      }
    }}>
      {#each cols as col, colIdx}
        {@const color = (
          meta?.colors?.[team.colors.toLowerCase()] ?? '#000'
        )}
        {@const from = dragStart?.x === colIdx && dragStart?.y === rowIdx}
        {@const to = dragOver?.x === colIdx && dragOver?.y === rowIdx}
        {@const here = { x: colIdx, y: rowIdx }}
        {@const edited = editing?.x === colIdx && editing?.y === rowIdx}
        {@const id = `cell-${rowIdx}-${col}`}
        {@const detail = meta?.[col]?.[team[col]]}
        {#if !closed[col]}
          <li
            style:background-color={color}
            style:color={contrastColor(color as `#${string}`)}
            draggable={true}
            ondragstart={() => dragStart = here}
            ondragend={() => {
              if(teams && dragStart?.x === colIdx && dragOver?.x === colIdx) {
                const hold = teams[dragStart.y][col]
                teams[dragStart.y][col] = teams[dragOver.y][col]
                teams[dragOver.y][col] = hold
              }
              dragStart = null
              dragOver = null
            }}
            ondragenter={() => dragOver = here}
            ondragexit={() => dragOver = null}
            ondblclick={() => {
              editing = here
              editValue = team[col]
            }}
            class:from
            class:to
            {id}
          >
            {#if edited}
              <!-- svelte-ignore a11y_autofocus -->
              <input
                bind:value={editValue}
                autofocus
                onkeydown={(evt) => {
                  if(evt.key === 'Escape') {
                    editing = null
                  } else if(evt.key === 'Enter') {
                    team[col] = editValue
                    editing = null
                  }
                }}
              />
            {:else}
              <button
                interestfor="{id}-card"
              >
                {#if dragStart?.x === colIdx && to}
                  {teams?.[dragStart.y][col]}
                {:else if dragOver?.x === colIdx && from}
                  {teams?.[dragOver.y][col]}
                {:else}
                  {team[col]}
                {/if}
              </button>
              {#if detail}
                <dialog id="{id}-card" popover="hint">
                  {detail}
                </dialog>
              {/if}
            {/if}
          </li>
        {/if}
      {/each}
    </ul>
  {/each}
</section>

<style>
  section {
    display: grid;
    grid-template-columns: repeat(var(--num-cols, 13), 0fr);
    margin-inline: auto;

    & ul {
      display: contents;
      list-style: none;

      li {
        padding: 0.1rem;
        white-space: pre;
        margin-top: 0;
        position: relative;

        &.from {
          outline: solid 2px yellow;
        }
        &.to {
          outline: solid 2px green;
        }

        & dialog {
          position: absolute;
          bottom: -25%;
          left: 75%;
          z-index: 3;
          width: max-content;
          max-width: 30ch;
          background-color: light-dark(#CCC, #222);
          color: light-dark(#222, #CCC);
          white-space: normal;
          text-indent: -1em;
          padding-inline-start: 2em;
          padding-inline-end: 1em;
          padding-block: 0.5em;
        }

        & button {
          position: relative;
          color: inherit;
          paint-order: stroke fill;
          background: transparent;
          border: none;
          font-size: inherit;
        }
        /* & aside {
          position: fixed;
          inset-block-start: anchor(end);
          inset-inline-start: anchor(self-end);
        } */

        & input {
          -webkit-text-stroke: transparent;
          field-sizing: content;
          min-width: 5ch;
          width: var(calc(--width * 1ch), 16ch);
        }
      }
    }
  }
</style>