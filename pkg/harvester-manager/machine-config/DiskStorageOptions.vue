<script lang="ts">
import { defineComponent, PropType, reactive, toRaw } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';

export const DISK_CACHE_MODES = ['', 'none', 'writeback', 'writethrough'];
export const DISK_IO_MODES = ['', 'native', 'threads'];

export const PROFILE = {
  DEFAULT: 'default',
  HIGH:    'highPerformance',
  CUSTOM:  'custom',
};

const PERFORMANCE_FIELDS = ['cache', 'io', 'dedicatedIOThread'];

export interface Disk {
  cache?: string;
  io?: string;
  dedicatedIOThread?: boolean;
  [key: string]: unknown;
}

/**
 * Disks set to "Custom" before any option was changed. Keyed by the disk object rather than by position, so the
 * choice follows the disk when volumes are moved or removed.
 */
const customRequested = reactive(new WeakSet<Disk>());

export function hasPerformanceOptions(disk: Disk): boolean {
  return !!(disk.cache || disk.io || disk.dedicatedIOThread);
}

export function detectProfile(disk: Disk): string {
  if (customRequested.has(toRaw(disk))) {
    return PROFILE.CUSTOM;
  }

  if (!hasPerformanceOptions(disk)) {
    return PROFILE.DEFAULT;
  }

  if (disk.cache === 'none' && disk.io === 'native' && disk.dedicatedIOThread) {
    return PROFILE.HIGH;
  }

  return PROFILE.CUSTOM;
}

/**
 * Returns a copy of the disk with the given options applied. Unset options are removed rather than left empty,
 * so a pool that never used them keeps the same diskInfo and is not rolled out again.
 */
export function applyPerformanceOptions(disk: Disk, options: Disk): Disk {
  const out: Disk = { ...disk, ...options };

  // Native AIO needs an uncached (O_DIRECT) disk, and the driver rejects any other combination
  if (out.io === 'native') {
    out.cache = 'none';
  }

  PERFORMANCE_FIELDS.forEach((field) => {
    if (!out[field]) {
      delete out[field];
    }
  });

  return out;
}

export default defineComponent({
  name: 'DiskStorageOptions',

  components: { LabeledSelect, Checkbox },

  emits: ['update:value'],

  props: {
    value: {
      type:     Object as PropType<Disk>,
      required: true
    },

    mode: {
      type:    String,
      default: 'create'
    },

    disabled: {
      type:    Boolean,
      default: false
    },
  },

  computed: {
    profile(): string {
      return detectProfile(this.value);
    },

    isCustom(): boolean {
      return this.profile === PROFILE.CUSTOM;
    },

    profileOptions(): { label: string, value: string }[] {
      return Object.values(PROFILE).map((value) => ({
        label: this.t(`cluster.credential.harvester.storageOptions.profile.${ value }`),
        value,
      }));
    },

    cacheOptions(): { label: string, value: string, disabled: boolean }[] {
      return DISK_CACHE_MODES.map((value) => ({
        label:    this.t(`cluster.credential.harvester.storageOptions.cache.${ value || 'default' }`),
        value,
        disabled: this.value.io === 'native' && value !== 'none',
      }));
    },

    ioOptions(): { label: string, value: string }[] {
      return DISK_IO_MODES.map((value) => ({
        label: this.t(`cluster.credential.harvester.storageOptions.io.${ value || 'default' }`),
        value,
      }));
    },
  },

  methods: {
    set(options: Disk) {
      this.$emit('update:value', applyPerformanceOptions(this.value, options));
    },

    setProfile(profile: string) {
      if (profile === PROFILE.CUSTOM) {
        customRequested.add(toRaw(this.value));

        return;
      }

      customRequested.delete(toRaw(this.value));

      if (profile === PROFILE.DEFAULT) {
        this.set({
          cache: '', io: '', dedicatedIOThread: false
        });
      } else if (profile === PROFILE.HIGH) {
        this.set({
          cache: 'none', io: 'native', dedicatedIOThread: true
        });
      }
    },
  },
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :value="profile"
          data-testid="disk-storage-options-profile"
          :label="t('cluster.credential.harvester.storageOptions.profile.label')"
          :tooltip="t('cluster.credential.harvester.storageOptions.profile.tip')"
          :options="profileOptions"
          :mode="mode"
          :disabled="disabled"
          @update:value="setProfile"
        />
      </div>
    </div>

    <template v-if="isCustom">
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect
            :value="value.cache || ''"
            data-testid="disk-storage-options-cache"
            :label="t('cluster.credential.harvester.storageOptions.cache.label')"
            :tooltip="t('cluster.credential.harvester.storageOptions.cache.tip')"
            :options="cacheOptions"
            :mode="mode"
            :disabled="disabled"
            @update:value="set({ cache: $event })"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            :value="value.io || ''"
            data-testid="disk-storage-options-io"
            :label="t('cluster.credential.harvester.storageOptions.io.label')"
            :tooltip="t('cluster.credential.harvester.storageOptions.io.tip')"
            :options="ioOptions"
            :mode="mode"
            :disabled="disabled"
            @update:value="set({ io: $event })"
          />
        </div>
      </div>

      <Checkbox
        :value="!!value.dedicatedIOThread"
        data-testid="disk-storage-options-dedicated-iothread"
        class="mb-10"
        :label="t('cluster.credential.harvester.storageOptions.dedicatedIOThread.label')"
        :tooltip="t('cluster.credential.harvester.storageOptions.dedicatedIOThread.tip')"
        :mode="mode"
        :disabled="disabled"
        @update:value="set({ dedicatedIOThread: $event })"
      />
    </template>
  </div>
</template>
