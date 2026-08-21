<script>
// Minimal AI chat client for the Home editor. Talks to the Rancher AI agent backend the same
// way the Liz chat does — a WebSocket proxied through the k8s API server — hardcoded to the
// `lizai-spike` agent. That agent is a RELAY: it forwards the message verbatim to the watcher
// bridge (an external Claude), so the HOME EDITOR CONFIG instructions we PREPEND to each message
// (see `preamble`) are what tell the watcher to edit the default/home ConfigMap. The Home page
// watches that ConfigMap and hot-reloads; the editor re-syncs from the saved source (parent).
// Spike-grade client: one socket per request, minimal frame parsing.

const AGENT_NAMESPACE = 'cattle-ai-agent-system';
const AGENT_NAME = 'rancher-ai-agent';
const WS_PATH = 'v1/ws/messages';

// Prepended to every message. Since lizai-spike relays verbatim, this is the "system prompt".
// __CM_NAME__ is replaced with the SAVED template ConfigMap the editor is currently editing.
const HOME_EDITOR_PREAMBLE =
`You are the HOME EDITOR CONFIG. Your ONLY target is the Kubernetes ConfigMap named EXACTLY
"__CM_NAME__" in namespace "default".
!!! CRITICAL TARGET RULE: edit ONLY the ConfigMap "__CM_NAME__". Do NOT edit "home-applied". Do NOT
edit any other template. Do NOT edit the ConfigMap "home" UNLESS "__CM_NAME__" is literally "home".
When in doubt about which ConfigMap to write, it is ALWAYS "__CM_NAME__" and nothing else. !!!

That ConfigMap's data["view.vue"] is a Vue 3 Options-API Single File Component rendered as the Rancher
Home page; keep its existing data.meta unchanged.

WORKFLOW: read ConfigMap "__CM_NAME__", apply the request as an INCREMENTAL edit to its view.vue, then
SAVE (update "__CM_NAME__"). You have NOT done anything until that write to "__CM_NAME__" succeeds.
Reply in ONE sentence.

########################################################################################
# MANDATORY: BUILD WITH THE RANCHER COMPONENT LIBRARY. DO NOT HAND-ROLL HTML.           #
########################################################################################
This SFC runs INSIDE the Rancher app; the FULL @shell + @components library is available and you MUST
use it. Reimplementing Rancher UI with raw HTML/CSS is WRONG. Concretely, in the <template>:
- NEVER write a raw <table>. Use ResourceTable:
      import ResourceTable from '@shell/components/ResourceTable';
      <ResourceTable v-if="schema" :schema="schema" :rows="rows" :table-actions="false" :row-actions="false" />
  Get the schema from the management store (see DATA) — ResourceTable renders State/Name/etc. columns
  and status badges for you. Do NOT build your own columns/pills unless asked.
- NEVER write a raw <button>. Use RcButton:
      import { RcButton } from '@components/RcButton';
      <RcButton variant="primary" :to="{ name: 'c-cluster-explorer', params: { cluster: c.id } }">Explore</RcButton>
- Status → import { BadgeState } from '@components/BadgeState'; <BadgeState :value="row" />. Do NOT draw pills.
- Banner → import { Banner } from '@components/Banner'; <Banner color="info" label="..." />.
- Cards → import { Card } from '@components/Card';.
- Do NOT hardcode Rancher colors or restyle the components — they already look correct. Use <style scoped>
  ONLY for layout (grid, spacing). If you find yourself writing .btn / .state-pill / table CSS, STOP and
  use the component instead.
You MUST import every component you use and register it in components:{}. ALWAYS use the REAL import
path the Rancher source uses — a full '@shell/components/...' path for @shell components and the named
'@components/<Dir>' form for rancher-components (e.g. import { RcButton } from '@components/RcButton').
Do NOT use bare-name imports like 'RcButton' even though they happen to work — prefer the real paths so
the code matches the codebase.
Also usable: @shell/utils/* (named), @shell/mixins/*, @shell/edit|detail|list|models/<type>.
NOT available: @shell/config, @shell/store, @shell/plugins, @shell/server, npm packages, relative paths,
and cyclic utils (array, object, router, validators).

DATA — Home is OUTSIDE a cluster, so use the MANAGEMENT store:
    this.$store.dispatch('management/findAll', { type: 'management.cattle.io.cluster' })            // rows
    this.$store.getters['management/schemaFor']('management.cattle.io.cluster')                     // :schema

RULES: Options API only; one <script> + one <template>; <style scoped> plain CSS (NO lang="scss");
Vue 3 (never this.$set). Valid SFC only.

CANONICAL EXAMPLE — clusters via the REAL ResourceTable + a Banner (adapt to the request; keep using
components, do NOT fall back to a hand-made table):
<script>
import ResourceTable from '@shell/components/ResourceTable';
import { Banner } from '@components/Banner';
export default {
  components: { ResourceTable, Banner },
  async fetch() { this.rows = await this.$store.dispatch('management/findAll', { type: 'management.cattle.io.cluster' }).catch(() => []); },
  data() { return { rows: [] }; },
  computed: { schema() { return this.$store.getters['management/schemaFor']('management.cattle.io.cluster'); } },
};
<\/script>
<template>
  <div class="home">
    <Banner color="info" label="Welcome to Rancher" />
    <ResourceTable v-if="schema" :schema="schema" :rows="rows" :table-actions="false" :row-actions="false" />
  </div>
<\/template>
<style scoped>.home{padding:24px;}<\/style>

User request:`;

