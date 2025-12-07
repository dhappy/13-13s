<script lang="ts">
  import { onMount } from 'svelte'
  import Lists from '$lib/Lists.svelte'

  let lists: Lists

  onMount(() => {
    document.querySelectorAll('object').forEach((obj) => {
      // obj.addEventListener('load', () => {
        if(obj.contentDocument?.location.pathname.endsWith('.svg')) {
          obj.contentDocument.documentElement.style.colorScheme = 'light dark'
        }
      // })
    })
  })
</script>

<svelte:head>
  <title>Yggdrasil</title>
</svelte:head>

<section>
  <header>
    <object data="Yggdrasil%20w⁄%20Text.svg" title="The World Tree">Yggdrasil</object>
    <div>
      <p>
        This interface is to align the 13 sets of 13 things that combine to form the 13 teams of{' '}
        <a
          href="https://notes.trwb.live"
          target="_blank"
        >Yggdrasil</a>.
      </p>
      <p>Drag & drop elements to reposition them within a column. Double click elements to edit them.</p>
      <button onclick={lists.downloadConfig}>Download Configuration</button>
      <label style:marginTop="2rem">
        Load Configuration:{' '}
        <input
          type="file"
          accept=".json5,.json"
          onchange={(e) => {
            const files = (e.target as HTMLInputElement).files
            if(files && files.length > 0) lists.load(files[0])
          }}
        />
      </label>
    </div>
    <object data="pie.svg" wmode="transparent" title="Sections">Yggdrasil</object>
  </header>
  <main>
    <Lists bind:this={lists}/>
  </main>
  <footer>
    <button onclick={lists.downloadConfig} title="Download">↯</button>
  </footer>
</section>

<style>
  :root {
    color-scheme: light dark;
  }

  section {
    margin-inline: 15;
    display: flex;
    flex-direction: column
  }

  header {
    display: flex;
    justify-content: space-between;

    & object {
      max-height: 30vh;
    }

    & > div {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    & p {
      text-align: center;
    }
  }

  main {
    display: flex;
  }
</style>