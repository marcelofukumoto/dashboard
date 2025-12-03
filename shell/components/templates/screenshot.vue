<script>
import html2canvas from 'html2canvas';

const OPS_PROMPT = `This screenshot belongs to Rancher.
Please analyze this screen at an expert Kubernetes and Rancher Ops level.
I want the best possible explanation and guidance based only on what appears in the screenshot.

For every field, section, tab, option, toggle, or message in the screenshot, please:

Identify what it is and its purpose inside Rancher
Explain what inputs are typically expected
Provide Rancher best practices for production clusters
Provide Kubernetes or RKE2 expert-level recommendations
Explain hidden behaviors or implications of each field
Suggest secure defaults, performance optimizations, and anti-patterns to avoid
If relevant, provide examples for cloud providers, on-prem deployments, node pools, registries, networking, security context, schedulers, or storage settings
Identify any warnings, errors, or risk areas shown on the screenshot
Describe what an Ops engineer should verify before creating or updating the cluster
Give next-step actions the user should take
Focus on clarity, precision, security, and real-world production operations guidance.
Assume I am creating or modifying a Rancher-managed Kubernetes cluster and want the best expert explanation possible.`;

const UX_PROMPT = `This screenshot belongs to Rancher.
Please analyze the UI from the perspective of an expert product designer specializing in enterprise cloud platforms, Kubernetes dashboards, and DevOps tools.
I want the best possible design, UX, and interaction analysis based only on what is visible in the screenshot.

For every visible element, component, state, or pattern in the screenshot, please:

Identify the UI components and their purpose within Rancher
Describe the visual hierarchy and whether it helps or harms clarity
Analyze spacing, alignment, typography, color usage, and iconography
Evaluate consistency with common Rancher design patterns
Evaluate consistency with Kubernetes UI conventions
Suggest improvements for readability and cognitive load
Suggest layout optimizations for complex Ops workflows
Identify accessibility issues (contrast, keyboard navigation, focus management, screen readers, ARIA roles)
Give UX heuristics feedback (Nielsen, Shneiderman, progressive disclosure, affordance, feedback)
Analyze the clarity of actions (Are the buttons, states, and labels self-explanatory?)
Suggest alternative UI patterns when appropriate
Highlight potential confusion for operators, SREs, or cluster admins
Propose improvements for both beginner and expert workflows
Suggest microcopy improvements where labels or titles are ambiguous
Document any visual or interaction anti-patterns
Explain how this design impacts large-scale multi-cluster operations
Recommend best-in-class enterprise console design practices that Rancher could adopt
Provide both quick wins and long-term UI/UX refactors
Focus on enterprise Kubernetes usability and operational clarity
Tailor the entire analysis toward the needs of DevOps, SREs, and cloud platform teams.

Please be precise, clear, and deeply analytical.
Assume I am evaluating the Rancher interface to improve usabillity, navigation, visual hierarchy, and operational UX for Kubernetes users.`;

