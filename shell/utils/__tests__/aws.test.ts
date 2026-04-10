import { isIpv4Network, isIpv6Network, getVpcDisplayName, getSubnetDisplayName } from '@shell/utils/aws';
import { Subnet, VPC } from '@shell/types/aws-sdk';

describe('aws utils', () => {
  describe('isIpv4Network', () => {
    it('should return true for a VPC with a CidrBlock', () => {
      const vpc: VPC = { VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16' };

      expect(isIpv4Network(vpc)).toBe(true);
    });

    it('should return false for a VPC without a CidrBlock', () => {
      const vpc: VPC = { VpcId: 'vpc-1' };

      expect(isIpv4Network(vpc)).toBe(false);
    });

    it('should return false for a VPC with an empty CidrBlock', () => {
      const vpc: VPC = { VpcId: 'vpc-1', CidrBlock: '' };

      expect(isIpv4Network(vpc)).toBe(false);
    });

    it('should return true for a Subnet with a CidrBlock', () => {
      const subnet: Subnet = {
        VpcId: 'vpc-1', SubnetId: 'subnet-1', CidrBlock: '10.0.1.0/24'
      };

      expect(isIpv4Network(subnet)).toBe(true);
    });

    it('should return false for a Subnet without a CidrBlock', () => {
      const subnet: Subnet = { VpcId: 'vpc-1', SubnetId: 'subnet-1' };

      expect(isIpv4Network(subnet)).toBe(false);
    });
  });

  describe('isIpv6Network', () => {
    it('should return true for a VPC with IPv6 CIDR associations', () => {
      const vpc: VPC = {
        VpcId:                       'vpc-1',
        Ipv6CidrBlockAssociationSet: [{ Ipv6CidrBlock: '2600:1f14::/56' }],
      };

      expect(isIpv6Network(vpc)).toBe(true);
    });

    it('should return false for a VPC with an empty IPv6 CIDR set', () => {
      const vpc: VPC = { VpcId: 'vpc-1', Ipv6CidrBlockAssociationSet: [] };

      expect(isIpv6Network(vpc)).toBe(false);
    });

    it('should return false for a VPC with no IPv6 CIDR set', () => {
      const vpc: VPC = { VpcId: 'vpc-1' };

      expect(isIpv6Network(vpc)).toBe(false);
    });

    it('should return true for a Subnet with IPv6 CIDR associations', () => {
      const subnet: Subnet = {
        VpcId:                       'vpc-1',
        SubnetId:                    'subnet-1',
        Ipv6CidrBlockAssociationSet: [{ Ipv6CidrBlock: '2600:1f14::/64' }],
      };

      expect(isIpv6Network(subnet)).toBe(true);
    });
  });

  describe('getVpcDisplayName', () => {
    it('should return "Name (VpcId)" when a Name tag is present', () => {
      const vpc: VPC = {
        VpcId: 'vpc-abc123',
        Tags:  [{ Key: 'Name', Value: 'my-vpc' }],
      };

      expect(getVpcDisplayName(vpc)).toBe('my-vpc (vpc-abc123)');
    });

    it('should return VpcId when no tags are present', () => {
      const vpc: VPC = { VpcId: 'vpc-abc123' };

      expect(getVpcDisplayName(vpc)).toBe('vpc-abc123');
    });

    it('should return VpcId when tags exist but none is a Name tag', () => {
      const vpc: VPC = {
        VpcId: 'vpc-abc123',
        Tags:  [{ Key: 'Env', Value: 'production' }],
      };

      expect(getVpcDisplayName(vpc)).toBe('vpc-abc123');
    });
  });

  describe('getSubnetDisplayName', () => {
    it('should return "Name (SubnetId)" when a Name tag is present', () => {
      const subnet: Subnet = {
        VpcId:    'vpc-1',
        SubnetId: 'subnet-xyz',
        Tags:     [{ Key: 'Name', Value: 'my-subnet' }],
      };

      expect(getSubnetDisplayName(subnet)).toBe('my-subnet (subnet-xyz)');
    });

    it('should return SubnetId when no tags are present', () => {
      const subnet: Subnet = { VpcId: 'vpc-1', SubnetId: 'subnet-xyz' };

      expect(getSubnetDisplayName(subnet)).toBe('subnet-xyz');
    });

    it('should return SubnetId when tags exist but none is a Name tag', () => {
      const subnet: Subnet = {
        VpcId:    'vpc-1',
        SubnetId: 'subnet-xyz',
        Tags:     [{ Key: 'Env', Value: 'staging' }],
      };

      expect(getSubnetDisplayName(subnet)).toBe('subnet-xyz');
    });
  });
});
