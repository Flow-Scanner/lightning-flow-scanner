<script>
  import TailwindWrapper from "./commons/TailwindWrapper.svelte";
  import Banner from "./Banner.svelte";
  import { onMount } from "svelte";

  let selectedRating = 0;
  let hoverStar = 0;
  let currentRating = null;
  let numReviews = 0;
  let loading = true;

  // -----------------------------------------------------------------
  // 1. Fetch current rating from Open VSX (unchanged)
  // -----------------------------------------------------------------
  async function fetchCurrentRating() {
    try {
      const resp = await fetch(
        "https://open-vsx.org/api/-/reviews?extensionId=ForceConfigControl.lightning-flow-scanner-vsx&targetPlatform=UNIVERSAL"
      );
      if (!resp.ok) throw new Error("fetch failed");
      const reviews = await resp.json();
      const ratings = reviews.map((r) => r.rating);
      if (ratings.length) {
        currentRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        numReviews = ratings.length;
      } else {
        currentRating = null;
        numReviews = 0;
      }
    } catch (e) {
      console.error(e);
      currentRating = null;
      numReviews = 0;
    } finally {
      loading = false;
    }
  }

  // -----------------------------------------------------------------
  // 2. When a star is clicked → tell the extension to open the review page
  // -----------------------------------------------------------------
  function rateAndOpenReviews(rating) {
    selectedRating = rating;                 // keep UI feedback
    tsvscode.postMessage({ type: "openVsxReviews" });
  }

  // -----------------------------------------------------------------
  // 3. Existing helpers (unchanged)
  // -----------------------------------------------------------------
  function openDocumentation() { tsvscode.postMessage({ type: "openDocumentation" }); }
  function configRules()      { tsvscode.postMessage({ type: "configRules" }); }
  function scanFlows()        { tsvscode.postMessage({ type: "scanFlows" }); }
  function fixFlows()         { tsvscode.postMessage({ type: "fixFlows" }); }

  onMount(fetchCurrentRating);
</script>

<TailwindWrapper>
  <div class="sb">
    <Banner />
    <nav aria-label="Sidebar" class="flex flex-col gap-3">
      <button class="btn btn-blue" on:click={configRules}>Configure Rules</button>
      <button class="btn btn-blue" on:click={scanFlows}>Scan Flows</button>
      <button class="btn btn-blue" on:click={fixFlows}>Fix Flows</button>
      <button class="btn btn-blue" on:click={openDocumentation}>Documentation</button>

      <!-- ---------- Rating section ---------- -->
      <div class="mt-4 p-3">
        {#if loading}
          <p class="text-sm text-gray-500 text-center">Loading rating…</p>
        {:else if currentRating}
          <p class="text-sm text-gray-600 text-center mb-2">
            Current Rating: {currentRating}/5 ({numReviews} review{numReviews > 1 ? "s" : ""})
          </p>
        {:else}
          <p class="text-sm text-gray-500 text-center mb-2">No reviews yet</p>
        {/if}

        <div class="flex justify-center gap-1">
          {#each [1, 2, 3, 4, 5] as star}
            <button
              class="star-btn text-2xl transition-all duration-200 hover:scale-110 focus:outline-none"
              on:click={() => rateAndOpenReviews(star)}
              on:mouseover={() => (hoverStar = star)}
              on:mouseout={() => (hoverStar = 0)}
              aria-label={`Rate {star} star${star > 1 ? 's' : ''}`}
            >
              {#if star <= (hoverStar || selectedRating)} ⭐ {:else} ☆ {/if}
            </button>
          {/each}
        </div>
      </div>
    </nav>

    <p class="mt-6 text-center text-sm text-gray-600">
      Since 2021, built by the community.
      <a
        href="https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=contributing-ov-file"
        target="_blank"
        class="text-blue-600 font-medium hover:underline"
      >
        Join us.
      </a>
    </p>
  </div>
</TailwindWrapper>

<style>
  .btn-blue {
    @apply bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition;
  }
  .sb { @apply flex flex-col; }
  .btn { @apply font-bold py-2 my-2 px-4 rounded; }
</style>
