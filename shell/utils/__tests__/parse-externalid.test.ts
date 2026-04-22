import { parseExternalId, parseHelmExternalId } from '../parse-externalid';

describe('parseExternalId', () => {
  const nullResult = {
    kind:    null,
    group:   null,
    base:    null,
    id:      null,
    name:    null,
    version: null,
  };

  describe('falsy inputs', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['empty string', ''],
    ])('%s returns all-null object', (_desc, input) => {
      expect(parseExternalId(input)).toStrictEqual(nullResult);
    });
  });

  describe('new-style format (kind://group:name:version)', () => {
    it('parses kind, group, name, version, and templateId', () => {
      const result = parseExternalId('catalog://library:nginx:1.0.0');

      expect(result).toStrictEqual({
        kind:       'catalog',
        group:      'library',
        base:       null,
        id:         'library:nginx:1.0.0',
        name:       'nginx',
        version:    '1.0.0',
        templateId: 'library:nginx',
      });
    });

    it('parses entry with base separator (*)', () => {
      const result = parseExternalId('catalog://library:mybase*myname:1.0.0');

      expect(result).toStrictEqual({
        kind:       'catalog',
        group:      'library',
        base:       'mybase',
        id:         'library:mybase*myname:1.0.0',
        name:       'myname',
        version:    '1.0.0',
        templateId: 'library:mybase*myname',
      });
    });

    it('parses entry without a version (no colon in nameVersion)', () => {
      // kind://group:name  (no trailing :version)
      const result = parseExternalId('custom://mygroup:myname');

      expect(result.kind).toStrictEqual('custom');
      expect(result.group).toStrictEqual('mygroup');
      expect(result.name).toStrictEqual('myname');
      expect(result.version).toBeNull();
    });

    it('parses entry without a group (no colon after kind://)', () => {
      // kind://name  (no group separator in rest)
      const result = parseExternalId('custom://myname');

      expect(result.kind).toStrictEqual('custom');
      expect(result.group).toBeNull();
      expect(result.name).toStrictEqual('myname');
    });

    it('handles a different kind correctly', () => {
      const result = parseExternalId('helm://charts:wordpress:5.0.0');

      expect(result.kind).toStrictEqual('helm');
      expect(result.group).toStrictEqual('charts');
      expect(result.name).toStrictEqual('wordpress');
      expect(result.version).toStrictEqual('5.0.0');
    });
  });

  describe('old-style format (name-version without ://)', () => {
    it('parses a simple name-version pair', () => {
      const result = parseExternalId('nginx-1.0.0');

      expect(result.group).toStrictEqual('library');
      expect(result.name).toStrictEqual('nginx');
      expect(result.version).toStrictEqual('1.0.0');
      expect(result.id).toStrictEqual('library:nginx:1.0.0');
      expect(result.templateId).toStrictEqual('library:nginx');
    });

    it('handles hyphenated name using lastIndexOf for version split', () => {
      const result = parseExternalId('my-app-2.3.1');

      expect(result.group).toStrictEqual('library');
      expect(result.name).toStrictEqual('my-app');
      expect(result.version).toStrictEqual('2.3.1');
      expect(result.id).toStrictEqual('library:my-app:2.3.1');
    });

    it('assigns default group "library"', () => {
      const result = parseExternalId('anything-1.0');

      expect(result.group).toStrictEqual('library');
    });
  });

  describe('templateId construction', () => {
    it('combines group and name without version', () => {
      const result = parseExternalId('catalog://mygroup:myapp:3.0.0');

      expect(result.templateId).toStrictEqual('mygroup:myapp');
    });

    it('includes base in templateId when base separator is present', () => {
      const result = parseExternalId('catalog://repo:base*name:1.0');

      expect(result.templateId).toStrictEqual('repo:base*name');
    });
  });
});

describe('parseHelmExternalId', () => {
  const nullResult = {
    kind:    null,
    group:   null,
    base:    null,
    id:      null,
    name:    null,
    version: null,
  };

  describe('falsy inputs', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['empty string', ''],
    ])('%s returns all-null object', (_desc, input) => {
      expect(parseHelmExternalId(input)).toStrictEqual(nullResult);
    });
  });

  describe('valid helm externalId format', () => {
    it('parses catalog, template, version and builds templateId/templateVersionId', () => {
      const externalId = 'helm:///catalog=mycatalog&template=mytemplate&version=1.2.3';
      const result = parseHelmExternalId(externalId);

      expect(result.kind).toStrictEqual('helm');
      expect(result.id).toStrictEqual(externalId);
      expect(result.catalog).toStrictEqual('mycatalog');
      expect(result.template).toStrictEqual('mytemplate');
      expect(result.version).toStrictEqual('1.2.3');
      expect(result.templateId).toStrictEqual('cattle-global-data:mycatalog-mytemplate');
      expect(result.templateVersionId).toStrictEqual('cattle-global-data:mycatalog-mytemplate-1.2.3');
    });

    it('replaces / with : in catalog when catalog includes a slash', () => {
      const externalId = 'helm:///catalog=ns/catalogname&template=myapp&version=0.1.0';
      const result = parseHelmExternalId(externalId);

      expect(result.templateId).toStrictEqual('ns:catalogname-myapp');
      expect(result.templateVersionId).toStrictEqual('ns:catalogname-myapp-0.1.0');
    });

    it('uses cattle-global-data prefix when catalog has no slash', () => {
      const externalId = 'helm:///catalog=localcatalog&template=chart&version=2.0.0';
      const result = parseHelmExternalId(externalId);

      expect(result.templateId).toStrictEqual('cattle-global-data:localcatalog-chart');
    });
  });
});
