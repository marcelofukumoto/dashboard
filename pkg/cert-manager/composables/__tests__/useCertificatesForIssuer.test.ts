import { issuerColumnIndex, loadCertificatesForIssuer } from '../useCertificatesForIssuer';
import { CERT_MANAGER } from '../../types';

const COLUMNS = [
  { name: 'Name' }, { name: 'Ready' }, { name: 'Secret' }, { name: 'Issuer' }, { name: 'Status' }, { name: 'Age' },
];

function mockStore({ columns = COLUMNS, hasSchema = true }: { columns?: any[] | null; hasSchema?: boolean } = {}) {
  const calls: { action: string; payload: any }[] = [];

  return {
    calls,
    getters: {
      'cluster/schemaFor': () => (hasSchema ? { attributes: { columns } } : undefined),
      'cluster/urlFor':    () => '/v1/cert-manager.io.certificates?exclude=metadata.managedFields',
    },
    dispatch: jest.fn((action: string, payload: any) => {
      calls.push({ action, payload });

      return Promise.resolve(action === 'cluster/request' ? { data: [{ id: 'ns/c1' }] } : undefined);
    }),
  } as any;
}

describe('issuerColumnIndex', () => {
  it('finds the Issuer column by name', () => {
    expect(issuerColumnIndex(mockStore())).toBe(3);
  });

  it('is -1 when the column is absent', () => {
    expect(issuerColumnIndex(mockStore({ columns: [{ name: 'Name' }, { name: 'Age' }] }))).toBe(-1);
  });
});

describe('loadCertificatesForIssuer', () => {
  it('filters by the issuer column and loadMultis the result (no full load)', async() => {
    const store = mockStore();

    await loadCertificatesForIssuer(store, { metadata: { name: 'letsencrypt-prod' } });

    const req = store.calls.find((c: any) => c.action === 'cluster/request');

    expect(req.payload.url).toContain('&filter=metadata.fields.3=letsencrypt-prod');
    expect(store.calls.map((c: any) => c.action)).toStrictEqual(['cluster/request', 'cluster/loadMulti']);
    expect(store.dispatch).not.toHaveBeenCalledWith('cluster/findAll', expect.anything());
  });

  it('URL-encodes the issuer name', async() => {
    const store = mockStore();

    await loadCertificatesForIssuer(store, { metadata: { name: 'my issuer/x' } });

    expect(store.calls.find((c: any) => c.action === 'cluster/request').payload.url).toContain('=my%20issuer%2Fx');
  });

  it('falls back to a full load when the issuer column is missing', async() => {
    const store = mockStore({ columns: [{ name: 'Name' }] });

    await loadCertificatesForIssuer(store, { metadata: { name: 'x' } });

    expect(store.calls).toStrictEqual([{ action: 'cluster/findAll', payload: { type: CERT_MANAGER.CERTIFICATE } }]);
  });

  it('does nothing when the user cannot read certificates (no schema)', async() => {
    const store = mockStore({ hasSchema: false });

    await loadCertificatesForIssuer(store, { metadata: { name: 'x' } });

    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
