import { servicePort, clusterIp, externalName } from '@shell/utils/validators/service';
import { validateDnsLabel, validateHostname } from '@shell/utils/validators';
import { createMockGetters, createErrors, mockT } from './helpers';

jest.mock('@shell/utils/validators', () => ({
  validateDnsLabel: jest.fn().mockReturnValue([]),
  validateHostname: jest.fn().mockReturnValue([]),
}));

const mockValidateDnsLabel = validateDnsLabel as jest.Mock;
const mockValidateHostname = validateHostname as jest.Mock;

describe('servicePort', () => {
  const getters = createMockGetters();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateDnsLabel.mockReturnValue([]);
  });

  describe('externalName type', () => {
    it('returns errors unchanged without port validation', () => {
      const errors = createErrors();
      const result = servicePort({ type: 'ExternalName', ports: [] }, getters, errors, []);

      expect(result).toStrictEqual([]);
    });

    it('returns existing errors unchanged', () => {
      const errors = ['pre-existing error'];
      const result = servicePort({ type: 'ExternalName', ports: null }, getters, errors, []);

      expect(result).toStrictEqual(['pre-existing error']);
    });
  });

  describe('empty ports', () => {
    it('adds required error when ports is empty array', () => {
      const errors = createErrors();
      const result = servicePort({ type: 'ClusterIP', ports: [] }, getters, errors, []);

      expect(result).toStrictEqual([mockT('validation.required', { key: 'Port Rules' })]);
    });

    it('adds required error when ports is null', () => {
      const errors = createErrors();
      const result = servicePort({ type: 'ClusterIP', ports: null }, getters, errors, []);

      expect(result).toStrictEqual([mockT('validation.required', { key: 'Port Rules' })]);
    });
  });

  describe('single port', () => {
    it('adds no errors for a valid port with numeric targetPort', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: '8080' }] },
        getters,
        errors,
        []
      );

      expect(result).toStrictEqual([]);
    });

    it('does not require name for a single port', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: '8080' }] },
        getters,
        errors,
        []
      );

      expect(result).not.toContain(mockT('validation.service.ports.name.required', { position: 1 }));
    });

    it('validates name via validateDnsLabel when name is provided', () => {
      const errors = createErrors();

      servicePort(
        {
          type:  'ClusterIP',
          ports: [{
            name: 'http', port: '80', targetPort: '8080'
          }]
        },
        getters,
        errors,
        []
      );
      expect(mockValidateDnsLabel).toHaveBeenCalledWith('http', 'name', getters, undefined, expect.any(Array));
    });

    it('adds name validation errors when validateDnsLabel returns errors', () => {
      mockValidateDnsLabel.mockReturnValue(['name-error']);
      const errors = createErrors();
      const result = servicePort(
        {
          type:  'ClusterIP',
          ports: [{
            name: 'bad name', port: '80', targetPort: '8080'
          }]
        },
        getters,
        errors,
        []
      );

      expect(result).toContain('name-error');
    });
  });

  describe('multiple ports', () => {
    it('requires name for each port when there are multiple ports', () => {
      const errors = createErrors();
      const result = servicePort(
        {
          type:  'ClusterIP',
          ports: [
            { port: '80', targetPort: '8080' },
            { port: '443', targetPort: '8443' },
          ],
        },
        getters,
        errors,
        []
      );

      expect(result).toContain(mockT('validation.service.ports.name.required', { position: 1 }));
      expect(result).toContain(mockT('validation.service.ports.name.required', { position: 2 }));
    });

    it('does not add name error when name is provided in multiple ports', () => {
      const errors = createErrors();
      const result = servicePort(
        {
          type:  'ClusterIP',
          ports: [
            {
              name: 'http', port: '80', targetPort: '8080'
            },
            {
              name: 'https', port: '443', targetPort: '8443'
            },
          ],
        },
        getters,
        errors,
        []
      );

      expect(result).not.toContain(mockT('validation.service.ports.name.required', { position: 1 }));
      expect(result).not.toContain(mockT('validation.service.ports.name.required', { position: 2 }));
    });
  });

  describe('nodePort validation', () => {
    it('adds error when nodePort is not a valid integer', () => {
      const errors = createErrors();
      const result = servicePort(
        {
          type:  'NodePort',
          ports: [{
            nodePort: 'abc', port: '80', targetPort: '8080'
          }]
        },
        getters,
        errors,
        []
      );

      expect(result).toContain(mockT('validation.service.ports.nodePort.requiredInt', { position: 1 }));
    });

    it('adds no error when nodePort is a valid integer string', () => {
      const errors = createErrors();
      const result = servicePort(
        {
          type:  'NodePort',
          ports: [{
            nodePort: '30080', port: '80', targetPort: '8080'
          }]
        },
        getters,
        errors,
        []
      );

      expect(result).not.toContain(mockT('validation.service.ports.nodePort.requiredInt', { position: 1 }));
    });

    it('adds no error when nodePort is absent', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: '8080' }] },
        getters,
        errors,
        []
      );

      expect(result).not.toContain(mockT('validation.service.ports.nodePort.requiredInt', { position: 1 }));
    });
  });

  describe('port value validation', () => {
    it('adds error when port is not a valid integer', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: 'abc', targetPort: '8080' }] },
        getters,
        errors,
        []
      );

      expect(result).toContain(mockT('validation.service.ports.port.requiredInt', { position: 1 }));
    });

    it('adds error when port is missing', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ targetPort: '8080' }] },
        getters,
        errors,
        []
      );

      expect(result).toContain(mockT('validation.service.ports.port.required', { position: 1 }));
    });
  });

  describe('targetPort validation', () => {
    it('adds error when targetPort is missing', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80' }] },
        getters,
        errors,
        []
      );

      expect(result).toContain(mockT('validation.service.ports.targetPort.required', { position: 1 }));
    });

    it('adds error when numeric targetPort is 0', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: '0' }] },
        getters,
        errors,
        []
      );

      expect(result).toContain(mockT('validation.service.ports.targetPort.between', { position: 1 }));
    });

    it('adds error when numeric targetPort exceeds 65535', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: '65536' }] },
        getters,
        errors,
        []
      );

      expect(result).toContain(mockT('validation.service.ports.targetPort.between', { position: 1 }));
    });

    it('adds no error when numeric targetPort is within valid range', () => {
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: '8080' }] },
        getters,
        errors,
        []
      );

      expect(result).not.toContain(mockT('validation.service.ports.targetPort.between', { position: 1 }));
    });

    it('validates IANA service name targetPort via validateDnsLabel', () => {
      const errors = createErrors();

      servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: 'http' }] },
        getters,
        errors,
        []
      );
      expect(mockValidateDnsLabel).toHaveBeenCalledWith(
        'http',
        expect.any(String),
        getters,
        {
          ianaServiceName: true, maxLength: 15, validChars: 'A-Za-z0-9-'
        },
        expect.any(Array)
      );
    });

    it('adds errors from IANA service name validation', () => {
      mockValidateDnsLabel.mockReturnValue(['iana-error']);
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: 'invalid-iana' }] },
        getters,
        errors,
        []
      );

      expect(result).toContain('iana-error');
    });

    it('adds no error when IANA service name targetPort is valid', () => {
      mockValidateDnsLabel.mockReturnValue([]);
      const errors = createErrors();
      const result = servicePort(
        { type: 'ClusterIP', ports: [{ port: '80', targetPort: 'http' }] },
        getters,
        errors,
        []
      );

      expect(result).not.toContain(mockT('validation.service.ports.targetPort.between', { position: 1 }));
      expect(result).not.toContain(mockT('validation.service.ports.targetPort.required', { position: 1 }));
    });
  });
});