export default {
  props: {
    active:     { type: Boolean, default: false },
    fullScreen: {
      type:    Boolean,
      default: false
    },
    continuous: {
      type:    Boolean,
      default: false
    }
  },
  emits: ['update:active', 'update:fullScreen', 'update:continuous'],
  data() {
    return {
      crossHairsLeft:     0,
      crossHairsTop:      0,
      startX:             0,
      startY:             0,
      endX:               0,
      endY:               0,
      isMouseDown:        false,
      isDragging:         false,
      borderWidth:        `${ window.innerHeight }px ${ window.innerWidth }px`,
      imageUrl:           null,
      croppedImageWidth:  0,
      croppedImageHeight: 0,
      isVisible:          true,
      showFlash:          false,
      showCopiedMessage:  false,
      showPromptModal:    false,
      OPS_PROMPT,
      UX_PROMPT,
      capturedImages:     [],
    };
  },
  watch: {
    active(isActive) {
      if (isActive) {
        window.addEventListener('keydown', this.handleKeyDown, { once: true });
        if (this.fullScreen) {
          this.showPromptModal = true;
        }
      } else {
        window.removeEventListener('keydown', this.handleKeyDown);
      }
    },
    continuous(isContinuous) {
      if (!isContinuous) {
        this.capturedImages = [];
      }
    }
  },
  computed: {
    screenshotShortcut() {
      // vue-shortkey uses 'meta' for Command on macOS and Ctrl on Windows/Linux
      return {
        partial:    ['shift', 'ctrl', 'a'],
        fullScreen: ['shift', 'ctrl', 's'],
      };
    }
  },
  methods: {
    move(event) {
      const endX = event.clientX;
      const endY = event.clientY;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      this.crossHairsTop = event.clientY;
      this.crossHairsLeft = event.clientX;

      if (this.isMouseDown) {
        this.isDragging = true;

        const left = Math.min(this.startX, endX);
        const top = Math.min(this.startY, endY);
        const right = windowWidth - Math.max(this.startX, endX);
        const bottom = windowHeight - Math.max(this.startY, endY);

        this.borderWidth = `${ top }px ${ right }px ${ bottom }px ${ left }px`;

        this.croppedImageWidth = Math.abs(endX - this.startX);
        this.croppedImageHeight = Math.abs(endY - this.startY);
      }
    },
    mouseDown(event) {
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.isMouseDown = true;
      this.isDragging = false;
      this.borderWidth = `${ this.startY }px ${ window.innerWidth - this.startX }px ${ window.innerHeight - this.startY }px ${ this.startX }px`;
    },
    mouseUp(event) {
      this.isMouseDown = false;
      this.endX = event.clientX;
      this.endY = event.clientY;

      if (this.isDragging) {
        // Show the prompt selection modal instead of taking the screenshot directly
        this.showPromptModal = true;
      }

      this.isDragging = false;
      this.borderWidth = `${ window.innerHeight }px ${ window.innerWidth }px`;
      // Deactivate the screenshot tool after use (or cancellation)
      this.$emit('update:active', false);
    },
    handleKeyDown(event) {
      if (event.key === 'Escape') {
        this.cancelScreenshot();
      }
    },
    cancelScreenshot() {
      this.isMouseDown = false;
      this.isDragging = false;
      this.$emit('update:active', false);
    },
    handlePartialScreenshotShortcut() {
      // Toggle active state, ensuring it's a partial screenshot
      this.$emit('update:fullScreen', false);
      this.$emit('update:active', !this.active);
    },
    handleFullScreenScreenshotShortcut() {
      // Toggle active state, ensuring it's a full-screen screenshot
      this.$emit('update:fullScreen', true);
      this.$emit('update:active', !this.active);
    },
    selectPromptAndTakeScreenshot(promptText) {
      this.showPromptModal = false;
      if (this.continuous) {
        this.createFinalImage(promptText);
      } else {
        this.takeScreenshot(promptText);
      }
    },
    cancelPrompt() {
      this.showPromptModal = false;
      this.$emit('update:active', false);
    },
    addTextToCanvas(canvas, text) {
      const fontSize = 12;
      const padding = 10;
      const lineHeight = fontSize * 1.2;
      const maxWidth = canvas.width - (padding * 2);

      // Use a temporary context to measure text without affecting the canvas yet
      const tempCtx = document.createElement('canvas').getContext('2d');

      tempCtx.font = `${ fontSize }px sans-serif`;
      const lines = this.wrapText(tempCtx, text, maxWidth);
      const textBlockHeight = lines.length * lineHeight;
      const textBlockWithPadding = textBlockHeight + (padding * 2);

      // Create a new, taller canvas to hold the image and the text
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');

      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + textBlockWithPadding;

      // Draw the original screenshot at the top
      finalCtx.drawImage(canvas, 0, 0);

      // Draw the text background below the screenshot
      finalCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      finalCtx.fillRect(0, canvas.height, finalCanvas.width, textBlockWithPadding);

      // Draw the text on the new background
      finalCtx.fillStyle = 'white';
      finalCtx.font = `${ fontSize }px sans-serif`;
      let y = canvas.height + padding + fontSize; // Start drawing text inside the padded area

      for (const line of lines) {
        finalCtx.fillText(line, padding, y);
        y += lineHeight;
      }

      return finalCanvas;
    },
    cancelContinuous() {
      this.capturedImages = [];
      this.$emit('update:continuous', false);
    },
    takeScreenshot(promptText) {
      // Hide the screenshot component before taking the screenshot
      this.isVisible = false;

      this.$nextTick(() => {
        // Use requestAnimationFrame to wait for the browser to repaint before taking the screenshot
        requestAnimationFrame(() => {
          // A second frame provides a more robust way to ensure repaint is complete
          requestAnimationFrame(() => {
            html2canvas(document.querySelector('.dashboard-root'), {
              useCORS:         true,
              backgroundColor: null, // Use null for transparent background
              scrollX:         -window.scrollX,
              scrollY:         -window.scrollY,
              windowWidth:     document.documentElement.offsetWidth,
              windowHeight:    document.documentElement.offsetHeight
            }).then(async(canvas) => {
              const croppedCanvas = document.createElement('canvas');
              const croppedCanvasContext = croppedCanvas.getContext('2d');
              let cropX, cropY;

              if (this.fullScreen) {
                this.croppedImageWidth = window.innerWidth;
                this.croppedImageHeight = window.innerHeight;
                cropX = 0;
                cropY = 0;
              } else {
                cropX = Math.min(this.startX, this.endX);
                cropY = Math.min(this.startY, this.endY);
              }

              croppedCanvas.width = this.croppedImageWidth;
              croppedCanvas.height = this.croppedImageHeight;

              croppedCanvasContext.drawImage(canvas, cropX, cropY, this.croppedImageWidth, this.croppedImageHeight, 0, 0, this.croppedImageWidth, this.croppedImageHeight);

              const finalCanvas = this.addTextToCanvas(croppedCanvas, promptText);

              finalCanvas.toBlob(async(blob) => {
                if (blob) {
                  try {
                    // Copy the image to the clipboard
                    await navigator.clipboard.write([
                      new ClipboardItem({ [blob.type]: blob })
                    ]);

                    this.showCopiedMessage = true;
                    setTimeout(() => {
                      this.showCopiedMessage = false;
                    }, 2000); // Hide after 2 seconds
                  } catch (err) {
                    console.error('Failed to copy image to clipboard:', err);
                  }
                }
              }, 'image/png');

              // Download the image
              const link = document.createElement('a');

              link.href = finalCanvas.toDataURL();
              link.download = 'screenshot.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              this.isVisible = true;
              this.$emit('update:active', false);
            });
          });
        });
      });
    },
    wrapText(context, text, maxWidth) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(`${ currentLine } ${ word }`).width;

        if (width < maxWidth) {
          currentLine += ` ${ word }`;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);

      return lines;
    },
    async captureContinuousFrame() {
      this.isVisible = false;
      await this.$nextTick();

      html2canvas(document.querySelector('.dashboard-root'), {
        useCORS:         true,
        backgroundColor: null, // Use null for transparent background
        scrollX:         -window.scrollX,
        scrollY:         -window.scrollY,
        windowWidth:     document.documentElement.offsetWidth,
        windowHeight:    document.documentElement.offsetHeight
      }).then(async(canvas) => {
        const croppedCanvas = document.createElement('canvas');
        const croppedCanvasContext = croppedCanvas.getContext('2d');
        const cropX = 0;
        const cropY = 0;

        this.croppedImageWidth = window.innerWidth;
        this.croppedImageHeight = window.innerHeight;

        croppedCanvas.width = this.croppedImageWidth;
        croppedCanvas.height = this.croppedImageHeight;

        croppedCanvasContext.drawImage(canvas, cropX, cropY, this.croppedImageWidth, this.croppedImageHeight, 0, 0, this.croppedImageWidth, this.croppedImageHeight);
        this.capturedImages.push(croppedCanvas);
      }).catch((e) => {
        console.error('Error capturing continuous frame:', e);
      }).finally(() => {
        this.isVisible = true;
      });
    },
    finishContinuousCapture() {
      if (this.capturedImages.length > 0) {
        this.showPromptModal = true;
      } else {
        this.cancelContinuous();
      }
    },
    async createFinalImage(promptText) {
      const separatorHeight = 5; // White line height
      const totalHeight = this.capturedImages.reduce((acc, canvas) => acc + canvas.height, 0) + (separatorHeight * (this.capturedImages.length - 1));
      const maxWidth = Math.max(...this.capturedImages.map((c) => c.width));

      const stitchedCanvas = document.createElement('canvas');

      stitchedCanvas.width = maxWidth;
      stitchedCanvas.height = totalHeight;
      const ctx = stitchedCanvas.getContext('2d');

      let currentY = 0;

      this.capturedImages.forEach((canvas, index) => {
        ctx.drawImage(canvas, 0, currentY);
        currentY += canvas.height;
        if (index < this.capturedImages.length - 1) {
          // Draw a green line as a separator
          ctx.fillStyle = 'green';
          ctx.fillRect(0, currentY, maxWidth, separatorHeight);
          currentY += separatorHeight;
        }
      });

      // Reuse text adding logic from single screenshot
      const finalCanvasWithText = this.addTextToCanvas(stitchedCanvas, promptText);

      // Reuse download and clipboard logic
      finalCanvasWithText.toBlob(async(blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob })
            ]);
            this.showCopiedMessage = true;
            setTimeout(() => {
              this.showCopiedMessage = false;
            }, 2000);
          } catch (err) {
            console.error('Failed to copy image to clipboard:', err);
          }
        }
      }, 'image/png');

      const link = document.createElement('a');

      link.href = finalCanvasWithText.toDataURL();
      link.download = 'continuous-screenshot.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.cancelContinuous();
    },

  }
};
</script>

