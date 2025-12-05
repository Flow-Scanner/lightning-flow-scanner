<slot />

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  button {
    outline: none !important;
  }

  button:hover {
    background-color: #2e2e2e;
    color: white;
  }

  button:disabled {
    @apply text-neutral-500 cursor-not-allowed;
  }
  /* button:hover:disabled {
    @apply bg-screen;
  } */
  input[type='checkbox'] {
    accent-color: #2e2e2e !important;
    outline: none !important;
  }

  .link {
    @apply text-sky-600;
  }
</style>
