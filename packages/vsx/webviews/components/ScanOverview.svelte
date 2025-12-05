<script lang="ts">
    import { onMount } from "svelte";
    import ScanResultTable from "./ScanResultTable.svelte";
    import NavigationBanner from "./Navigation.svelte";
    import Spinner from "./Spinner.svelte"

    onMount(() => {
        tsvscode.postMessage({ type: "init-view" });
    });
    let sortByColumn = "label";
    let sortByAscending = false;
    let scanResults;
    let banner;
    let overview;

    $: {
        if (scanResults) {
            scanResults.forEach((scanResult) => {
                scanResult.resultCount = scanResult.ruleResults.reduce(
                    (total, rule) => {
                        if (rule.occurs) {
                            total = total + rule.details.length;
                        }
                        return total;
                    },
                    0
                );
                scanResult.label = scanResult.flow.label;
                scanResult.type = scanResult.flow.type;
            });
            scanResults = scanResults;
        }
    }

    function windowMessage(event) {
        const message = event.data;
        switch (message.type) {
            case "init":
                scanResults = message.value;
                return;
            case "update":
                scanResults = message.value;
                return;
        }
    }

    function sort(results, column) {
        if (sortByColumn === column) {
            sortByAscending = !sortByAscending;
        } else {
            sortByColumn = column;
            sortByAscending = true;
        }

        let sortModifier = sortByAscending ? 1 : -1;
        let sort = (a, b) =>
            a[column] < b[column]
                ? -1 * sortModifier
                : a[column] > b[column]
                ? 1 * sortModifier
                : 0;
        return (results = results.sort(sort));
    }

</script>

<svelte:window on:message={windowMessage} />
<NavigationBanner showDownload currentPage="overview" bind:this={banner} on:navigate={e => banner.navigate(e, scanResults)} on:download={() => overview.download()}/>

{#if scanResults && scanResults.length > 0}
    <ScanResultTable bind:this={overview} bind:scanResults />
{:else} 
    <Spinner />
{/if}
