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

    function onSearch(e) {
        tsvscode.postMessage({ type: "searchFlowName", value: e.target.value });
    }

    function onSecondarySearch(e) {
        tsvscode.postMessage({ type: "searchAttributes", value: e.target.value });
    }
</script>

<div class="nav-menu">
    <!-- Left Button -->
    {#if currentPage === "overview"}
        <div class="nav-button-left">
            <button on:click={viewAll}>All Results</button>
        </div>
    {:else if currentPage === "viewAll"}
        <div class="nav-button-left">
            <button on:click={viewOverview}>Overview</button>
        </div>
    {/if}

    <div class="search-group">
        <input
            type="search"
            placeholder="Search flow name..."
            on:input={onSearch}
            class="search-input primary"
        />
        <input
            type="search"
            placeholder="Search attributes..."
            on:input={onSecondarySearch}
            class="search-input secondary"
        />
    </div>

    <!-- Download Button -->
    {#if showDownload}
        <div class="nav-button-right">
            <button on:click={download}>Download</button>
        </div>
    {/if}
</div>

<style>
    .nav-menu {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
        height: 50px;
        padding: 0 12px;
        gap: 12px;
    }

    .search-group {
        flex: 1;
        display: flex;
        gap: 12px;
        justify-content: center;
        min-width: 0; /* Allow shrinking */
    }

    .search-input {
        height: 32px;
        padding: 6px 14px;
        border: none;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.95);
        font-size: 13px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        outline: none;
        transition: all 0.2s;
        min-width: 140px;
    }

    .search-input:focus {
        box-shadow: 0 0 0 2px #2765ae;
        background: white;
    }

    .search-input::placeholder {
        color: #999;
        font-style: italic;
    }

    /* Primary (flow name) takes more space */
    .search-input.primary {
        flex: 1.2;
        max-width: 300px;
    }

    /* Secondary (attributes) */
    .search-input.secondary {
        flex: 1;
        max-width: 260px;
    }

    /* Buttons */
    button {
        background: #2765ae;
        color: white;
        border: none;
        border-radius: 14px;
        width: 140px;
        height: 32px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s;
    }

    button:hover {
        background: #1e5190;
        transform: translateY(-1px);
    }

    .nav-button-left,
    .nav-button-right {
        display: flex;
        align-items: center;
    }

    /* Responsive: stack on very small screens */
    @media (max-width: 700px) {
        .nav-menu {
            flex-wrap: wrap;
            height: auto;
            padding: 8px;
            gap: 8px;
        }
        .search-group {
            order: 3;
            width: 100%;
            flex-direction: column;
        }
        .search-input {
            max-width: none;
        }
        .nav-button-left,
        .nav-button-right {
            flex: 1;
        }
    }
</style>