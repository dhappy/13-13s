<script lang="ts">
  let {
    sortAxis = $bindable(),
    sortAsc = $bindable(false),
    column,
    condensed = $bindable(false),
  } = $props()
</script>

<section>
  <button onclick={() => condensed = !condensed}>
    {condensed ? '⏵' : '⏷'}
  </button>
  <h3 class:condensed>{column}</h3>
  {#if !condensed}
    <menu>
      <button
        title={`Sort on ${column} ascending`}
        style:opacity={sortAxis === column && sortAsc ? 1 : 0.5}
        style:cursor="n-resize"
        onclick={() => {
          sortAxis = column
          sortAsc = true
        }}
      >▴</button>
      <button
        title={`Sort on ${column} descending`}
        style:opacity={sortAxis === column && !sortAsc ? 1 : 0.5}
        style:cursor="s-resize"
        onclick={() => {
          sortAxis = column
          sortAsc = false
        }}
      >▾</button>
      </menu>
    {/if}
  </section>

<style>
  section {
    display: flex;
    justify-content: space-around;
    margin-inline: 0.25rem;
  }

  h3 {
    margin-block: 0;
    font-size: 1.1em;
    text-align: center;
    text-transform: capitalize;

    &.condensed {
      font-size: 1.5em;
      transform: rotate(-90deg) translate(calc(-50% - 1em), calc(-100% + 1lh));
      position: absolute;
      grid-row-end: -1;
    }
  }

  menu {
    display: flex;
    flex-direction: column;
    place-items: center;
    padding: 0;
    margin-inline: 0.1rem;

    & button {
      margin: 0;
      padding: 0;
      line-height: 0.75;
    }
  }
</style>