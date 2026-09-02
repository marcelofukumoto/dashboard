import { onMounted, ref, Ref } from 'vue';
import { useStore } from 'vuex';
import type { Store } from 'vuex';
import { CERT_MANAGER } from '../types';

/**
 * Index of the Certificate list's "Issuer" printer column (`metadata.fields.N`), or -1 if the
 * schema does not expose it. Looked up by column name so it survives the columns being reordered.
 */
export function issuerColumnIndex(store: Store<any>): number {
  const columns = store.getters['cluster/schemaFor'](CERT_MANAGER.CERTIFICATE)?.attributes?.columns || [];

  return columns.findIndex((c: any) => (c?.name || '').toLowerCase() === 'issuer');
}

/**
 * Load the Certificates that reference this Issuer/ClusterIssuer, without loading every Certificate.
 *
 * The issuer name is indexed as a printer column, which Steve can filter on (the raw
 * `spec.issuerRef.name` path is not). So we fetch only Certificates whose issuer column matches this
 * name and `loadMulti` them into the store; the model's `certificates` getter then narrows by
 * issuerRef kind + namespace. `loadMulti` is additive and does not mark the type fully loaded, so
 * other Certificate consumers are unaffected. If the column is missing we fall back to a full load
 * so the list still renders.
 */
export async function loadCertificatesForIssuer(store: Store<any>, issuer: any): Promise<void> {
  if (!store.getters['cluster/schemaFor'](CERT_MANAGER.CERTIFICATE)) {
    return;
  }

  const name = issuer?.metadata?.name;
  const idx = issuerColumnIndex(store);

  if (idx < 0 || !name) {
    await store.dispatch('cluster/findAll', { type: CERT_MANAGER.CERTIFICATE });

    return;
  }

  const url = `${ store.getters['cluster/urlFor'](CERT_MANAGER.CERTIFICATE) }&filter=metadata.fields.${ idx }=${ encodeURIComponent(name) }`;
  const res = await store.dispatch('cluster/request', { url });

  await store.dispatch('cluster/loadMulti', res?.data || []);
}

/**
 * Detail-page composable: loads the Certificates referencing an Issuer/ClusterIssuer and flips
 * `loaded` once they settle. Callers gate the related-data parts of their template on `loaded`.
 */
export function useCertificatesForIssuer(issuer: any): { loaded: Ref<boolean> } {
  const store = useStore();
  const loaded = ref(false);

  onMounted(async() => {
    try {
      await loadCertificatesForIssuer(store, issuer);
    } finally {
      loaded.value = true;
    }
  });

  return { loaded };
}