<template>
  <div>
    <button
      v-shortkey="screenshotShortcut.partial"
      class="hide"
      @shortkey="handlePartialScreenshotShortcut"
    />
    <button
      v-shortkey="screenshotShortcut.fullScreen"
      class="hide"
      @shortkey="handleFullScreenScreenshotShortcut"
    />
    <div
      v-if="continuous && isVisible"
      class="continuous-controls"
    >
      <div class="controls-header">
        <span>Continuous Capture</span>
        <button
          class="btn-close"
          @click="cancelContinuous"
        >
          &times;
        </button>
      </div>
      <div class="controls-body">
        <span class="badge">{{ capturedImages.length }}</span>
        <button
          class="btn btn-sm role-primary"
          @click="captureContinuousFrame"
        >
          Capture
        </button>
        <button
          class="btn btn-sm role-primary"
          :disabled="capturedImages.length === 0"
          @click="finishContinuousCapture"
        >
          Finish
        </button>
      </div>
    </div>
    <div
      v-if="active && isVisible"
      class="container"
      @mousemove="move"
      @mousedown="mouseDown"
      @mouseup="mouseUp"
    >
      <div class="screenshot-wrapper">
        <div
          :class="['overlay', { 'highlighting' : isMouseDown }]"
          :style="{ borderWidth: borderWidth }"
        />
        <div
          class="crosshairs"
        >
          <div
            class="crosshair-x"
            :style="{ top: crossHairsTop + 'px' }"
          />
          <div
            class="crosshair-y"
            :style="{ left: crossHairsLeft + 'px' }"
          />
        </div>
      </div>
    </div>
    <transition name="copied-fade">
      <div
        v-if="showCopiedMessage"
        class="copied-message"
      >
        Copied!
      </div>
    </transition>
    <div
      v-if="showPromptModal"
      class="prompt-modal-backdrop"
      @click.self="cancelPrompt"
    >
      <div class="prompt-modal">
        <div class="prompt-modal-header">
          <h3>Choose a Persona</h3>
          <button
            class="btn-close"
            @click="cancelPrompt"
          >
            &times;
          </button>
        </div>
        <div class="prompt-modal-body">
          <p>Which expert persona should analyze this screenshot?</p>
        </div>
        <div class="prompt-modal-footer">
          <button
            class="btn role-primary"
            @click="selectPromptAndTakeScreenshot(OPS_PROMPT)"
          >
            Ops Engineer
          </button>
          <button
            class="btn role-primary"
            @click="selectPromptAndTakeScreenshot(UX_PROMPT)"
          >
            UX/UI Designer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.overlay,
