<script lang="ts">
  import { TabulatorFull as Tabulator } from "tabulator-tables";
  import { onMount } from "svelte";

  export let allResults: any[] = [];
  let tableComponent: HTMLDivElement;
  let table: Tabulator;
  let printData: any[] = [];
  let originalData: any[] = []; // Keep original

  // Update when allResults changes
  $: if (allResults) {
    originalData = allResults.map(r => ({ ...r }));
    printData = originalData;
    if (table) table.setData(originalData);
  }

  onMount(() => {
    table = new Tabulator(tableComponent, {
      data: [],
      reactiveData: false,
      layout: "fitColumns",
      groupBy: ["ruleLabel"],
      groupHeader: (value, count, data) => {
        const desc = data[0]?.ruleDescription || "";
        return `${value} <span>(${count})</span><p style="font-style:italic">${desc}</p>`;
      },
      columns: [
        { title: "#", formatter: "rownum", width: 75 },
        { 
          title: "Name", field: "name", minWidth: 150,
          headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: ""
        },
        { 
          title: "Severity", field: "severity", minWidth: 150,
          headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: ""
        },
        { 
          title: "Type", field: "type", width: 150,
          headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: ""
        },
        { 
          title: "Flow name", field: "flowName", minWidth: 150,
          headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: ""
        },
        { title: "X", field: "locationX", width: 75, headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: "" },
        { title: "Y", field: "locationY", width: 75, headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: "" },
        { title: "Connects to", field: "connectsTo", minWidth: 150, headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: "" },
        { title: "Expression", field: "expression", minWidth: 150, headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: "" },
        { title: "DataType", field: "dataType", width: 150, headerFilter: "input", headerFilterFunc: "like", headerFilterPlaceholder: "" },
      ],
    });
  });

  export function download() {
    tsvscode.postMessage({ type: "download", value: printData });
  }

  function onMessage(e: MessageEvent) {
    const msg = e.data;

    if (msg.type === "applySearchFlowName") {
      const term = (msg.value ?? "").toString().trim();
      applyFlowFilter(term);
      return;
    }

    if (msg.type === "applySearchAttributes") {
      const term = (msg.value ?? "").toString().trim();
      applyAttributeFilter(term);
    }
  }

  // === FLOW NAME FILTER ===
  function applyFlowFilter(term: string) {
    if (!term) {
      table?.setData(originalData);
      return;
    }
    const filtered = originalData.filter(row => 
      row.flowName?.toString().toLowerCase().includes(term.toLowerCase())
    );
    table?.setData(filtered);
  }

  // === ATTRIBUTES FILTER ===
  function applyAttributeFilter(term: string) {
    if (!term) {
      table?.setData(originalData);
      return;
    }
    const filtered = originalData.filter(row => {
      return [
        row.name, row.severity, row.type,
        row.locationX, row.locationY,
        row.connectsTo, row.expression, row.dataType
      ].some(val => val?.toString().toLowerCase().includes(term.toLowerCase()));
    });
    table?.setData(filtered);
  }
</script>

<svelte:window on:message={onMessage} />
<div bind:this={tableComponent} class="tabulator-table" />