import { initProgModule } from './modules/prog';
import { initMaterialsModule } from './modules/materials';
import { initFibreModule } from './modules/fibre';

window.__progInit = initProgModule;
window.__materialsInit = initMaterialsModule;
window.__fibreInit = initFibreModule;

function syncInitialModule() {
  const hash = (location.hash || '').slice(1).split('?')[0];
  const saved = (() => {
    try {
      return localStorage.getItem('mathnexMod');
    } catch {
      return null;
    }
  })();
  const active = hash.startsWith('mod-') ? hash.slice(4) : saved;
  if (active === 'prog') initProgModule();
  else if (active === 'materials') initMaterialsModule();
  else if (active === 'fibre') initFibreModule();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncInitialModule);
} else {
  syncInitialModule();
}
