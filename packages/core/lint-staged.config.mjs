import micromatch from "micromatch";

const isNotExampleFlows = (files) => micromatch.not(files, ["example-flows/**"]);

export default {
  "**/*.{js,json,md,xml,yaml,yml}": (files) =>
    isNotExampleFlows(files).map((f) => `prettier --write "${f}"`),
};