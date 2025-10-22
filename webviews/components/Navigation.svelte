<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let currentPage;
    export let showDownload = false;

    function viewAll() {
        dispatch("navigate", "viewAll");
    }

    function viewOverview() {
        dispatch("navigate", "overview");
    }

    export function navigate(event, data) {
        const navitem = event.detail;
        if (navitem === "viewAll") {
            tsvscode.postMessage({
                type: "viewAll",
                value: data,
            });
        } else if(navitem === "overview"){
            tsvscode.postMessage({
                type: "overview",
                value: data,
            });
        }
    }

    function download() {
        dispatch("download", currentPage);
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
    <div class="banner-container">
        <div class="banner">
            <a href="https://github.com/Lightning-Flow-Scanner">
                <img
                    src="https://raw.githubusercontent.com/Flow-Scanner/lightning-flow-scanner-core/main/assets/media/bannerslim.png"
                    alt="Lightning Flow Scanner banner"
                />
            </a>
        </div>
    </div>
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
        text-align: center;
    }

    .banner-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 75px;
    }

    .banner {
        text-align: center;
        width: 100%;
        height: 75px;
    }

    .banner img {
        width: 100%;
        height: auto;
    }

    button {
        background-color: #2765ae;
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 5px 5px 5px #000;
        border-radius: 15px;
    }

    .nav-button-left button,
    .nav-button-right button {
        width: 150px;
    }
</style>
