<script>
  import TailwindWrapper from "./commons/TailwindWrapper.svelte";
  import Banner from "./Banner.svelte";
  import { onMount } from "svelte";

  let selectedRating = 0;
  let hoverStar = 0;
  let currentRating = null;
  let numReviews = 0;
  let loading = true;
  let isVSCode = false;
  let marketplace = "openvsx"; // default

  // Listen for environment handshake
  onMount(() => {
    const handler = (event) => {
      const message = event.data;
      if (message.type === "initEnvironment") {
        isVSCode = message.isVSCode;
        marketplace = message.marketplace;
        window.removeEventListener("message", handler);
        fetchCurrentRating();
      }
    };
    window.addEventListener("message", handler);

    // Fallback: if no message in 1s → assume Open VSX
    setTimeout(() => {
      if (!isVSCode) {
        window.removeEventListener("message", handler);
        fetchCurrentRating();
      }
    }, 1000);
  });

  async function fetchCurrentRating() {
    try {
      if (isVSCode && marketplace === "vscode") {
        // VS Code Marketplace API
        const resp = await fetch("https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
          method: "POST",
          headers: {
            "Accept": "application/json;api-version=7.2-preview.1",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            filters: [{ criteria: [{ filterType: 7, value: "ForceConfigControl.lightning-flow-scanner-vsx" }]}],
            flags: 914
          })
        });
        if (!resp.ok) throw new Error("fetch failed");
        const data = await resp.json();
        const ext = data.results[0]?.extensions[0];
        if (ext) {
          const avg = ext.statistics.find(s => s.statisticName === "averagerating")?.value;
          const count = ext.statistics.find(s => s.statisticName === "ratingcount")?.value;
          currentRating = avg ? avg.toFixed(1) : null;
          numReviews = count || 0;
        }
      } else {
        // Open VSX fallback
        const resp = await fetch("https://open-vsx.org/api/-/reviews?extensionId=ForceConfigControl.lightning-flow-scanner-vsx&targetPlatform=UNIVERSAL");
        if (!resp.ok) throw new Error("fetch failed");
        const reviews = await resp.json();
        const ratings = reviews.map(r => r.rating);
        if (ratings.length > 0) {
          currentRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
          numReviews = ratings.length;
        } else {
          currentRating = null;
          numReviews = 0;
        }
      }
    } catch (e) {
      console.error("Rating fetch error:", e);
      currentRating = null;
      numReviews = 0;
    } finally {
      loading = false;
    }
  }

  function rateAndRedirect(rating) {
    selectedRating = rating;
    if (isVSCode) {
      // Open VS Marketplace extension page (no #review-details to avoid 404)
      tsvscode.postMessage({
        type: "openReviewPage",
        url: "https://marketplace.visualstudio.com/items?itemName=ForceConfigControl.lightning-flow-scanner-vsx"
      });
    } else {
      // Open VSX fallback
      window.open("https://open-vsx.org/extension/ForceConfigControl/lightning-flow-scanner-vsx/reviews", "_blank");
    }
  }

  function openDocumentation() { tsvscode.postMessage({ type: "openDocumentation" }); }
  function configRules()      { tsvscode.postMessage({ type: "configRules" }); }
  function scanFlows()        { tsvscode.postMessage({ type: "scanFlows" }); }
  function fixFlows()         { tsvscode.postMessage({ type: "fixFlows" }); }
</script>

<TailwindWrapper>
  <div class="sb">
    <Banner />
    <nav aria-label="Sidebar" class="flex flex-col gap-3">
      <button class="btn btn-blue" on:click={configRules}>Configure Rules</button>
      <button class="btn btn-blue" on:click={scanFlows}>Scan Flows</button>
      <button class="btn btn-blue" on:click={fixFlows}>Fix Flows</button>
      <button class="btn btn-blue" on:click={openDocumentation}>Documentation</button>

      <div class="mt-4 p-3">
        {#if loading}
          <p class="text-sm text-gray-500 text-center mb-2">Loading rating…</p>
        {:else if currentRating !== null}
          <p class="text-sm text-gray-600 text-center mb-2">
            Current Rating: {currentRating}/5 ({numReviews} review{numReviews !== 1 ? "s" : ""})
          </p>
        {:else}
          <p class="text-sm text-gray-500 text-center mb-2">No reviews yet</p>
        {/if}

        <div class="flex justify-center gap-1">
          {#each [1, 2, 3, 4, 5] as star}
            <button
              class="star-btn text-2xl transition-all duration-200 hover:scale-110 focus:outline-none"
              on:click={() => rateAndRedirect(star)}
              on:mouseover={() => (hoverStar = star)}
              on:mouseout={() => (hoverStar = 0)}
              aria-label={`Rate {star} star${star > 1 ? "s" : ""}`}
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
  .sb {
    @apply flex flex-col;
  }
  .btn {
    @apply font-bold py-2 my-2 px-4 rounded;
  }
</style>