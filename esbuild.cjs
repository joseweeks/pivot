const esbuild = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");
const { Generator } = require("npm-dts");

new Generator({
  entry: "src/index.ts",
  output: "dist/index.d.ts",
}).generate();

const config = {
  entryPoints: ["./src/index.ts"],
  bundle: true,
  // minify: true,
  treeShaking: true,
  plugins: [nodeExternalsPlugin()],
};

esbuild
  .build({
    ...config,
    outfile: "dist/index.js",
    platform: "node",
    format: "cjs",
    target: "node14",
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...config,
    outfile: "dist/index.esm.js",
    platform: "neutral",
    format: "esm",
  })
  .catch(() => process.exit(1));
