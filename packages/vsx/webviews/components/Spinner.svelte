<div class="centered">
    <div class="loader" />
</div>

<style>
    .centered {
        width: 100px;
        height: 100px;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
    }

    .loader {
        border: 16px solid #aaa;
        border-top: 16px solid #2765ae;
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: spin 2s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
