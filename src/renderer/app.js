const { Live2DModel } = PIXI.live2d;

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 850;

const MODELS = [
  // Official Live2D samples
  { name: 'Senko (仙狐)',       path: '/models/senko/senko.model3.json',                   scale: 0.45 },
  { name: 'Hiyori (日和)',       path: '/models/Hiyori/Hiyori.model3.json',                 scale: 0.4  },
  { name: 'Haru (春)',           path: '/models/Haru/Haru.model3.json',                     scale: 0.4  },
  { name: 'Natori (名取)',       path: '/models/Natori/Natori.model3.json',                 scale: 0.4  },
  { name: 'Mao (猫)',            path: '/models/Mao/Mao.model3.json',                       scale: 0.4  },
  { name: 'Rice (莱斯)',         path: '/models/Rice/Rice.model3.json',                     scale: 0.4  },
  { name: 'Ren (莲)',            path: '/models/Ren/Ren.model3.json',                       scale: 0.4  },
  { name: 'Mark (马克)',         path: '/models/Mark/Mark.model3.json',                     scale: 0.4  },
  { name: 'Wanko (小狗)',        path: '/models/Wanko/Wanko.model3.json',                   scale: 0.5  },
  // Fox Hime Zero
  { name: 'Mori Miko (森巫女)',  path: '/models/foxhime_mori_miko/mori_miko.model3.json',   scale: 0.35 },
  { name: 'Ruri Miko (瑠璃巫女)', path: '/models/foxhime_ruri_miko/ruri_miko.model3.json',  scale: 0.35 },
  { name: 'Mori Suit (森制服)',  path: '/models/foxhime_mori_suit/mori_suit.model3.json',   scale: 0.35 },
  // Girls' Frontline
  { name: 'HK416 (少前)',        path: '/models/gf_hk416_3401/normal.model3.json',          scale: 0.35 },
  { name: 'UMP45 (少前)',        path: '/models/gf_ump45_2107/normal.model3.json',          scale: 0.35 },
  { name: 'WA2000 (少前)',       path: '/models/gf_wa2000_1108/normal.model3.json',         scale: 0.35 },
  { name: 'G11 (少前)',          path: '/models/gf_g11_1602/normal.model3.json',            scale: 0.35 },
  { name: 'AN94 (少前)',         path: '/models/gf_an94_2404/normal.model3.json',           scale: 0.35 },
];

const BASE_URL = window.location.origin;
let currentModelIndex = 0;
let currentModel = null;
let isLoading = false;
let currentScale = 0;

// Create PixiJS app
const app = new PIXI.Application({
  view: document.getElementById('live2d-canvas'),
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  transparent: true,
  autoStart: true,
  backgroundAlpha: 0,
  preserveDrawingBuffer: true,
});

async function loadModel(index) {
  if (isLoading) return;
  isLoading = true;

  const config = MODELS[index];
  showMessage(`Loading ${config.name}...`, 2000);

  try {
    const model = await Live2DModel.from(BASE_URL + config.path);

    if (currentModel) {
      app.stage.removeChild(currentModel);
      currentModel.destroy();
      currentModel = null;
    }

    currentScale = config.scale;
    model.scale.set(currentScale);
    model.anchor.set(0.5, 0.5);
    model.x = CANVAS_WIDTH / 2;
    model.y = CANVAS_HEIGHT / 2 + 80;

    app.stage.addChild(model);
    currentModel = model;
    currentModelIndex = index;

    model.interactive = true;
    model.on('pointerdown', () => {
      const defs = model.internalModel.motionManager.definitions || {};
      const groups = Object.keys(defs);
      if (groups.length > 0) {
        const group = groups[Math.floor(Math.random() * groups.length)];
        model.motion(group);
      }
    });

    showMessage(`${config.name} (${index + 1}/${MODELS.length})`, 3000);
  } catch (err) {
    console.error('Failed to load model:', err);
    showMessage(`Failed: ${config.name}`, 3000);
  } finally {
    isLoading = false;
  }
}

// Eyes follow mouse
document.addEventListener('mousemove', (e) => {
  if (currentModel) currentModel.focus(e.clientX, e.clientY);
});

// Scroll wheel: switch models OR zoom (hold Ctrl/Cmd to zoom)
const canvas = document.getElementById('live2d-canvas');
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (isLoading) return;

  if (e.ctrlKey || e.metaKey) {
    if (!currentModel) return;
    const delta = e.deltaY > 0 ? -0.03 : 0.03;
    currentScale = Math.max(0.1, Math.min(1.0, currentScale + delta));
    currentModel.scale.set(currentScale);
  } else {
    let next = currentModelIndex + (e.deltaY > 0 ? 1 : -1);
    if (next < 0) next = MODELS.length - 1;
    if (next >= MODELS.length) next = 0;
    loadModel(next);
  }
}, { passive: false });

