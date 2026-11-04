<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import SortableTable from '@shell/components/SortableTable';
import { Banner } from '@components/Banner';
import { RcStatusBadge, RcStatusIndicator } from '@components/Pill';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { DEFAULT_ROUTE, isFailing, reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { AttemptOutcome, ClusterStatus } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.panel';

const props = defineProps<{ status: ClusterStatus }>();

const emit = defineEmits<{(e: 'navigate'): void}>();

const router = useRouter();
const {
  t, age, reason, clusterMessage, clusterHint
} = useFleetOCIStorageLabels();
const { data, workspace } = useFleetOCIStorage();

const ATTEMPT_DOT: Record<AttemptOutcome, 'success' | 'info' | 'error' | 'none'> = {
  active:  'success',
  waiting: 'info',
  failed:  'error',
  standby: 'none',
};

// A cluster that can't pull has nothing "in use", but the registry it keeps failing on is what needs checking
const registry = computed(() => data.value.registries.find((r) => r.name === (props.status.pullingFrom || props.status.failedRegistry)) || null);
const registryLabel = computed(() => t(`${ ROOT }.${ props.status.pullingFrom ? 'registry' : 'trying' }`));
const message = computed(() => [clusterMessage(props.status), clusterHint(props.status)].filter(Boolean).join(' '));
const bannerColor = computed(() => {
  if (isFailing(props.status.state)) {
    return 'error';
  }

  return props.status.state === 'failover' ? 'warning' : 'info';
});

const routeName = computed(() => props.status.route?.name || t('fleet.ociStorage.routing.defaultRoute'));
const agentUser = computed(() => registry.value?.agentUsername || registry.value?.username || t('fleet.ociStorage.registries.anonymous'));

const tlsLabel = computed(() => {
  if (!registry.value) {
    return '';
  }

  return registry.value.basicHTTP ? t('fleet.ociStorage.tls.basicHTTP') : t(`fleet.ociStorage.tls.${ registry.value.tlsMode }`);
});

const headers = [
  {
    name: 'bundle', labelKey: `${ ROOT }.headers.bundle`, value: 'bundle', sort: ['bundle']
  },
  { name: 'pullState', labelKey: 'tableHeaders.state' },
  {
    name: 'registry', labelKey: `${ ROOT }.headers.registry`, value: 'registry', sort: ['registry', 'bundle']
  },
  { name: 'when', labelKey: `${ ROOT }.headers.pulled` },
  { name: 'duration', labelKey: `${ ROOT }.headers.duration` },
];

const rows = computed(() => props.status.pulls.map((pull) => ({
  key:      pull.artifact.bundle,
  bundle:   pull.artifact.bundle,
  state:    pull.state,
  registry: pull.registry || '',
  when:     pull.minutesAgo,
  duration: pull.durationMs,
})));

function pullBadge(state: string): 'success' | 'info' | 'error' {
  if (state === 'pulled') {
    return 'success';
  }

  return state === 'failed' ? 'error' : 'info';
}

function go(location: object) {
  emit('navigate');
  router.push(location);
}

function editRoute() {
  go({
    name:   'c-cluster-fleet-oci-storage-route-id',
    params: { cluster: BLANK_CLUSTER, id: props.status.route?.name || DEFAULT_ROUTE },
  });
}

function editRegistry(name: string) {
  go({
    name:   'c-cluster-fleet-oci-storage-registry-id',
    params: { cluster: BLANK_CLUSTER, id: name },
  });
}
</script>

<template>
  <div
    class="cluster-pull-panel"
    data-testid="fleet-oci-cluster-panel"
  >
    <Banner
      v-if="message"
      :color="bannerColor"
      :label="message"
      class="m-0"
    />

    <section>
      <h3>{{ t(`${ ROOT }.effective`) }}</h3>
      <dl class="details">
        <dt>{{ t(`${ ROOT }.route`) }}</dt>
        <dd>
          <a
            href="#"
            data-testid="fleet-oci-panel-route"
            @click.prevent="editRoute"
          >{{ routeName }}</a>
        </dd>

        <template v-if="registry">
          <dt>{{ registryLabel }}</dt>
          <dd>
            <a
              href="#"
              @click.prevent="editRegistry(registry!.name)"
            >{{ registry.name }}</a>
          </dd>

          <dt>{{ t(`${ ROOT }.namespace`) }}</dt>
          <dd>{{ reference(registry) }}</dd>

          <dt>{{ t(`${ ROOT }.user`) }}</dt>
          <dd>{{ agentUser }}</dd>

          <dt>{{ t(`${ ROOT }.secret`) }}</dt>
          <dd>{{ workspace }}/{{ registry.name }}</dd>

          <dt>{{ t(`${ ROOT }.tls`) }}</dt>
          <dd>{{ tlsLabel }}</dd>
        </template>
      </dl>
    </section>

    <section v-if="status.attempts.length">
      <h3>{{ t(`${ ROOT }.pullOrder`) }}</h3>
      <ol class="attempts">
        <li
          v-for="attempt in status.attempts"
          :key="attempt.registry"
          :data-testid="`fleet-oci-attempt-${ attempt.registry }`"
        >
          <RcStatusIndicator
            shape="disc"
            :status="ATTEMPT_DOT[attempt.outcome]"
          />
          <a
            href="#"
            @click.prevent="editRegistry(attempt.registry)"
          >{{ attempt.registry }}</a>
          <span class="text-muted">{{ t(`${ ROOT }.attempt.${ attempt.outcome }`) }}</span>
          <span
            v-if="attempt.outcome === 'failed'"
            class="text-error attempt-reason"
          >{{ reason(attempt.access) }}</span>
        </li>
      </ol>
    </section>

    <section v-if="rows.length">
      <h3>{{ t(`${ ROOT }.bundles`) }}</h3>
      <SortableTable
        :headers="headers"
        :rows="rows"
        :search="false"
        :row-actions="false"
        :table-actions="false"
        :paging="false"
        key-field="key"
        default-sort-by="bundle"
      >
        <template #cell:pullState="{ row }">
          <RcStatusBadge :status="pullBadge(row.state)">
            {{ t(`${ ROOT }.pull.${ row.state }`) }}
          </RcStatusBadge>
        </template>
        <template #cell:when="{ row }">
          {{ row.when === null ? '&mdash;' : age(row.when) }}
        </template>
        <template #cell:duration="{ row }">
          {{ row.duration === null ? '&mdash;' : `${ row.duration } ms` }}
        </template>
      </SortableTable>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.cluster-pull-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;

  h3 {
    margin-bottom: 12px;
  }
}

.details {
  display: grid;
  grid-template-columns: minmax(140px, max-content) 1fr;
  gap: 8px 24px;
  margin: 0;

  dt {
    color: var(--muted);
    font-weight: normal;
  }

  dd {
    margin: 0;
    word-break: break-all;
  }
}

.attempts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }

  .attempt-reason {
    width: 100%;
    padding-left: 18px;
    font-size: 12px;
  }
}
</style>
