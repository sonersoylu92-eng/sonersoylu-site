/* uretici.js — makine nokta bulutlarını ana iş parçacığını yormadan üretir (modül işçisi). */
import { hazirla } from './makineler.js?v=9a8aabb4';

self.onmessage = (e) => {
  const { ad, N } = e.data;
  try {
    const v = hazirla(ad, N);
    self.postMessage(v, [v.pos.buffer, v.rot.buffer, v.hub.buffer]);
  } catch (h) {
    self.postMessage({ ad, hata: String(h) });
  }
};