// Pixel-precise mouse hit testing
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
const pixelBuf = new Uint8Array(4);

function isPixelOpaque(e) {
  if (!gl) return false;
  const rect = canvas.getBoundingClientRect();
  const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
  const y = Math.round((rect.height - (e.clientY - rect.top)) * (canvas.height / rect.height));
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuf);
  return pixelBuf[3] >= 10;
}

// Drag support
let isDragging = false;

document.addEventListener('mousemove', (e) => {
  // Don't change ignore state when hovering over UI elements (input, bubble)
  const onUI = e.target.closest('.chat-input-wrap') || e.target.closest('.message-bubble.scrollable');
  if (onUI) {
    window.electronAPI.setIgnoreMouse(false);
    return;
  }
  if (isDragging) {
    window.electronAPI.setIgnoreMouse(false);
    return;
  }
  window.electronAPI.setIgnoreMouse(!isPixelOpaque(e));
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (isPixelOpaque(e)) {
    isDragging = true;
    window.electronAPI.startDrag();
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    window.electronAPI.stopDrag();
  }
});

// ============ Message bubble ============
const messageBubble = document.getElementById('message-bubble');
let messageTimer = null;
let bubbleVisible = false;
let bubblePersistent = false; // true when showing chat response (no auto-hide)

function updateBubblePosition() {
  if (!bubbleVisible || !currentModel) return;
  const bounds = currentModel.getBounds();
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / CANVAS_WIDTH;
  const scaleY = rect.height / CANVAS_HEIGHT;
  const topY = bounds.y * scaleY;
  messageBubble.style.top = Math.max(5, topY - 60) + 'px';
  const centerX = (bounds.x + bounds.width / 2) * scaleX;
  messageBubble.style.left = centerX + 'px';
}

app.ticker.add(() => {
  if (bubbleVisible) updateBubblePosition();
});

function showMessage(text, duration = 8000) {
  if (messageTimer) clearTimeout(messageTimer);
  messageBubble.textContent = text;
  messageBubble.classList.remove('hidden', 'scrollable');
  messageBubble.classList.add('visible');
  bubbleVisible = true;
  bubblePersistent = false;
  updateBubblePosition();
  messageTimer = setTimeout(() => {
    hideBubble();
  }, duration);
}

function showBubbleText(text, persistent = false) {
  if (messageTimer) clearTimeout(messageTimer);
  messageBubble.textContent = text;
  messageBubble.classList.remove('hidden');
  messageBubble.classList.add('visible');
  if (persistent) {
    messageBubble.classList.add('scrollable');
  }
  bubbleVisible = true;
  bubblePersistent = persistent;
  updateBubblePosition();
  // Auto-scroll to bottom
  messageBubble.scrollTop = messageBubble.scrollHeight;
}

function showThinking() {
  if (messageTimer) clearTimeout(messageTimer);
  messageBubble.innerHTML = '<span class="thinking-dots">Thinking</span>';
  messageBubble.classList.remove('hidden', 'scrollable');
  messageBubble.classList.add('visible');
  bubbleVisible = true;
  bubblePersistent = true;
  updateBubblePosition();
}

function hideBubble() {
  messageBubble.classList.remove('visible', 'scrollable');
  messageBubble.classList.add('hidden');
  bubbleVisible = false;
  bubblePersistent = false;
  messageTimer = null;
}

// ============ Chat input ============
const chatInput = document.getElementById('chat-input');
let isChatting = false;

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const prompt = chatInput.value.trim();
    if (!prompt || isChatting) return;

    isChatting = true;
    chatInput.value = '';
    chatInput.disabled = true;

    // Show thinking state
    showThinking();

    // Send to claude -p
    window.electronAPI.sendPrompt(prompt);
  }
  // Escape to hide bubble
  if (e.key === 'Escape') {
    hideBubble();
    chatInput.blur();
  }
});

// Streaming response chunks
window.electronAPI.onClaudeChunk((data) => {
  if (data.partial) {
    showBubbleText(data.partial, true);
  }
});

// Done
window.electronAPI.onClaudeDone((data) => {
  isChatting = false;
  chatInput.disabled = false;
  chatInput.focus();
  if (data.output) {
    showBubbleText(data.output, true);
    // Auto-hide after 30s for long responses
    messageTimer = setTimeout(() => {
      hideBubble();
    }, 30000);
  }
});

// Error
window.electronAPI.onClaudeError((data) => {
  isChatting = false;
  chatInput.disabled = false;
  chatInput.focus();
  showMessage(data.error || 'Claude error', 5000);
});

// External notification messages (from HTTP API / hook)
window.electronAPI.onShowMessage((data) => {
  if (!data || typeof data.text !== 'string') return;
  const duration = typeof data.duration === 'number' && data.duration > 0 ? data.duration : 8000;
  showMessage(data.text, duration);
});

// Load initial model
loadModel(0);
