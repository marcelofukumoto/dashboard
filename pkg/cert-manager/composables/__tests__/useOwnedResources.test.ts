import { ownedChildren, loadOwnedResources } from '../useOwnedResources';
import { CERT_MANAGER } from '../../types';

const rel = (toType: string | null, toId: string | null, fromType?: string) => ({
  rel: 'owner', toType, toId, fromType
});

const withRels = (id: string, rels: any[]) => ({ id, metadata: { relationships: rels } });

describe('ownedChildren', () => {
  it('keeps only owned (toId) links whose type is wanted', () => {
    const wanted = new Set([CERT_MANAGER.ORDER]);
    const resource = withRels('r', [
      rel(CERT_MANAGER.ORDER, 'ns/order-1'), // owned + wanted -> kept
      rel(CERT_MANAGER.CHALLENGE, 'ns/challenge-1'), // owned but not wanted -> dropped
      rel(null, null, CERT_MANAGER.CERTIFICATE), // upward owner (no toId) -> dropped
    ]);

    expect(ownedChildren(resource, wanted)).toStrictEqual([{ type: CERT_MANAGER.ORDER, id: 'ns/order-1' }]);
  });

  it('is empty when there are no relationships', () => {
    expect(ownedChildren({ metadata: {} }, new Set([CERT_MANAGER.ORDER]))).toStrictEqual([]);
  });
});

describe('loadOwnedResources', () => {
  function mockStore(graph: Record<string, any>, opts: { missingSchemaFor?: string[] } = {}) {
    const found: { type: string; id: string }[] = [];
    const missing = new Set(opts.missingSchemaFor || []);

    return {
      found,
      getters:  { 'cluster/schemaFor': (type: string) => (missing.has(type) ? undefined : { id: type }) },
      dispatch: jest.fn((action: string, { type, id }: { type: string; id: string }) => {
        found.push({ type, id });

        return Promise.resolve(graph[id] || null);
      }),
    } as any;
  }

  it('walks the ownership chain transitively, fetching each child by id', async() => {
    // Certificate -> CertificateRequest -> Order -> Challenge
    const graph = {
      'ns/cr-1':    withRels('ns/cr-1', [rel(CERT_MANAGER.ORDER, 'ns/order-1')]),
      'ns/order-1': withRels('ns/order-1', [rel(CERT_MANAGER.CHALLENGE, 'ns/chal-1')]),
      'ns/chal-1':  withRels('ns/chal-1', []),
    };
    const store = mockStore(graph);
    const certificate = withRels('ns/cert', [rel(CERT_MANAGER.CERTIFICATE_REQUEST, 'ns/cr-1')]);

    await loadOwnedResources(store, certificate, [CERT_MANAGER.CERTIFICATE_REQUEST, CERT_MANAGER.ORDER, CERT_MANAGER.CHALLENGE]);

    expect(store.found).toStrictEqual([
      { type: CERT_MANAGER.CERTIFICATE_REQUEST, id: 'ns/cr-1' },
      { type: CERT_MANAGER.ORDER, id: 'ns/order-1' },
      { type: CERT_MANAGER.CHALLENGE, id: 'ns/chal-1' },
    ]);
  });

  it('skips a child type the user cannot read (no schema)', async() => {
    const store = mockStore({}, { missingSchemaFor: [CERT_MANAGER.CHALLENGE] });
    const order = withRels('ns/order', [rel(CERT_MANAGER.CHALLENGE, 'ns/chal-1')]);

    await loadOwnedResources(store, order, [CERT_MANAGER.CHALLENGE]);

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('fetches a shared child only once', async() => {
    // Two requests both owning the same order (dedup by id).
    const graph = { 'ns/order-1': withRels('ns/order-1', []) };
    const store = mockStore(graph);
    const parent = withRels('ns/p', [
      rel(CERT_MANAGER.ORDER, 'ns/order-1'),
      rel(CERT_MANAGER.ORDER, 'ns/order-1'),
    ]);

    await loadOwnedResources(store, parent, [CERT_MANAGER.ORDER]);

    expect(store.found).toStrictEqual([{ type: CERT_MANAGER.ORDER, id: 'ns/order-1' }]);
  });
});
