<script lang="ts">
    import { getRules } from "@flow-scanner/lightning-flow-scanner-core";
    import RuleCard from "./RuleCard.svelte";

    const allRules = getRules();
</script>

{#if !allRules}
<p> no rules </p>
{/if}

{#if allRules}
    <div id="main">
        <h2>Default Rules</h2>
        {#each allRules as rule, i}
            <RuleCard>
                <span slot="label">{i + 1}. {rule.label}</span>
                <span slot="config"> <a href={rule.uri}>{rule.name}</a></span>
                <span slot="description">{rule.description}</span>
                <span slot="docRefs">
                    <ul>
                        {#each rule.docRefs as docRef}
                        <li><a href={docRef.path}>{docRef.label}</a></li>
                        {/each}
                    </ul>
                </span>
            </RuleCard>
        {/each}
    </div>
{/if}
