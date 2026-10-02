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
