<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { RcStatusIndicator } from '@components/Pill';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { reference } from '@shell/components/fleet/FleetOCIStorage/resolve';
import { useFleetOCIStorageLabels } from '@shell/components/fleet/FleetOCIStorage/useFleetOCIStorageLabels';
import { DeploymentStatus, PullResult } from '@shell/components/fleet/FleetOCIStorage/types';

const ROOT = 'fleet.ociStorage.panel';

const props = defineProps<{ status: DeploymentStatus }>();

const emit = defineEmits<{(e: 'navigate'): void}>();

const router = useRouter();
const {
  t, entryLabel, reason, deploymentMessage, deploymentHint
} = useFleetOCIStorageLabels();

const message = computed(() => [deploymentMessage(props.status), deploymentHint(props.status)].filter(Boolean).join(' '));
const bannerColor = computed(() => ({
  failed: 'error', fallback: 'warning', retrying: 'info', ready: 'success'
}[props.status.state]));

function dot(result: PullResult | null): 'success' | 'info' | 'error' | 'none' {
  if (result === null) {
    return 'none';
  }

  if (result === 'ok') {
    return 'success';
  }

  return result === 'notFound' ? 'info' : 'error';
}

function outcome(result: PullResult | null): string {
  if (result === null) {
    return t(`${ ROOT }.outcome.notTried`);
  }

  return result === 'ok' ? t(`${ ROOT }.outcome.pulled`) : reason(result);
}

function editSecret() {
  emit('navigate');
  router.push({
    name:   'c-cluster-fleet-oci-storage-secret-id',
    params: { cluster: BLANK_CLUSTER, id: props.status.secret.name },
  });
}
</script>

<template>
  <div
    class="deployment-panel"
    data-testid="fleet-oci-deployment-panel"
  >
    <Banner
      v-if="message"
      :color="bannerColor"
      :label="message"
      class="m-0"
    />

    <section>
      <h3>{{ t(`${ ROOT }.details`) }}</h3>
      <dl class="details">
        <dt>{{ t(`${ ROOT }.gitRepo`) }}</dt>
        <dd>{{ status.gitRepo.name }}</dd>

        <dt>{{ t(`${ ROOT }.bundle`) }}</dt>
        <dd>{{ status.bundle.name }}</dd>

        <dt>{{ t(`${ ROOT }.cluster`) }}</dt>
        <dd>{{ status.cluster.name }}</dd>

        <dt>{{ t(`${ ROOT }.secret`) }}</dt>
        <dd>
          <a
            href="#"
            data-testid="fleet-oci-panel-secret"
            @click.prevent="editSecret"
          >{{ status.secret.name }}</a>
          <span
            v-if="!status.gitRepo.secret"
            class="text-muted"
          > {{ t(`${ ROOT }.workspaceDefault`) }}</span>
        </dd>

        <dt>{{ t(`${ ROOT }.artifact`) }}</dt>
        <dd class="artifact">
          <span>{{ status.bundle.artifactId }}</span>
          <RcButton
            variant="ghost"
            size="small"
            :aria-label="t('generic.copyToClipboard')"
            @click="copyTextToClipboard(status.bundle.artifactId)"
          >
            <i
              class="icon icon-copy"
              aria-hidden="true"
            />
          </RcButton>
        </dd>
      </dl>
    </section>

    <section>
      <h3>{{ t(`${ ROOT }.pullOrder`) }}</h3>
      <p class="text-deemphasized">
        {{ t(`${ ROOT }.pullOrderIntro`) }}
      </p>
      <ol class="attempts">
        <li
          v-for="attempt in status.attempts"
          :key="attempt.entry.name"
          :data-testid="`fleet-oci-attempt-${ attempt.entry.name }`"
        >
          <RcStatusIndicator
            shape="disc"
            :status="dot(attempt.result)"
          />
          <span class="entry">{{ entryLabel(attempt.entry) }}</span>
          <span class="text-muted reference">{{ reference(attempt.entry.endpoint) }}</span>
          <span
            class="attempt-outcome"
            :class="{ 'text-error': attempt.result && !['ok', 'notFound'].includes(attempt.result), 'text-muted': !attempt.result }"
          >{{ outcome(attempt.result) }}</span>
        </li>
      </ol>
    </section>

    <p class="text-muted source-note">
      {{ t(`${ ROOT }.sourceNote`) }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.deployment-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;

  h3 {
    margin-bottom: 12px;
  }

  p {
    margin: 0 0 12px;
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

.artifact {
  display: flex;
  align-items: center;
  gap: 4px;
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

  .entry {
    font-weight: 600;
  }

  .reference {
    overflow-wrap: anywhere;
  }

  .attempt-outcome {
    width: 100%;
    padding-left: 18px;
    font-size: 12px;
  }
}

.source-note {
  font-size: 12px;
}
</style>
