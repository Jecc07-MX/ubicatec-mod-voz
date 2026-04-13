/**
 * VoiceModule UBICATEC
 * Narracion accesible para la vista de ruta accesible.
 * Restriccion de flujo: sin condicionales tradicionales.
 */
(function (global) {
    'use strict';

    const FOCUSABLE_QUERY = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const state = {
        active: false,
        supported: false,
        paused: false,
        speaking: false,
        queue: [],
        observer: null,
        bindInterval: 0,
        liveRegion: null,
        listenersInstalled: false,
        narrateTimer: 0,
        lastNarration: '',
        sidebarSelector: '#sidebar',
        language: 'es-MX',
        rate: 1
    };

    const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const textFrom = (selector) => normalizeText(document.querySelector(selector)?.textContent || '');
    const elementBySelector = (selector) => document.querySelector(selector);
    const isVisible = (element) => !!element && ((element.offsetWidth + element.offsetHeight) > 0 || element.getClientRects().length > 0);
    const speechSupported = () => !!(global.speechSynthesis && global.SpeechSynthesisUtterance);

    const createLiveRegion = () => {
        const region = document.createElement('div');
        region.id = 'ubicatecVoiceLive';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.setAttribute('role', 'status');
        region.style.position = 'fixed';
        region.style.width = '1px';
        region.style.height = '1px';
        region.style.margin = '-1px';
        region.style.padding = '0';
        region.style.border = '0';
        region.style.overflow = 'hidden';
        region.style.clip = 'rect(0 0 0 0)';
        region.style.clipPath = 'inset(50%)';
        document.body.appendChild(region);
        return region;
    };

    const ensureLiveRegion = () => (state.liveRegion = state.liveRegion || elementBySelector('#ubicatecVoiceLive') || createLiveRegion(), state.liveRegion);

    const publishLive = (message) => (
        ensureLiveRegion().textContent = '',
        ensureLiveRegion().textContent = message,
        message
    );

    const pickVoice = () => {
        const voices = state.supported ? global.speechSynthesis.getVoices() : [];
        return voices.find((voice) => /^es(-|_)/i.test(voice.lang || '')) ||
            voices.find((voice) => /span/i.test(voice.name || '')) ||
            null;
    };

    const speakText = (message) => {
        const utterance = new global.SpeechSynthesisUtterance(message);
        const selectedVoice = pickVoice();

        utterance.lang = state.language;
        utterance.rate = state.rate;
        utterance.pitch = 1;
        utterance.volume = 1;
        selectedVoice ? (utterance.voice = selectedVoice, utterance.lang = selectedVoice.lang || state.language) : 0;

        utterance.onend = () => (state.speaking = false, drainQueue());
        utterance.onerror = () => (state.speaking = false, drainQueue());

        state.speaking = true;
        publishLive(message);
        global.speechSynthesis.speak(utterance);
    };

    const drainQueue = () => (
        (state.active && state.supported && !state.paused && !state.speaking && state.queue.length > 0)
            ? speakText(state.queue.shift())
            : null
    );

    const queueLatestNarration = (message) => {
        const text = normalizeText(message);
        return text
            ? (
                state.lastNarration !== text ? (state.lastNarration = text) : 0,
                state.supported
                    ? (
                        state.queue = [text],
                        state.speaking ? global.speechSynthesis.cancel() : 0,
                        state.speaking = false,
                        state.paused ? publishLive(text) : drainQueue()
                    )
                    : publishLive(text),
                text
            )
            : '';
    };

    const getStepsNarration = () => {
        const items = Array.from(document.querySelectorAll('#stepsList .step-item'));
        return items.map((item, index) => {
            const title = normalizeText(item.querySelector('.step-title')?.textContent || '');
            const descriptions = Array.from(item.querySelectorAll('.step-desc'))
                .map((node) => normalizeText(node.textContent))
                .filter(Boolean)
                .join('. ');
            const warning = normalizeText(item.querySelector('.accessibility-alert')?.textContent || '');

            return normalizeText([
                title ? `Paso ${index + 1}: ${title}.` : '',
                descriptions ? `${descriptions}.` : '',
                warning ? `Alerta: ${warning}.` : ''
            ].join(' '));
        }).filter(Boolean);
    };

    const composeSidebarNarration = () => {
        const destino = textFrom('#infoDestino');
        const origen = textFrom('#infoOrigen');
        const distancia = textFrom('#infoDistancia');
        const tiempo = textFrom('#infoTiempo');
        const steps = getStepsNarration();
        return normalizeText([
            destino ? `Destino: ${destino}.` : '',
            origen ? `Origen: ${origen}.` : '',
            distancia ? `Distancia estimada: ${distancia}.` : '',
            tiempo ? `Tiempo estimado: ${tiempo}.` : '',
            steps.length ? `Pasos a seguir. ${steps.join(' ')}` : ''
        ].join(' '));
    };

    const scheduleNarration = () => (
        clearTimeout(state.narrateTimer),
        state.narrateTimer = global.setTimeout(() => {
            const summary = composeSidebarNarration();
            const changed = summary && summary !== state.lastNarration;
            changed ? queueLatestNarration(summary) : 0;
        }, 220)
    );

    const disconnectObserver = () => (
        state.observer ? state.observer.disconnect() : 0,
        state.observer = null
    );

    const bindObserver = () => {
        const sidebar = elementBySelector(state.sidebarSelector);
        return sidebar
            ? (
                disconnectObserver(),
                state.observer = new MutationObserver(() => scheduleNarration()),
                state.observer.observe(sidebar, { childList: true, subtree: true, characterData: true }),
                scheduleNarration(),
                true
            )
            : false;
    };

    const ensureObserver = () => (
        bindObserver() ||
        (
            clearInterval(state.bindInterval),
            state.bindInterval = global.setInterval(() => (
                (bindObserver() || !state.active) ? clearInterval(state.bindInterval) : 0
            ), 450)
        )
    );

    const getTrapRoot = () => (
        ['#overlayInfoAccesibilidad.visible', '#modalAccesibilidad.show', state.sidebarSelector, 'body']
            .map((selector) => elementBySelector(selector))
            .find((element) => isVisible(element)) || document.body
    );

    const getFocusableElements = (root) => Array.from(root.querySelectorAll(FOCUSABLE_QUERY))
        .filter((el) => !el.hasAttribute('disabled') && isVisible(el));

    const focusTrapRoot = () => {
        const root = getTrapRoot();
        root.hasAttribute('tabindex') ? 0 : root.setAttribute('tabindex', '-1');
        root.focus({ preventScroll: true });
        return root;
    };

    const trapFocus = (event) => {
        const isTab = event.key === 'Tab';
        const root = state.active ? getTrapRoot() : null;
        const focusables = root ? getFocusableElements(root) : [];
        const first = focusables[0] || root;
        const last = focusables[focusables.length - 1] || root;
        const active = document.activeElement;
        const cycleForward = isTab && !event.shiftKey && active === last;
        const cycleBackward = isTab && event.shiftKey && (active === first || active === root);

        (state.active && !!root && isTab && (cycleForward || cycleBackward))
            ? (event.preventDefault(), cycleForward ? first.focus() : last.focus())
            : 0;
    };

    const pause = () => (
        (state.supported && global.speechSynthesis.speaking)
            ? (global.speechSynthesis.pause(), state.paused = true, publishLive('Narracion en pausa.'))
            : state.paused
    );

    const resume = () => (
        (state.supported && global.speechSynthesis.paused)
            ? (global.speechSynthesis.resume(), state.paused = false, publishLive('Narracion reanudada.'))
            : (state.paused = false, drainQueue())
    );

    const togglePauseResume = () => (state.paused ? resume() : pause());

    const onGlobalKeydown = (event) => {
        const pressed = event.altKey && String(event.key || '').toLowerCase() === 'v';
        pressed ? (event.preventDefault(), togglePauseResume()) : 0;
        trapFocus(event);
    };

    const installListeners = () => (
        state.listenersInstalled
            ? 0
            : (document.addEventListener('keydown', onGlobalKeydown, true), state.listenersInstalled = true)
    );

    const primeSpeechEngine = () => (
        state.supported
            ? (
                state.speaking = true,
                (() => {
                    const primer = new global.SpeechSynthesisUtterance('Narrador de ruta activado.');
                    primer.lang = state.language;
                    primer.rate = state.rate;
                    primer.volume = 1;
                    primer.onend = () => (state.speaking = false, queueLatestNarration('Narrador activo. Usa Alt mas V para pausar o reanudar.'), drainQueue());
                    primer.onerror = () => (state.speaking = false, queueLatestNarration('Narrador activo. Usa Alt mas V para pausar o reanudar.'), drainQueue());
                    global.speechSynthesis.cancel();
                    global.speechSynthesis.speak(primer);
                })()
            )
            : publishLive('El navegador no tiene sintesis de voz disponible.')
    );

    const activateFromAccessibilityButton = (options = {}) => (
        state.sidebarSelector = options.sidebarSelector || state.sidebarSelector,
        state.rate = Number(options.rate) || state.rate,
        state.language = options.language || state.language,
        state.supported = speechSupported(),
        state.active = true,
        state.paused = false,
        ensureLiveRegion(),
        installListeners(),
        ensureObserver(),
        focusTrapRoot(),
        primeSpeechEngine(),
        scheduleNarration(),
        api
    );

    const deactivate = () => (
        state.active = false,
        state.paused = false,
        clearInterval(state.bindInterval),
        clearTimeout(state.narrateTimer),
        disconnectObserver(),
        state.supported ? global.speechSynthesis.cancel() : 0,
        state.speaking = false,
        state.queue = [],
        publishLive('Narrador desactivado.'),
        api
    );

    const api = {
        activateFromAccessibilityButton,
        togglePauseResume,
        pause,
        resume,
        deactivate,
        narrateNow: () => queueLatestNarration(composeSidebarNarration()),
        getState: () => ({ ...state })
    };

    global.UBICATECVoiceModule = api;
})(window);