// Streaming frame markers (mirror rancher-ai-ui Tag enum).
const T = {
  msgStart:   '<message>',
  msgEnd:     '</message>',
  thinkStart: '<think>',
  thinkEnd:   '</think>',
  mcp:        '<mcp-response>',
  agentMeta:  '<agent-metadata>',
  chatErr:    '<chat-error>',
  err:        '<error>',
};

export default {
  name: 'HomeConfigChat',

  props: {
    // The agent to talk to — the LizAI Spike relay (forwards to the watcher / your Claude).
    agent: {
      type:    String,
      default: 'lizai-spike',
    },

    // Prepended to every outgoing message (the relay has no persona of its own).
    preamble: {
      type:    String,
      default: HOME_EDITOR_PREAMBLE,
    },

    // The SAVED template ConfigMap the editor is currently editing — the AI edits THIS one.
    configMapName: {
      type:    String,
      default: 'home',
    },
  },

  data() {
    return {
      messages:  [], // { role: 'user'|'assistant', content, tool?, completed? }
      input:     '',
      streaming: false,
      error:     '',
      ws:        null,
      assistant: null,
      inMessage: false,
      inThink:   false,
    };
  },

  beforeUnmount() {
    this.closeWs();
  },

  methods: {
    wsUrl() {
      return `wss://${ window.location.host }/api/v1/namespaces/${ AGENT_NAMESPACE }/services/http:${ AGENT_NAME }:80/proxy/${ WS_PATH }`;
    },

    send() {
      const text = this.input.trim();

      if (!text || this.streaming) {
        return;
      }

      this.error = '';
      this.messages.push({ role: 'user', content: text });
      this.input = '';

      // The assistant message we stream into.
      this.assistant = {
        role: 'assistant', content: '', tool: false, completed: false
      };
      this.messages.push(this.assistant);
      this.inMessage = false;
      this.inThink = false;
      this.streaming = true;

      this.$nextTick(this.scrollToBottom);

      // Show only what the user typed, but SEND the preamble (with the target ConfigMap name
      // injected) + message. The relay forwards it verbatim to the watcher.
      const preamble = this.preamble.replace(/__CM_NAME__/g, this.configMapName || 'home');
      const payload = JSON.stringify({
        prompt:  `${ preamble }\n${ text }`,
        agent:   this.agent,
        context: {},
      });

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(payload);

        return;
      }

      // (Re)open the socket, then send on open.
      this.closeWs();
      const ws = new WebSocket(this.wsUrl());

      this.ws = ws;
      ws.onopen = () => ws.send(payload);
      ws.onmessage = (ev) => this.onFrame(ev.data);
      ws.onerror = () => {
        this.error = 'Connection error talking to the AI agent.';
        this.finishStreaming();
      };
      ws.onclose = () => this.finishStreaming();
    },

    onFrame(data) {
      if (typeof data !== 'string' || !this.assistant) {
        return;
      }

      switch (data) {
      case T.msgStart:
        this.inMessage = true;

        return;
      case T.msgEnd:
        this.inMessage = false;
        this.assistant.completed = true;
        this.streaming = false;

        return;
      case T.thinkStart:
        this.inThink = true;

        return;
      case T.thinkEnd:
        this.inThink = false;

        return;
      default:
        break;
      }

      // A tool ran (the agent wrote the ConfigMap) — flag it so the UI can show a hint.
      if (data.startsWith(T.mcp)) {
        this.assistant.tool = true;

        return;
      }
      if (data.startsWith(T.agentMeta)) {
        return;
      }
      if (data.startsWith(T.chatErr) || data.startsWith(T.err)) {
        this.error = data.replace(/<\/?[a-z-]+>/g, '').trim() || 'Agent error';

        return;
      }

      if (this.inMessage && !this.inThink) {
        this.assistant.content += data;
        this.$nextTick(this.scrollToBottom);
      }
    },

    finishStreaming() {
      this.streaming = false;
      if (this.assistant && !this.assistant.completed) {
        this.assistant.completed = true;
      }
    },

    closeWs() {
      if (this.ws) {
        try {
          this.ws.onclose = null;
          this.ws.close();
        } catch (e) {
          // ignore
        }
        this.ws = null;
      }
    },

    scrollToBottom() {
      const el = this.$refs.log;

      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },

    onKeydown(e) {
      // Enter sends, Shift+Enter newlines.
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    },
  },
};
</script>

