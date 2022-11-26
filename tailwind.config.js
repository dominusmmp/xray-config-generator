/** @type {import('tailwindcss').Config} */
const {resolve} = require("path");
const {sync} = require("glob");
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: sync(resolve(__dirname, "src", "*.{html,js}")),
  theme: {
    extend: {
      container: {
        center: true,
      },

      // ** Correct Window Height Issue In Different Screens and Browsers
      minHeight: {
        screen: "var(--app-height)",
      },
      maxHeight: {
        screen: "var(--app-height)",
      },
    },
  },
  plugins: [
    // ** Correct Window Height Issue In Different Screens and Browsers
    plugin(function ({addBase}) {
      addBase({
        html: {
          height: "-webkit-fill-available !important",
        },
        body: {
          "min-height": "var(--app-height) !important",
          "min-height": "-webkit-fill-available !important",
        },
      });
    }),
  ],
};
