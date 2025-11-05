<script>
  import TailwindWrapper from "./commons/TailwindWrapper.svelte";
  import Banner from "./Banner.svelte";

  function openDocumentation() {
    tsvscode.postMessage({
      type: "openDocumentation",
    });
  }

  function configRules() {
    tsvscode.postMessage({
      type: "configRules",
    });
  }

  function scanFlows() {
    tsvscode.postMessage({
      type: "scanFlows",
    });
  }

  function fixFlows() {
    tsvscode.postMessage({
      type: "fixFlows",
    });
  }
</script>

<TailwindWrapper>
  <div class="sb">
    <Banner />

    <nav aria-label="Sidebar" class="flex flex-col gap-3">
      <button class="btn btn-blue" on:click={configRules}>Configure Rules</button>
      <button class="btn btn-blue" on:click={scanFlows}>Scan Flows</button>
      <button class="btn btn-blue" on:click={fixFlows}>Fix Flows</button>
      <button class="btn btn-blue" on:click={openDocumentation}>Documentation</button>
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
  .btn-blue:hover {
    @apply bg-blue-700;
  }
</style>
