import { onMounted, ref, Ref } from 'vue';
import { useStore } from 'vuex';
import type { Store } from 'vuex';

interface OwnedRef {
  type: string;
  id: string;
}

/**
 * The ids of a resource's OWNED children among `wanted`. Steve exposes the ownership graph on
 * `metadata.relationships`: an owned child carries `toId`, while the owner is a `fromType` entry
 * with no `toId`. Following only the `toId` links walks strictly downward, so there are no cycles.
 */
export function ownedChildren(resource: any, wanted: Set<string>): OwnedRef[] {
  const rels = resource?.metadata?.relationships || [];

  return rels
    .filter((r: any) => r.toId && wanted.has(r.toType))
    .map((r: any) => ({ type: r.toType, id: r.toId }));
}

/**
 * Load exactly the resources a detail page references, by id, without loading the whole type.
 *
 * cert-manager builds an ownership chain (Certificate → CertificateRequest → Order → Challenge).
 * Starting from `parent`, we follow its owned (`toId`) relationships and `find` each child by id,
 * walking transitively so a Certificate reaches its Orders and Challenges. Each `find` populates the
 * store, so the model getters that read `cluster/all(type)` see just this chain. Types the user
 * cannot read (no schema) are skipped, matching the previous fetch-all's permission handling.
 */
export async function loadOwnedResources(store: Store<any>, parent: any, childTypes: string[]): Promise<void> {
  const wanted = new Set(childTypes);
  const seen = new Set<string>();
  let frontier = ownedChildren(parent, wanted);

  while (frontier.length) {
    const nextFrontier: OwnedRef[] = [];

    await Promise.all(frontier.map(async({ type, id }) => {
      if (seen.has(id) || !store.getters['cluster/schemaFor'](type)) {
        return;
      }
      seen.add(id);

      const child = await store.dispatch('cluster/find', { type, id });

      if (child) {
        nextFrontier.push(...ownedChildren(child, wanted));
      }
    }));

    frontier = nextFrontier;
  }
}

/**
 * Detail-page composable: loads a resource's owned children (see {@link loadOwnedResources}) and
 * flips `loaded` once they settle. Callers gate the related-data parts of their template on
 * `loaded`, since the model getters read a store that is empty until the children are fetched.
 */
export function useOwnedResources(parent: any, childTypes: string[]): { loaded: Ref<boolean> } {
  const store = useStore();
  const loaded = ref(false);

  onMounted(async() => {
    try {
      await loadOwnedResources(store, parent, childTypes);
    } finally {
      loaded.value = true;
    }
  });

  return { loaded };
}
