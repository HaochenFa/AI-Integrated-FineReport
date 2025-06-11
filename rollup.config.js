import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const isProd = process.env.NODE_ENV === "production";

export default {
  input: "src/main.js",
  output: {
    file: "dist/ai-integrated-fr.esm.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    isProd &&
      terser({
        format: {
          comments: false,
        },
      }),
  ],
};
