import { shallowMount } from '@vue/test-utils';
import VmStorageOptions, { DEFAULT_IO_THREAD_COUNT } from '@pkg/harvester-manager/machine-config/VmStorageOptions.vue';

interface VmStorageOptionsVm {
  setIoThreadsPolicy: (policy: string) => void;
}

describe('component: VmStorageOptions', () => {
  const createWrapper = (props = {}) => shallowMount(VmStorageOptions, { props });
  const vmOf = (wrapper: ReturnType<typeof createWrapper>) => wrapper.vm as unknown as VmStorageOptionsVm;

  it('should show the multi-queue and policy fields', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="vm-storage-options-block-multi-queue"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="vm-storage-options-io-threads-policy"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="vm-storage-options-io-thread-count"]').exists()).toStrictEqual(false);
  });

  it('should show the thread count for the supplemental pool policy', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '4' });

    expect(wrapper.find('[data-testid="vm-storage-options-io-thread-count"]').exists()).toStrictEqual(true);
  });

  it.each([
    ['', 'no count'],
    ['0', 'the schema default'],
  ])('should default the thread count when the supplemental pool policy is picked with %p (%s)', (ioThreadCount) => {
    const wrapper = createWrapper({ ioThreadCount });

    vmOf(wrapper).setIoThreadsPolicy('supplementalPool');

    expect(wrapper.emitted('update:ioThreadsPolicy')).toStrictEqual([['supplementalPool']]);
    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([[DEFAULT_IO_THREAD_COUNT]]);
  });

  it('should keep an existing thread count when the supplemental pool policy is picked', () => {
    const wrapper = createWrapper({ ioThreadCount: '8' });

    vmOf(wrapper).setIoThreadsPolicy('supplementalPool');

    expect(wrapper.emitted('update:ioThreadCount')).toBeUndefined();
  });

  it('should clear the thread count when another policy is picked', () => {
    const wrapper = createWrapper({ ioThreadsPolicy: 'supplementalPool', ioThreadCount: '4' });

    vmOf(wrapper).setIoThreadsPolicy('auto');

    expect(wrapper.emitted('update:ioThreadsPolicy')).toStrictEqual([['auto']]);
    expect(wrapper.emitted('update:ioThreadCount')).toStrictEqual([['']]);
  });

  it('should leave the schema default count alone when another policy is picked', () => {
    const wrapper = createWrapper({ ioThreadCount: '0' });

    vmOf(wrapper).setIoThreadsPolicy('auto');

    expect(wrapper.emitted('update:ioThreadCount')).toBeUndefined();
  });

  it('should explain the shared policy when a disk has a dedicated io thread and no policy is set', () => {
    const wrapper = createWrapper({ hasDedicatedIoThread: true });
    const banner = wrapper.findComponent({ name: 'Banner' });

    expect(banner.exists()).toStrictEqual(true);
    expect(banner.attributes().label).toStrictEqual('%cluster.credential.harvester.vmStorageOptions.ioThreadsPolicy.sharedTip%');
  });
});
