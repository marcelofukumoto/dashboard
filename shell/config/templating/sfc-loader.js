// Runtime .vue compiler for code-kind custom views.
//
// Wraps vue3-sfc-loader: given SFC source (from a ConfigMap), compiles it in-browser into
// a live Vue component. The component is mounted inside the app tree, so it inherits app
// globals — `this.$store`, `this.$route`, etc. — with no explicit wiring.
//
// Components are resolved LAZILY through a Proxy moduleCache: only the @shell components
// the SFC actually imports get executed (see component-registry). Executing every
// component eagerly disrupts the app.
//
// SECURITY: this executes arbitrary code (vue3-sfc-loader uses `new Function`). It is a
// dev/experimental capability and must stay behind a flag; never a shipping default.
// Requires CSP `unsafe-eval`.

import * as Vue from 'vue';
import { loadModule } from 'vue3-sfc-loader';
import { hasComponent, resolveComponent } from '@shell/config/templating/component-registry';

/**
 * Compile SFC source into a component.
 * @param {string} source   the .vue source
 * @returns {{ component: object, styles: HTMLStyleElement[] }}
 */
export async function compileSFC(source, { filename = 'view.vue' } = {}) {
  const styles = [];
  const base = { vue: Vue };

  // vue3-sfc-loader has no SCSS/SASS/LESS preprocessor. Treat those <style> blocks as plain
  // CSS (custom-view styles are typically flat) by stripping the lang attribute — otherwise
  // the loader tries to import a missing 'scss' module.
  const prepared = source.replace(/(<style[^>]*?)\s+lang=["'](scss|sass|less)["']/gi, '$1');

  // Lazy module cache: `vue` plus any @shell component, resolved (and executed) only when
  // the SFC imports it.
  const moduleCache = new Proxy(base, {
    has(target, prop) {
      return (prop in target) || hasComponent(prop);
    },
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }

      return resolveComponent(prop);
    },
  });

  const options = {
    moduleCache,

    // Keep the import specifier verbatim so it matches the component registry keys
    // (we don't support relative imports in custom views).
    pathResolve: ({ relPath }) => relPath,

    getFile(url) {
      if (url === filename) {
        return prepared;
      }

      // Anything not the entry and not a known component is disallowed.
      throw new Error(`import "${ url }" is not available to custom views`);
    },

    addStyle(textContent) {
      const el = document.createElement('style');

      el.textContent = textContent;
      el.setAttribute('data-custom-view', 'true');
      document.head.appendChild(el);
      styles.push(el);
    },

    log(type, ...args) {
      // eslint-disable-next-line no-console
      (console[type] || console.log)('[custom-view sfc]', ...args);
    },
  };

  const component = await loadModule(filename, options);

  return { component, styles };
}