describe('clusterIp', () => {
  const getters = createMockGetters();

  it.each([
    ['ExternalName'],
    ['Unknown'],
    [undefined],
  ])('returns errors unchanged for service type %s', (serviceType) => {
    const errors = createErrors();
    const result = clusterIp({ type: serviceType }, getters, errors, []);

    expect(result).toStrictEqual([]);
  });

  it.each([
    ['ClusterIP'],
    ['NodePort'],
    ['LoadBalancer'],
  ])('returns errors unchanged for service type %s (validation not yet implemented)', (serviceType) => {
    const errors = createErrors();
    const result = clusterIp({ type: serviceType }, getters, errors, []);

    expect(result).toStrictEqual([]);
  });
});

describe('externalName', () => {
  const getters = createMockGetters();

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateHostname.mockReturnValue([]);
  });

  describe('non-ExternalName service types', () => {
    it.each([
      ['ClusterIP'],
      ['NodePort'],
      ['LoadBalancer'],
      [undefined],
    ])('returns errors unchanged for type %s', (serviceType) => {
      const errors = createErrors();
      const result = externalName({ type: serviceType, externalName: 'example.com' }, getters, errors, []);

      expect(result).toStrictEqual([]);
    });
  });

  describe('externalName service type', () => {
    it('adds error when externalName is empty', () => {
      const errors = createErrors();
      const result = externalName({ type: 'ExternalName', externalName: '' }, getters, errors, []);

      expect(result).toContain(mockT('validation.service.externalName.none'));
    });

    it('adds error when externalName is absent', () => {
      const errors = createErrors();
      const result = externalName({ type: 'ExternalName' }, getters, errors, []);

      expect(result).toContain(mockT('validation.service.externalName.none'));
    });

    it('validates hostname via validateHostname when externalName is provided', () => {
      const errors = createErrors();

      externalName({ type: 'ExternalName', externalName: 'my-service.example.com' }, getters, errors, []);
      expect(mockValidateHostname).toHaveBeenCalledWith(
        'my-service.example.com',
        'ExternalName',
        getters,
        undefined,
        expect.any(Array)
      );
    });

    it('adds no error when externalName is valid and validateHostname passes', () => {
      mockValidateHostname.mockReturnValue([]);
      const errors = createErrors();
      const result = externalName({ type: 'ExternalName', externalName: 'my-service.example.com' }, getters, errors, []);

      expect(result).toStrictEqual([]);
    });

    it('adds errors from validateHostname when externalName fails hostname validation', () => {
      mockValidateHostname.mockReturnValue(['hostname-error']);
      const errors = createErrors();
      const result = externalName({ type: 'ExternalName', externalName: 'invalid hostname' }, getters, errors, []);

      expect(result).toContain('hostname-error');
    });
  });
});
