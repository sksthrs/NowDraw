// Registering Service Worker for making this as PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
    .then((registration) => {
      console.log(`[Main] ServiceWorker registration finished. Scope:${registration.scope}`);
    })
    .catch((reason) => {
      console.log(`[Main] ServiceWorker registratio failed. Reason:${reason}`);
    });
  });
}

document.addEventListener('DOMContentLoaded', (ev) => {
  /** @type {HTMLButtonElement} */
  const _eraseButton = document.getElementById('erase');
  /** @type {HTMLButtonElement} */
  const _colorButton = document.getElementById('color');
  /** @type {HTMLButtonElement} */
  const _weightButton = document.getElementById('weight');
  /** @type {HTMLCanvasElement} */
  const _canvas = document.getElementById('canvas');
  const _context = _canvas.getContext('2d');
  /** @type {HTMLDivElement} */
  const _app = document.getElementById('app');

  // canvas resize observation
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target.id === 'canvas') {
        resizeCanvas();
      }
    }
  });
  observer.observe(_canvas);

  const STORAGE_KEY = "NowDraw"
  const colorModeClasses = ['black-white', 'white-black', 'yellow-blue'];
  const COLOR_SPLITTER = "-";
  const MAX_WEIGHT = 3;

  /** @type {Config} */
  let appConfig = loadConfig();
  applyConfig(appConfig);

  // ========== ========== Configuration ========== ==========

  /**
   * @typedef Config
   * @property {string | undefined} colorMode string of ${drawColor}-${backColor}, where color is CSS-interpretable string
   * @property {number | undefined} weight 1:normal 2:bold 3:super-bold
   */

  /**
   * @typedef Colors
   * @property {string} draw
   * @property {string} back
   */

  /**
   * Give default configuration
   * @returns {Config}
   */
  function getConfigDefault() {
    return {
      colorMode: colorModeClasses[0],
      weight: 2,
    };
  }

  /**
   * Save configuration
   * @param {Config} config configuration
   */
  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // console.log(`saved config : ${JSON.stringify(config)}`);
  }

  /**
   * Load configuration
   * @returns {Config} configuration
   */
  function loadConfig() {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (text != null) {
        const obj = JSON.parse(text);
        console.log(`[loadConfig] loaded config=${JSON.stringify(obj)}`)
        /** @type {Config} */
        const config = getConfigDefault();
        if (obj.colorMode != null && typeof obj.colorMode === 'string') {
          config.colorMode = obj.colorMode;
        }
        if (obj.weight != null && typeof obj.weight === 'number') {
          config.weight = obj.weight;
        }
        console.log(`config loaded : ${JSON.stringify(config)}`);
        return config;
      }
    } catch(err) {
      console.log(`error in config-load : ${err}`);
    }
    console.log('no config');
    return getConfigDefault();
  }

  /**
   * Apply configuration into this application
   * @param {Config} config 
   */
  function applyConfig(config) {
    if (config == null) return

    if (config.colorMode != null && typeof config.colorMode === 'string') {
      if (colorModeClasses.includes(config.colorMode)) {
        // clearColorMode()
        // textArea.classList.add(config.colorMode)
      }
    }
    if (config.weight != null && typeof config.weight === 'string') {
      if (weightClasses.includes(config.weight)) {
        // clearFontWeight()
        // textArea.classList.add(config.weight)
      }
    }
  }

  /**
   * Get draw-color and back-color from configuration
   * @returns {Colors} colors in configuration
   */
  function getColors() {
    const cfg = appConfig.colorMode ?? '';
    const colors = getColorsFromText(cfg);
    if (colors == null) {
      return {
        draw: 'black',
        back: 'white',
      }
    } else {
      return colors;
    }
  }

  /**
   * Get draw-color and back-color from text
   * @param {string} text 
   * @returns {Colors | undefined} colors in configuration, or undefined
   */
  function getColorsFromText(text) {
    const colors = text.split(COLOR_SPLITTER);
    if (colors.length === 2 && colors[0].length > 0 && colors[1].length > 0) {
      return {
        draw: colors[0],
        back: colors[1],
      };
    } else {
      return undefined;
    }
  }

  /**
   * Get drawing weight from configuration
   * @returns {number} weight in configuration
   */
  function getWeight() {
    switch(getWeightIndex()) {
      case 1: return 7;
      case 3: return 30;
      case 2: // fall-through
      default:
        return 15;
    }
  }

  function getWeightIndex() {
    switch(appConfig.weight) {
      case 1: return 1;
      case 2: return 2;
      case 3: return 3;
      default: return 2;
    }
  }

  // ========== ========== (end of configuration) ========== ==========

  function eraseCanvas() {
    const colors = getColors();
    _context.fillStyle = colors.back;
    _context.fillRect(0, 0, _canvas.width, _canvas.height);
  }

  function resizeCanvas() {
    // console.log(`[resizeCanvas] current: ${_canvas.width}x${_canvas.height} true-size: ${_canvas.clientWidth}x${_canvas.clientHeight}`);
    if (
      _canvas.width !== _canvas.clientWidth 
      || _canvas.height !== _canvas.clientHeight
    ) {
      _canvas.width = _canvas.clientWidth;
      _canvas.height = _canvas.clientHeight;
      eraseCanvas();
    }
  }

  function updateColorButton() {
    const colors = getColors();
    _colorButton.style.color = colors.draw;
    _colorButton.style.backgroundColor = colors.back;
  }

  function updateWeightButton() {
    const w = getWeightIndex();
    if (w === 1) { _weightButton.textContent = '1'; }
    else if (w === 3) { _weightButton.textContent = '3'; }
    else { _weightButton.textContent = '2'; }
  }

  function setEventHandlers() {
    // canvas drawing
    _canvas.addEventListener('pointermove', (ev) => {
      // when primary button pressed...
      if ((ev.buttons & 1) === 1) {
        _context.beginPath();
        const colors = getColors();
        _context.strokeStyle = colors.draw;
        const weight = getWeight();
        _context.lineWidth = weight;
        _context.lineCap = 'round';
        _context.moveTo(ev.offsetX - ev.movementX , ev.offsetY - ev.movementY);
        _context.lineTo(ev.offsetX, ev.offsetY);
        _context.stroke();
        _canvas.setPointerCapture(ev.pointerId);
      }
    });

    _eraseButton.addEventListener('click', (ev) => {
      eraseCanvas();
    })
  
    _colorButton.addEventListener('click', (ev) => {
      const colorsNow = getColorsFromText(appConfig.colorMode ?? '');
      if (colorsNow == null) {
        appConfig.colorMode = colorModeClasses[0];
      } else {
        const len = colorModeClasses.length
        let newIx = 0;
        for (let ix=0; ix<colorModeClasses.length; ix++) {
          const colorsThisSet = getColorsFromText(colorModeClasses[ix]);
          if (colorsThisSet.draw === colorsNow.draw && colorsThisSet.back === colorsNow.back) {
            newIx = (ix + 1 >= colorModeClasses.length) ? 0 : ix + 1;
            break;
          }
        }
        appConfig.colorMode = colorModeClasses[newIx];
      }
      updateColorButton();
      saveConfig(appConfig);
      eraseCanvas();
    })
  
    _weightButton.addEventListener('click', (ev) => {
      let numberWeight = getWeightIndex();
      numberWeight++;
      if (numberWeight > MAX_WEIGHT) {
        numberWeight = 1;
      }
      appConfig.weight = numberWeight;
      updateWeightButton();
      saveConfig(appConfig);
    })
  }

  setEventHandlers();
  resizeCanvas();
  updateColorButton();
  updateWeightButton();
  eraseCanvas();
});