import { element, required } from './dom.ts';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function setupPwa() {
  const info = required('#info-dialog');
  const section = element('section', 'pwa-info');
  const heading = element('h3', '', 'Als App nutzen');
  const install = element('button', 'secondary-button', 'App installieren');
  install.id = 'app-install';
  install.hidden = true;
  const instruction = element(
    'p',
    '',
    'Im Browsermenü „App installieren“ wählen. Auf dem iPhone: Teilen → Zum Home-Bildschirm. Falls diese Option hier fehlt, öffne die Seite in Safari oder Chrome.',
  );
  const state = element('p', 'pwa-state', 'Offline-Liste wird vorbereitet …');
  state.id = 'offline-state';
  state.setAttribute('role', 'status');
  const update = element(
    'p',
    '',
    'Neue Version bereit. Schließe alle Fenster dieser Karte und die installierte App. Beim nächsten Öffnen wird die neue Version verwendet. Deine Favoriten bleiben erhalten.',
  );
  update.id = 'app-update';
  update.hidden = true;
  const check = element('button', 'text-button', 'Offline-Status und Updates prüfen');
  check.id = 'app-update-check';
  section.append(heading, install, instruction, state, update, check);
  info.append(section);
  const banner = element('p', 'pwa-banner');
  banner.id = 'pwa-banner';
  banner.setAttribute('role', 'status');
  required('.search-panel').after(banner);
  let ready = false;
  let waiting = false;
  let registration: ServiceWorkerRegistration | undefined;
  let deferred: InstallPrompt | undefined;
  const standalone = matchMedia('(display-mode: standalone)');
  const installed = () => {
    install.hidden = true;
    instruction.textContent =
      'Als App geöffnet oder installiert. Du kannst Kunstpunkte über dein App-Symbol starten.';
  };
  if (standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone)
    installed();
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPrompt;
    install.hidden = false;
  });
  window.addEventListener('appinstalled', installed);
  install.addEventListener('click', async () => {
    if (!deferred) return;
    const prompt = deferred;
    deferred = undefined;
    install.hidden = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') installed();
    } catch {
      instruction.textContent =
        'Bitte über das Browsermenü installieren oder zum Home-Bildschirm hinzufügen.';
    }
  });
  function showConnectivity() {
    banner.hidden = navigator.onLine && !waiting;
    banner.textContent = !navigator.onLine
      ? ready
        ? 'Offline · Liste, Suche und Favoriten verfügbar. Kartenhintergrund und externe Links benötigen Internet.'
        : 'Offline · Offline-Daten noch nicht bestätigt. Bitte bei Verbindung erneut öffnen.'
      : 'Update bereit · Hinweise zum Aktualisieren unter ⓘ.';
  }
  showConnectivity();
  async function inspect() {
    waiting = !!registration?.waiting;
    update.hidden = !waiting;
    const worker = registration?.active;
    if (!worker) {
      showConnectivity();
      return;
    }
    ready = await new Promise<boolean>((resolve) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => {
        channel.port1.close();
        resolve(false);
      }, 4000);
      channel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(event.data?.type === 'OFFLINE_STATUS' && event.data.ready === true);
      };
      try {
        worker.postMessage({ type: 'OFFLINE_STATUS', repair: navigator.onLine }, [channel.port2]);
      } catch {
        clearTimeout(timeout);
        channel.port1.close();
        resolve(false);
      }
    });
    state.textContent = ready
      ? 'Offline bereit: App, Liste, Suche, Filter und Textdetails sind auf diesem Gerät gespeichert. Der Datenstand steht oben. Kartenkacheln und externe Seiten werden nicht offline gespeichert.'
      : 'Offline-Speicher fehlt oder ist unvollständig. Bitte online erneut öffnen. Falls ein Update bereitsteht, alle App-Fenster schließen und neu öffnen.';
    showConnectivity();
  }
  async function checkUpdates() {
    if (navigator.onLine && registration) {
      try {
        await registration.update();
      } catch {
        /* Existing offline version remains usable. */
      }
    }
    await inspect();
  }
  check.addEventListener('click', () => void checkUpdates());
  window.addEventListener('online', () => {
    showConnectivity();
    void checkUpdates();
  });
  window.addEventListener('offline', showConnectivity);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkUpdates();
  });
  if (!import.meta.env.PROD) {
    state.textContent =
      'Entwicklungsansicht: Offline-Funktion im Produktionsbuild testen (npm run preview).';
    check.hidden = true;
    return;
  }
  if (!('serviceWorker' in navigator)) {
    state.textContent =
      'Dieser Browser unterstützt hier keine Offline-Speicherung. Die Online-Karte bleibt nutzbar.';
    check.hidden = true;
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => void inspect());
  void (async () => {
    try {
      const base = new URL(import.meta.env.BASE_URL, location.href);
      registration = await navigator.serviceWorker.register(new URL('sw.js', base), {
        scope: base.pathname,
        updateViaCache: 'none',
      });
      function trackInstall() {
        const worker = registration?.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'activated' || worker.state === 'installed') void inspect();
          if (worker.state === 'redundant') {
            state.textContent =
              'Offline-Vorbereitung oder Update fehlgeschlagen. Eine vorhandene vollständige Version bleibt erhalten. Bitte später erneut prüfen.';
          }
        });
      }
      registration.addEventListener('updatefound', trackInstall);
      trackInstall();
      await inspect();
    } catch {
      state.textContent =
        'Offline-Speicherung konnte nicht gestartet werden. Bitte Verbindung und Browsereinstellungen prüfen und die Seite erneut öffnen.';
    }
  })();
}
