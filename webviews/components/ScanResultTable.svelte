<script lang="ts">
    import { TabulatorFull as Tabulator } from "tabulator-tables";
    import { onMount } from "svelte";

    export let scanResults;
    let tableComponent;
    let table;
    let printData = [];

    var detailButton = function (cell, formatterParams, onRendered) {
        return `<button style="background-color: #2765ae;border-radius: 10px;">Details</button>`;
    };

    onMount(() => {
        for(let scanResult of scanResults){
            const detailObj = Object.assign({}, scanResult);
            delete detailObj.flow;
            delete detailObj.ruleResults;
            printData.push(detailObj);
        }
        table = new Tabulator(tableComponent, {
            data: scanResults,
            reactiveData: true,
            layout: "fitColumns",
            columns: [
                {
                    title: "# Results",
                    field: "resultCount",
                    hozAlign: "center",
                    bottomCalc: "count",
                    width: 100,
                },
                {
                    title: "Label",
                    field: "label",
                    formatter: "link",
                    minWidth: 150,
                    cellClick: function (e, cell) {
                        tsvscode.postMessage({
                            type: "goToFile",
                            value: cell.getRow().getData().flow,
                        });
                    },
                },
                { 
                    title: "Flow Type", 
                    field: "type", 
                    formatter: "plaintext", 
                    minWidth: 120 
                },
                {
                    title: "% Test Coverage",
                    field: "coverage",
                    hozAlign: "center",
                    width: 100,
                },
                {
                    title: "Details",
                    formatter: detailButton,
                    width: 100,
                    hozAlign: "center",
                    print: false,
                    cellClick: function (e, cell) {
                        tsvscode.postMessage({
                            type: "goToDetails",
                            value: cell.getRow().getData(),
                        });
                    },
                },
            ],
        });
    });

    export function download() {
        tsvscode.postMessage({
            type: "download",
            value: printData
        });
    }
</script>

<div bind:this={tableComponent} />