<template>
  <div class="home-chat">
    <!-- Shows exactly which SAVED template the AI will edit (the selected one). -->
    <div class="home-chat__target text-muted">
      AI edits template: <code>{{ configMapName || 'home' }}</code>
    </div>
    <div
      ref="log"
      class="home-chat__log"
    >
      <div
        v-if="!messages.length"
        class="home-chat__empty text-muted"
      >
        Ask the Home Editor to change the SELECTED template — e.g. “add a welcome header and list
        my clusters as cards”. It edits <code>default/{{ configMapName || 'home' }}</code> (not the
        applied page); the editor + preview update when it saves.
      </div>
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="home-chat__msg"
        :class="`home-chat__msg--${ m.role }`"
      >
        <div class="home-chat__role">
          {{ m.role === 'user' ? 'You' : 'Home Editor' }}
        </div>
        <div class="home-chat__bubble">
          <span v-if="m.content">{{ m.content }}</span>
          <span
            v-else-if="m.role === 'assistant' && streaming"
            class="text-muted"
          >…</span>
          <div
            v-if="m.tool"
            class="home-chat__tool text-muted"
          >
            ✎ updated the ConfigMap
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="error"
      class="home-chat__error text-error"
    >
      {{ error }}
    </div>

    <div class="home-chat__input">
      <textarea
        v-model="input"
        class="home-chat__box"
        placeholder="Ask the Home Editor to change the page… (Enter to send, Shift+Enter for newline)"
        :disabled="streaming"
        @keydown="onKeydown"
      />
      <button
        class="btn btn-sm role-primary"
        :disabled="streaming || !input.trim()"
        @click="send"
      >
        {{ streaming ? '…' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--body-bg);

  &__target {
    flex: 0 0 auto;
    padding: 4px 12px;
    font-size: 11px;
    border-bottom: 1px solid var(--border);

    code {
      background: var(--nav-active);
      border-radius: 4px;
      padding: 0 5px;
    }
  }

  &__log {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    min-height: 0;
  }

  &__empty {
    font-size: 12px;
    line-height: 1.5;

    code {
      background: var(--nav-active);
      border-radius: 4px;
      padding: 0 4px;
    }
  }

  &__msg {
    margin-bottom: 12px;

    &--user .home-chat__bubble {
      background: var(--nav-active);
    }
  }

  &__role {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 2px;
  }

  &__bubble {
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--box-bg, var(--nav-active));
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
  }

  &__tool {
    font-size: 11px;
    margin-top: 4px;
  }

  &__error {
    padding: 4px 12px;
    font-size: 12px;
  }

  &__input {
    display: flex;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid var(--border);
  }

  &__box {
    flex: 1;
    resize: none;
    height: 48px;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--input-bg, var(--body-bg));
    color: var(--body-text);
    font-family: inherit;
    font-size: 13px;
  }
}
</style>
