-- D1 veritabanı: soner-tani · kimlik 4d6e80f1-e427-42f8-a9fa-ea79d89c6f9f
-- Tablo: olay (t ms, sayfa, olay, neden, cihaz, tarayici, gpu, ekran, dpr, kalite, kare_ms, sure_ms, oturum, ulke, surum)
-- olay: basla · hazir · ozet(neden: sahnede|kapakta|acilmadi) · statik(neden) · birak(neden) · takilma(neden: p, ms, …)

-- S1: son 7 günün cihaz tipi × olay özeti (telefon = iPhone/Android)
SELECT CASE WHEN cihaz LIKE 'iPhone%' THEN 'iPhone' WHEN cihaz LIKE 'Android%' THEN 'Android' ELSE 'Masaüstü' END tip,
       olay, COUNT(*) n, COUNT(DISTINCT oturum) oturum, ROUND(AVG(kare_ms),1) ort_kare
FROM olay WHERE t > strftime('%s','now','-7 days')*1000 GROUP BY tip, olay ORDER BY tip, n DESC;

-- S2: telefonda sorunlu oturum oranı, gün gün (sorunlu = birak, takilma ya da zayif-* statik)
SELECT date(t/1000,'unixepoch') gun,
       COUNT(DISTINCT oturum) oturum,
       COUNT(DISTINCT CASE WHEN olay IN ('birak','takilma') OR (olay='statik' AND neden LIKE 'zayif%') THEN oturum END) sorunlu
FROM olay WHERE (cihaz LIKE 'iPhone%' OR cihaz LIKE 'Android%') AND t > strftime('%s','now','-14 days')*1000
GROUP BY gun ORDER BY gun;

-- S3: son takılmalar (nerede, ne kadar)
SELECT datetime(t/1000,'unixepoch') zaman, cihaz, gpu, neden FROM olay WHERE olay='takilma' ORDER BY t DESC LIMIT 15;

-- S4: sürüm bazında sahne oranı (yeni sürüm etkisi)
SELECT surum, COUNT(DISTINCT oturum) oturum,
       ROUND(100.0*COUNT(DISTINCT CASE WHEN olay='ozet' AND neden='sahnede' THEN oturum END)/COUNT(DISTINCT oturum),1) sahnede_yuzde
FROM olay WHERE t > strftime('%s','now','-14 days')*1000 GROUP BY surum ORDER BY oturum DESC;

-- S5: masaüstü oturumlarını ayrıştır — bot/test tarayıcısı · kısa (<3 sn) · gerçek; arka plan boşluğu ayrı sayılır
-- bot/test = gpu webgl-yok | SwiftShader | llvmpipe | tarayici 'diğer' | Linux'ta "Intel Iris OpenGL Engine" (Mac'e özgü dize, sahte imza)
-- arka plan = takilma ms >= 10000 (sekme/pencere arkadayken geçen süre takılma diye yazılıyor; bkz. OLCUMLER tur 1)
-- ciddi = birak | statik zayif-* | takilma 1000–9999 ms
WITH e AS (
  SELECT *, CASE WHEN olay='takilma' THEN CAST(substr(neden, instr(neden,'ms=')+3, instr(substr(neden, instr(neden,'ms=')+3),' ')-1) AS INTEGER) END tms
  FROM olay WHERE cihaz NOT LIKE 'iPhone%' AND cihaz NOT LIKE 'Android%' AND t > strftime('%s','now','-7 days')*1000),
o AS (
  SELECT oturum, MIN(cihaz) cihaz, MIN(gpu) gpu, MIN(tarayici) tarayici,
         MAX(MAX(t)-MIN(t), COALESCE(MAX(CASE WHEN olay='ozet' THEN sure_ms END),0)) sure,
         MAX(CASE WHEN olay IN ('birak','takilma') OR (olay='statik' AND neden LIKE 'zayif%') THEN 1 ELSE 0 END) sorunlu,
         MAX(CASE WHEN olay='birak' OR (olay='statik' AND neden LIKE 'zayif%') OR (olay='takilma' AND tms BETWEEN 1000 AND 9999) THEN 1 ELSE 0 END) ciddi,
         MAX(CASE WHEN olay='takilma' AND tms >= 10000 THEN 1 ELSE 0 END) arka_plan
  FROM e GROUP BY oturum)
SELECT CASE
         WHEN gpu='webgl-yok' OR gpu LIKE '%SwiftShader%' OR gpu LIKE '%llvmpipe%' OR tarayici='diğer'
              OR (cihaz='Linux' AND gpu LIKE '%Iris OpenGL%') THEN 'bot/test'
         WHEN sure < 3000 THEN 'kisa (<3 sn)'
         WHEN gpu LIKE '%Apple M1%' THEN 'gercek · Mac M1'
         ELSE 'gercek · diger' END sinif,
       COUNT(*) oturum, SUM(sorunlu) sorunlu, SUM(ciddi) ciddi, SUM(arka_plan) arka_plan,
       ROUND(100.0*SUM(sorunlu)/COUNT(*),0) sorunlu_yuzde
FROM o GROUP BY sinif ORDER BY oturum DESC;
