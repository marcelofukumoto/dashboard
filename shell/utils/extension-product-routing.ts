/**
 * Compatibility helper for reading top-level product routing flags off an extension's
 * `Plugin` instance.
 *
 * Extensions bundle their own copy of shell (only jquery/jszip/js-yaml are externalised),
 * but the `Plugin` instance itself is always created by the *host* Rancher, in
 * `extension-manager-impl.js`. A bundled reader can therefore be a different shell version
 * than the object it reads, and the flag shape changed between releases:
 *
 * - The first 2.15 releases exposed a plugin-wide `topLevelProduct` boolean. Every top-level
 *   product was unconditionally product-prefixed.
 * - Later releases track `topLevelProducts` and `startRouteWithProductByProduct` per product,
 *   so one plugin can register several products that route differently.
 *
 * Before 2.15 neither flag exists, which correctly resolves to `false`.
 */

/** Minimal shape read here - covers both the plugin-wide and the per-product `Plugin` layouts. */
interface TopLevelProductFlags {
  /** Names of the products this plugin registered as top-level. */
  topLevelProducts?: Set<string>;
  /** Whether each product's routes are prefixed with the product name. */
  startRouteWithProductByProduct?: Record<string, boolean>;
  /** @deprecated Plugin-wide flag, superseded by `topLevelProducts`. */
  topLevelProduct?: boolean;
  /** Every product the plugin registered or extended. */
  productNames?: string[];
}

/**
 * Is `productId` registered by `plugin` as a top-level product whose routes are prefixed
 * with the product name (`<product>/c/:cluster/...` rather than `c/:cluster/<product>/...`)?
 */
export function isProductPrefixedTopLevel(plugin?: TopLevelProductFlags, productId?: string): boolean {
  if (!plugin || !productId) {
    return false;
  }

  // Checked first, and an empty Set is still this branch - a plugin that registered no
  // top-level product must not fall through to the boolean below.
  if (plugin.topLevelProducts) {
    return Boolean(plugin.topLevelProducts.has(productId) && plugin.startRouteWithProductByProduct?.[productId]);
  }

  // Older 2.15 host. It had no `startRouteWithProduct` opt-out and always generated
  // product-prefixed routes, so the plugin-wide boolean is the most it can tell us.
  return Boolean(plugin.topLevelProduct);
}

/**
 * Does any loaded extension own `productId` as a product-prefixed top-level product?
 *
 * Every plugin that touches the product is checked, not just one, so a plugin that only
 * extends the product can't hide the plugin that actually owns it.
 */
export function isExtensionProductPrefixedTopLevel(plugins: Record<string, TopLevelProductFlags> = {}, productId?: string): boolean {
  if (!productId) {
    return false;
  }

  return Object.values(plugins).some((plugin) => !!plugin?.productNames?.includes(productId) && isProductPrefixedTopLevel(plugin, productId));
}
