<script lang="ts">
  import { onMount } from "svelte";
  import NavigationBanner from "./Navigation.svelte";
  import ViolationTableFull from "./ViolationTableFull.svelte";

  let results;
  let scanResults;
  let allResults;

  onMount(() => {
    tsvscode.postMessage({ type: "init-view" });
  });

  let banner;

  $: {
    let details = [];
    if (scanResults) {
      for (let scanResult of scanResults) {
        for (let ruleResult of scanResult.ruleResults) {
          let ruleDescription = ruleResult.ruleDefinition.description;
          let ruleLabel = ruleResult.ruleDefinition.label;
          let flowName = scanResult.flow.name;
          let severity = ruleResult.severity ?? "warning";

          let initobj = { ruleDescription, ruleLabel, flowName, severity };

          if (ruleResult.occurs) {
            for (let detail of ruleResult.details) {
              let name = detail.name || "";
              let type = detail.type || "";
              let metaType = detail.metaType || "";
              let dataType = detail.details?.dataType || "";
              let locationX = detail.details?.locationX || "";
              let locationY = detail.details?.locationY || "";
              let connectsTo = detail.details?.connectsTo?.join() || "";
              let expression = detail.details?.expression || "";

              details.push(Object.assign(structuredClone(initobj), {
                name, type, metaType, dataType,
                locationX, locationY, connectsTo, expression
              }));
            }
          }
        }
      }
    }
    allResults = details;
  }

  function windowMessage(event: MessageEvent) {
    const message = event.data;
    switch (message.type) {
      case "init":
        const state = tsvscode.getState();
        scanResults = state?.value ?? message.value;
        break;
      case "update":
        scanResults = message.value;
        tsvscode.setState({ scanResults });
        break;
    }
  }
</script>

<svelte:window on:message={windowMessage} />

<NavigationBanner
  currentPage="viewAll"
  showDownload
  bind:this={banner}
  on:navigate={(e) => banner.navigate(e, scanResults)}
  on:download={() => results?.download()}
/>

{#if allResults?.length}
  <ViolationTableFull bind:this={results} bind:allResults />
{/if}