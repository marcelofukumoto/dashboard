import { isExtensionProductPrefixedTopLevel, isProductPrefixedTopLevel } from '@shell/utils/extension-product-routing';

describe('fx: isProductPrefixedTopLevel', () => {
  describe('given a host tracking flags per product', () => {
    // A single plugin registering a mix of products - the case the per-product
    // tracking exists to get right.
    const plugin = {
      topLevelProducts:               new Set(['my-product', 'legacy-product']),
      startRouteWithProductByProduct: {
        'my-product':     true,
        'legacy-product': false,
      },
    };

    const cases: [string, string, boolean][] = [
      ['a top-level product using product-prefixed routes', 'my-product', true],
      ['a top-level product that opted out of the prefix', 'legacy-product', false],
      ['a product the plugin extends rather than owns', 'explorer', false],
      ['a product the plugin knows nothing about', 'unknown-product', false],
    ];

    it.each(cases)('should resolve %s to %s', (_label, productId, expected) => {
      expect(isProductPrefixedTopLevel(plugin, productId)).toStrictEqual(expected);
    });

    it('should not fall back to the deprecated boolean when no top-level product is registered', () => {
      // An empty Set is truthy, so this must still take the per-product branch. If it
      // fell through, the stale boolean below would wrongly win.
      const emptyPlugin = {
        topLevelProducts:               new Set<string>(),
        startRouteWithProductByProduct: {},
        topLevelProduct:                true,
      };

      expect(isProductPrefixedTopLevel(emptyPlugin, 'my-product')).toStrictEqual(false);
    });

    it('should resolve to false when the product is top-level but has no routing entry', () => {
      const partialPlugin = {
        topLevelProducts:               new Set(['my-product']),
        startRouteWithProductByProduct: {},
      };

      expect(isProductPrefixedTopLevel(partialPlugin, 'my-product')).toStrictEqual(false);
    });
  });

  describe('given an older 2.15 host, exposing only the plugin-wide boolean', () => {
    it('should treat any product of a top-level plugin as product-prefixed', () => {
      expect(isProductPrefixedTopLevel({ topLevelProduct: true }, 'my-product')).toStrictEqual(true);
    });

    it('should resolve to false when the plugin registered no top-level product', () => {
      expect(isProductPrefixedTopLevel({ topLevelProduct: false }, 'my-product')).toStrictEqual(false);
    });
  });

  describe('given a pre-2.15 host, without V2 product registration', () => {
    it('should resolve to false when neither flag exists', () => {
      expect(isProductPrefixedTopLevel({}, 'my-product')).toStrictEqual(false);
    });
  });

  describe('given incomplete input', () => {
    it('should resolve to false without a plugin', () => {
      expect(isProductPrefixedTopLevel(undefined, 'my-product')).toStrictEqual(false);
    });

    it('should resolve to false without a product id', () => {
      expect(isProductPrefixedTopLevel({ topLevelProduct: true }, undefined)).toStrictEqual(false);
    });

    it('should resolve to false for an empty product id', () => {
      expect(isProductPrefixedTopLevel({ topLevelProduct: true }, '')).toStrictEqual(false);
    });
  });
});

describe('fx: isExtensionProductPrefixedTopLevel', () => {
  // Registers its own top-level product and extends explorer, like the elemental compat build
  const ownerAndExtender = {
    productNames:                   ['mytop', 'explorer'],
    topLevelProducts:               new Set(['mytop']),
    startRouteWithProductByProduct: { mytop: true },
  };

  it('should resolve the plugin-owned top-level product to true', () => {
    expect(isExtensionProductPrefixedTopLevel({ ext: ownerAndExtender }, 'mytop')).toStrictEqual(true);
  });

  it('should resolve a built-in product the plugin only extends to false', () => {
    expect(isExtensionProductPrefixedTopLevel({ ext: ownerAndExtender }, 'explorer')).toStrictEqual(false);
  });

  it('should resolve to true when a later plugin only extends the top-level product', () => {
    const extender = {
      productNames:                   ['mytop'],
      topLevelProducts:               new Set<string>(),
      startRouteWithProductByProduct: {},
    };

    expect(isExtensionProductPrefixedTopLevel({ ext: ownerAndExtender, other: extender }, 'mytop')).toStrictEqual(true);
  });

  it('should ignore plugins that never touched the product', () => {
    const unrelated = { productNames: ['other'], topLevelProduct: true };

    expect(isExtensionProductPrefixedTopLevel({ unrelated }, 'explorer')).toStrictEqual(false);
  });

  it('should resolve to false without plugins or a product id', () => {
    expect(isExtensionProductPrefixedTopLevel(undefined, 'explorer')).toStrictEqual(false);
    expect(isExtensionProductPrefixedTopLevel({ ext: ownerAndExtender }, undefined)).toStrictEqual(false);
  });
});
