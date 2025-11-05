<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
    export let currentPage;
    export let showDownload = false;

    function viewAll() { dispatch("navigate", "viewAll"); }
    function viewOverview() { dispatch("navigate", "overview"); }

    export function navigate(event, data) {
        const navitem = event.detail;
        if (navitem === "viewAll") {
            tsvscode.postMessage({ type: "viewAll", value: data });
        } else if (navitem === "overview") {
            tsvscode.postMessage({ type: "overview", value: data });
        }
    }

    function download() { dispatch("download", currentPage); }

    // Global search → only flow name
    function onSearch(e) {
        tsvscode.postMessage({ type: "searchFlowName", value: e.target.value });
    }
</script>

<div class="nav-menu">
    {#if currentPage === "overview"}
        <div class="nav-button-left">
            <button on:click={viewAll}>All Results</button>
        </div>
    {:else if currentPage === "viewAll"}
        <div class="nav-button-left">
            <button on:click={viewOverview}>Overview</button>
        </div>
    {/if}

    <div class="center-container">
        <input
            type="search"
            placeholder="Search flow name..."
            on:input={onSearch}
            class="flow-search-input"
        />
    </div>

    {#if showDownload}
        <div class="nav-button-right">
            <button on:click={download}>Download</button>
        </div>
    {/if}
</div>

<style>
    .nav-menu { display: flex; justify-content: space-between; align-items: center; color: white; }
    .center-container { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .banner { width: 100%; height: 75px; text-align: center; }
    .banner img { width: 100%; height: auto; }
    .flow-search-input {
        margin-top: 6px; width: 100%; max-width: 260px; height: 34px;
        padding: 6px 12px; border: none; border-radius: 17px;
        background: rgba(255,255,255,0.95); font-size: 13px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2); outline: none;
    }
    .flow-search-input:focus { box-shadow: 0 0 0 2px #2765ae; }
    button { background: #2765ae; color: white; border: none; border-radius: 15px; width: 150px; cursor: pointer; }
</style>