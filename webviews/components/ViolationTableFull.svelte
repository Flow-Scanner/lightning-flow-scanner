<script lang="ts">
    import { TabulatorFull as Tabulator } from "tabulator-tables";
    import { onMount } from "svelte";

    export let allResults;
    let tableComponent;
    let table;
    let printData = [];

    onMount(() => {
        for(let result of allResults){
            const detailObj = Object.assign({}, result);
            printData.push(detailObj);
        }
        table = new Tabulator(tableComponent, {
            data: allResults,
            reactiveData: true,
            layout: "fitColumns",
            groupBy: ["ruleLabel"],
            groupHeader: function (value, count, data, group) {
                let description;
                if (data && data.length > 0) {
                    description = data[0].ruleDescription;
                    return (
                        value +
                        "<span>(" +
                        count +
                        ")</span>" +
                        "<p style='font-style: italic'>" +
                        description +
                        "</p>"
                    );
                } else {
                    return (
                        value +
                        "<span style='color:#d00; margin-left:10px;'>(" +
                        count +
                        ")</span>"
                    );
                }
            },
            columns: [
                { 
                    title: "#", 
                    formatter: "rownum", 
                    width: 75
                },
                {
                    title: "Name",
                    field: "name",
                    formatter: "textarea",
                    minWidth: 150,
                },
                {
                    title: "Severity",
                    field: "severity",
                    formatter: "textarea",
                    minWidth: 150,
                },
                {
                    title: "Type",
                    field: "type",
                    formatter: "plaintext",
                    width: 150,
                },
                {
                    title: "Flow name",
                    field: "flowName",
                    formatter: "textarea",
                    minWidth: 150,
                },
                {
                    title: "X coordinates",
                    field: "locationX",
                    width: 75,
                },
                {
                    title: "Y coordinates",
                    field: "locationY",
                    width: 75,
                },
                {
                    title: "Connects to",
                    field: "connectsTo",
                    formatter: "textarea",
                    minWidth: 150,
                },
                {
                    title: "Expression",
                    field: "expression",
                    formatter: "textarea",
                    minWidth: 150,
                },
                {
                    title: "DataType",
                    field: "dataType",
                    width: 150,
                    formatter: "textarea"
                }
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
