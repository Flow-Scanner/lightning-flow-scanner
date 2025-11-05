<script lang="ts">
    import { TabulatorFull as Tabulator } from "tabulator-tables";
    import { onMount } from "svelte";

    export let scanResults: any[] = [];
    let tableComponent: HTMLDivElement;
    let table: Tabulator;
    let printData: any[] = [];

    const detailButton = () => `<button style="background:#2765ae;border-radius:10px;">Details</button>`;

    onMount(() => {
        printData = scanResults.map(r => {
            const obj = { ...r };
            delete obj.flow;
            delete obj.ruleResults;
            return obj;
        });

        table = new Tabulator(tableComponent, {
            data: scanResults,
            reactiveData: true,
            layout: "fitColumns",
            columns: [
                { title: "# Results", field: "resultCount", hozAlign: "center", bottomCalc: "count", width: 100 },
                {
                    title: "Label", field: "label", minWidth: 150, formatter: "link",
                    formatterParams: (cell: any) => ({ label: cell.getValue(), url: "javascript:void(0);" }),
                    cellClick: (_e: any, cell: any) => {
                        tsvscode.postMessage({ type: "goToFile", value: cell.getRow().getData().flow });
                    },
                    headerFilter: true,
                    headerFilterPlaceholder: "",
                },
                { title: "Flow Type", field: "type", minWidth: 120 },
                {
                    title: "Details", formatter: detailButton, width: 100, hozAlign: "center", print: false,
                    cellClick: (_e: any, cell: any) => {
                        tsvscode.postMessage({ type: "goToDetails", value: cell.getRow().getData() });
                    },
                },
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
            table?.setHeaderFilterValue("label", term);
        }
    }
</script>

<svelte:window on:message={onMessage} />
<div bind:this={tableComponent} class="tabulator-table" />