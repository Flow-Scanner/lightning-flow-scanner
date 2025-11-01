  <script>
    import TailwindWrapper from './commons/TailwindWrapper.svelte';
    import Banner from './Banner.svelte'

    function openDocumentation() {
      tsvscode.postMessage({
            type: "openDocumentation"
        });
    }

    function configRules() {
      tsvscode.postMessage({
            type: "configRules"
        });
    }

    function scanFlows() {
      tsvscode.postMessage({
            type: "scanFlows"
        });
    }

    function fixFlows() {
      tsvscode.postMessage({
            type: "fixFlows"
        });
    }

  </script>
  <TailwindWrapper>
    <div class="sb">
    <Banner/>
      <nav aria-label="Sidebar">
        <button class="btn btn-blue" on:click={configRules}>
          Configure Rules
        </button>
        <button class="btn btn-blue" on:click={scanFlows}>
          Scan Flows
        </button>
        <button class="btn btn-blue" on:click={fixFlows}>
          Fix Flows
        </button>
        <button class="btn btn-blue" on:click={openDocumentation}>
          Documentation
        </button>
      </nav>
    </div>
  </TailwindWrapper>
  <style>

    .sb{
      @apply flex flex-col;
    }

    .btn {
      @apply font-bold py-2 my-2 px-4 rounded;
    }
    .btn-blue {
      @apply bg-blue-500 text-white;
    }
    .btn-blue:hover {
      @apply bg-blue-700;
    }
  </style>