.container,
.crosshairs,
.tooltip,
.borderedBox {
  user-select: none;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.overlay.highlighting {
  border-color: rgba(0, 0, 0, 0.5);
  background-color: transparent;
  border-style: solid;
}

.crosshairs {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2147483645;
}

.crosshair-x, .crosshair-y {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.3);
}

.container {
  clear: both;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2147483644; /* High z-index to be on top */
}

.crosshair-x {
  width: 100%;
  height: 1px;
  left: 0;
}

.crosshair-y {
  height: 100%;
  width: 1px;
  top: 0;
}

.borderedBox {
  border: 1px solid #fff;
  position: absolute;
}

.borderedBox.hidden {
  display: none;
}

.tooltip {

  display: inline-block;
  position: absolute;

  background-color: grey;
  color: #fff;

  border-radius: 4px;

  font-size: 12px;
  font-family: monospace;

  padding: 6px;
  margin: 6px;
  white-space: nowrap;
}

.tooltip.hidden {
  display: none;
}

.Flash {
  position: absolute;
  width: 100%;
  height: 100%;

  top: 0;
  left: 0;

  background-color: #fff;
  z-index: 2147483646;

  opacity: 1;

  animation-delay: 0.2s;
  animation-name: fade-out;
  animation-duration: 1s;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}

.screenshot-enter-active, .screenshot-leave-active {
  transition: opacity .2s;
}

.screenshot-enter, .screenshot-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

@keyframes fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

.copied-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 2147483647; /* Max z-index */
  font-size: 16px;
  pointer-events: none;
}

.copied-fade-enter-active, .copied-fade-leave-active {
  transition: opacity 0.5s;
}

.copied-fade-enter, .copied-fade-leave-to {
  opacity: 0;
}

.prompt-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2147483647; /* Max z-index */
}

.prompt-modal {
  background-color: var(--body-bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  width: 500px;
  max-width: 90%;
  display: flex;
  flex-direction: column;

  .prompt-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border);

    h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
  }

  .prompt-modal-body {
    padding: 1rem;
    flex-grow: 1;

    p {
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  .prompt-modal-footer {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
    border-top: 1px solid var(--border);

    .btn {
      margin-left: 20px;
    }
  }
}

.continuous-controls {
  position: fixed;
  top: calc(var(--header-height) + 10px);
  right: 20px;
  width: 250px;
  background-color: var(--body-bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  z-index: 2147483646;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);

  .controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border);
    font-weight: bold;

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
  }

  .controls-body {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 1rem;

    .badge {
      background-color: var(--info);
      color: var(--default-text);
      padding: 4px 8px;
      border-radius: 10px;
      font-size: 12px;
      min-width: 20px;
      text-align: center;
    }
  }
}
</style>
