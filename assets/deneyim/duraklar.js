/* Anlatı durakları: hem 3D hem mobil görsel akış aynı metni kullanır. */
export const DURAKLAR = [
  { p: 0.125, id: 'rotor',     ad: 'Rotor',              en: 'ROTOR',           bilgi: '116,8 m çap · 57,3 m kanat · 7,9–14,1 d/dk' },
  { p: 0.49,  id: 'gobek',     ad: 'Göbek',              en: 'HUB',             bilgi: 'Üç kanat yatağı · kanat açısı burada ayarlanır' },
  { p: 0.515, id: 'nasel',     ad: 'Nasel içi',          en: 'NACELLE',         bilgi: '12,4 × 4,2 × 4,0 m · yerden 120 m' },
  { p: 0.55,  id: 'anaYatak',  ad: 'Ana yatak',          en: 'MAIN BEARING',    bilgi: 'Rotorun ağırlığını ve itkisini taşır' },
  { p: 0.59,  id: 'anaMil',    ad: 'Ana mil',            en: 'MAIN SHAFT',      bilgi: 'Düşük devir, yüksek tork · göbekten dişli kutusuna' },
  { p: 0.635, id: 'disli',     ad: 'Dişli kutusu',       en: 'GEARBOX',         bilgi: '3 kademe · planet-planet-helisel' },
  { p: 0.685, id: 'kaplin',    ad: 'Kaplin',             en: 'COUPLING',        bilgi: 'Hızlı mil → jeneratör · fren diski ve kaliper' },
  { p: 0.76,  id: 'jenerator', ad: 'Jeneratör',          en: 'GENERATOR',       bilgi: '3.000 kW · çift beslemeli asenkron · 660 V' },
  { p: 0.845, id: 'konvertor', ad: 'Konvertör',          en: 'CONVERTER',       bilgi: 'Rotor devresini besler · şebekeye sabit frekans' },
  { p: 0.875, id: 'ustKutu',   ad: 'Üst kutu',           en: 'TOP BOX',         bilgi: 'Nasel kontrolü · PLC ve güvenlik zinciri' },
  { p: 0.905, id: 'panolar',   ad: 'Elektrik panoları',  en: 'CONTROL CABINETS',bilgi: 'Yardımcı güç · soğutma, aydınlatma, vinç devreleri' },
  { p: 0.93,  id: 'kablolar',  ad: 'Kablolar',           en: 'CABLES',          bilgi: 'Güç kabloları · kuleye inen sarkma ilmeği' },
];
