<script lang="ts">
  import { TabulatorFull as Tabulator } from "tabulator-tables";
  import { onMount } from "svelte";

  export let allResults: any[] = [];
  let tableComponent: HTMLDivElement;
  let table: Tabulator;
  let printData: any[] = [];

  onMount(() => {
    printData = allResults.map((r) => ({ ...r }));

    table = new Tabulator(tableComponent, {
      data: allResults,
      reactiveData: true,
      layout: "fitColumns",
      groupBy: ["ruleLabel"],
      groupHeader: (value, count, data) => {
        const desc = data[0]?.ruleDescription || "";
        return `${value} <span>(${count})</span><p style="font-style:italic">${desc}</p>`;
      },
      columns: [
        { title: "#", formatter: "rownum", width: 75 },
        { title: "Name", field: "name", minWidth: 150 },
        { title: "Severity", field: "severity", minWidth: 150 },
        { title: "Type", field: "type", width: 150 },
        {
          title: "Flow name",
          field: "flowName",
          minWidth: 150,
          headerFilter: true,
          headerFilterPlaceholder: "",
        },
        { title: "X", field: "locationX", width: 75 },
        { title: "Y", field: "locationY", width: 75 },
        { title: "Connects to", field: "connectsTo", minWidth: 150 },
        { title: "Expression", field: "expression", minWidth: 150 },
        { title: "DataType", field: "dataType", width: 150 },
      ],
    });
  });

  export function download() {
    tsvscode.postMessage({ type: "download", value: printData });
  }

  function onMessage(e: MessageEvent) {
    const msg = e.data;
    if (msg.type === "applySearchFlowName") {
      const term = (msg.value ?? "").trim();
      if (!term) {
        table?.clearHeaderFilter();
        return;
      }
      table?.setHeaderFilterValue("flowName", term);
    }
    if (msg.type === "applySearchAttributes") {
      const term = (msg.value ?? "").trim();

      if (!term) {
        table?.clearHeaderFilter(["resultCount", "type"]);
        return;
      }

      // Option 1: Use built-in OR via custom filter
      table?.setFilter(
        [
          { field: "resultCount", type: "like", value: term },
          { field: "type", type: "like", value: term },
        ],
        "or"
      );
      return;
    }
  }
</script>

<svelte:window on:message={onMessage} />
<div bind:this={tableComponent} class="tabulator-table" />
