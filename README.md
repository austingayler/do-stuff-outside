# Hosted at:
https://austingayler.github.io/do-stuff-outside/

## IDEAS:

Enabling DABS PDF directly in the site. We'll need a proxy server due to CORS
https://www.skybriefing.com/dabs

Rain radar slider:
https://www.srf.ch/meteo/radar
https://www.srf.ch/meteo/static/map/layer/radar/web/RONMERCATORWEBP.20250117140000.webp?time=1737010976
Also needs a proxy server to re-serve the images due to CORS

Gipfelbuch report embedding:
https://www.gipfelbuch.ch/verhaeltnisse/uebersicht
Could directly hardcode the regions to care about, such as Bern. On Gipfelbuch that sends a request to 
https://www.gipfelbuch.ch/conditions/list with some form data that you can see in the network tab.


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list


Notes:
CORS is not enabled on the DABS site, so we can't embed the PDF directly.
