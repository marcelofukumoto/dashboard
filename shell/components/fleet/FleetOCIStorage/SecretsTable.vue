<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable';
import { RcTag } from '@components/Pill';
import { STATE } from '@shell/config/table-headers';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import CredentialSetList from '@shell/components/fleet/FleetOCIStorage/CredentialSetList.vue';
import { SECRET_STATE_COLORS, reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { OCI_TABLE_SCHEMAS } from '@shell/components/fleet/FleetOCIStorage/tableConfig';
import { useFleetOCIStorage } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorage';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';

const ROOT = 'fleet.ociStorage.secrets';

const store = useStore();
const router = useRouter();
const { t, age, tlsLabel } = useFleetOCIStorageLabels();
const { workspace, secretStatuses, deleteSecret } = useFleetOCIStorage();

const STATE_SORT = {
  error: 0, active: 1, unused: 2
};

const headers = [
  STATE,
  {
    name: 'name', labelKey: 'tableHeaders.name', value: 'name', sort: ['name'], width: 200
  },
  {
    name: 'push', labelKey: `${ ROOT }.headers.push`, value: 'pushReference', sort: ['pushReference'], width: 240
  },
  {
    name: 'sets', labelKey: `${ ROOT }.headers.sets`, value: 'setCount', sort: ['setCount'], align: 'right', width: 110
  },
  {
    name: 'usedBy', labelKey: `${ ROOT }.headers.usedBy`, value: 'usedByLabel', sort: ['gitRepoCount'], width: 110
  },
  {
    name: 'deployments', labelKey: `${ ROOT }.headers.deployments`, value: 'deploymentsLabel', sort: ['failing', 'name'], width: 150
  },
];

function confirmDelete(name: string, gitRepos: string[]) {
  const body = gitRepos.length ? `${ t(`${ ROOT }.delete.body`) } ${ t(`${ ROOT }.delete.bodyUsed`, { gitRepos: gitRepos.join(', ') }) }` : t(`${ ROOT }.delete.body`);

  store.dispatch('management/promptModal', {
    component:      'GenericPrompt',
    componentProps: {
      title:       t(`${ ROOT }.delete.title`, { name }),
      body,
      applyMode:   'delete',
      actionColor: 'bg-error',
      applyAction: async() => deleteSecret(name),
    },
  });
}

const rows = computed(() => secretStatuses.value.map((status) => {
  const { secret } = status;
  const location = {
    name:   'c-cluster-fleet-oci-storage-secret-id',
    params: { cluster: BLANK_CLUSTER, id: secret.name },
  };
  const pulled = status.deployments.filter((d) => d.state === 'ready' || d.state === 'fallback').length;

  // No stateDescription: with one, the table renders the sub-row slot for collapsed rows too
  return {
    key:              secret.name,
    name:             secret.name,
    nameSort:         secret.name,
    description:      secret.description,
    state:            status.state,
    stateSort:        STATE_SORT[status.state],
    stateDisplay:     t(`${ ROOT }.state.${ status.state }`),
    stateBackground:  SECRET_STATE_COLORS[status.state],
    stateObj:         { error: status.state === 'error' },
    secret,
    status,
    isDefault:        status.isDefault,
    location,
    pushReference:    reference(secret.push),
    hostParts:        secret.push.host.split('.'),
    pushUser:         secret.push.username,
    agentUser:        secret.push.agentUsername || t('fleet.ociStorage.anonymous'),
    agentGetsPush:    !!secret.push.username && !secret.push.agentUsername,
    tlsLabel:         tlsLabel(secret.push),
    insecure:         secret.push.basicHTTP || secret.push.tlsMode === 'skipVerify',
    setCount:         secret.credentialSets.length,
    setNames:         secret.credentialSets.map((s) => s.name).join(', '),
    gitRepoCount:     status.gitRepos.length,
    gitReposLabel:    status.gitRepos.join(', '),
    usedByLabel:      t(`${ ROOT }.gitRepoCount`, { count: status.gitRepos.length }),
    failing:          status.failing,
    deploymentsLabel: status.deployments.length ? t(`${ ROOT }.deployed`, { pulled, total: status.deployments.length }) : '',
    ageMinutes:       secret.ageMinutes,
    ageLabel:         age(secret.ageMinutes),
    availableActions: [
      {
        action: 'edit', label: t('fleet.ociStorage.actions.edit'), icon: 'icon icon-edit', enabled: true
      },
      { divider: true },
      {
        action: 'remove', label: t('fleet.ociStorage.actions.delete'), icon: 'icon icon-trash', enabled: true
      },
    ],
    edit() {
      router.push(location);
    },
    remove() {
      confirmDelete(secret.name, status.gitRepos);
    },
  };
}));
</script>

<template>
  <div>
    <p class="text-deemphasized mmb-4">
      {{ t(`${ ROOT }.intro`, { workspace }) }}
    </p>
    <ResourceTable
      :schema="OCI_TABLE_SCHEMAS.secret"
      :headers="headers"
      :rows="rows"
      :namespaced="false"
      :table-actions="false"
      :sub-rows="true"
      :sub-expandable="true"
      :sub-expand-column="true"
      key-field="key"
      default-sort-by="state"
      data-testid="fleet-oci-secrets-table"
    >
      <template #cell:name="{ row }">
        <span class="name">
          <router-link :to="row.location">{{ row.name }}</router-link>
          <RcTag
            v-if="row.isDefault"
            v-clean-tooltip="t(`${ ROOT }.defaultTooltip`)"
            type="active"
            data-testid="fleet-oci-default-tag"
          >{{ t(`${ ROOT }.default`) }}</RcTag>
        </span>
        <div
          v-if="row.description"
          class="text-muted cell-description"
        >
          {{ row.description }}
        </div>
      </template>

      <template #cell:push="{ row }">
        <!-- A host wraps after a dot rather than mid-word -->
        <span class="reference"><template
          v-for="(part, i) in row.hostParts"
          :key="i"
        >{{ part }}<template v-if="i < row.hostParts.length - 1">.<wbr></template></template></span>
        <div class="text-muted cell-description reference">
          {{ row.secret.push.namespace }}
        </div>
        <div
          v-if="row.agentGetsPush"
          v-clean-tooltip="t(`${ ROOT }.agentGetsPushTooltip`)"
          class="cell-description text-warning"
        >
          <i
            class="icon icon-warning"
            aria-hidden="true"
          />
          {{ t(`${ ROOT }.agentGetsPush`) }}
        </div>
        <div
          v-if="row.insecure"
          v-clean-tooltip="t(`${ ROOT }.insecureTooltip`)"
          class="cell-description text-warning"
        >
          <i
            class="icon icon-warning"
            aria-hidden="true"
          />
          {{ row.tlsLabel }}
        </div>
      </template>

      <template #cell:sets="{ row }">
        <span v-if="row.setCount">{{ row.setCount }}</span>
        <span
          v-else
          class="text-muted"
        >{{ t(`${ ROOT }.noSets`) }}</span>
      </template>

      <template #cell:usedBy="{ row }">
        <span
          v-clean-tooltip="row.gitReposLabel"
          :class="{ 'text-muted': !row.gitRepoCount }"
        >{{ row.usedByLabel }}</span>
      </template>

      <template #cell:deployments="{ row }">
        <template v-if="row.deploymentsLabel">
          <span class="no-wrap">{{ row.deploymentsLabel }}</span>
          <div
            v-if="row.failing"
            class="text-error cell-description"
          >
            {{ t(`${ ROOT }.failingCount`, { count: row.failing }) }}
          </div>
        </template>
        <span
          v-else
          class="text-muted"
        >&mdash;</span>
      </template>

      <template #sub-row="{ row, fullColspan, onRowMouseEnter, onRowMouseLeave }">
        <tr
          class="sub-row"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <td :colspan="fullColspan">
            <div class="sets">
              <p class="text-deemphasized">
                {{ t(`${ ROOT }.setsIntro`) }}
              </p>
              <CredentialSetList :secret="row.secret" />
            </div>
          </td>
        </tr>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.name {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.cell-description {
  font-size: 12px;
}

.reference {
  overflow-wrap: break-word;
}

.no-wrap {
  white-space: nowrap;
}

.sets {
  padding: 8px 0 16px 32px;

  p {
    margin: 0 0 8px;
  }
}
</style>
