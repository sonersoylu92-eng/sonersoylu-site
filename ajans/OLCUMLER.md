# Ölçümler

Kaynak: D1 `soner-tani` (sorgular `sorgular.sql`). "Sorunlu oturum" = `birak`, `takilma` ya da `statik` (zayif-*).

## 2026-10-02 · tur 0 (başlangıç çizgisi) — telefon düzeltmesi 1d0dbee yayından hemen sonra
Son 7 gün, cihaz tipine göre:
| tip | oturum | sorunlu | oran | sahnede |
|---|---|---|---|---|
| iPhone | 114 | 27 | %24 | 67 |
| Android | 6 | 3 | %50 | 4 |
| Masaüstü | 62 | 35 | %56 | 29 |

Telefon, gün gün: 29 Eyl 0/5 · 30 Eyl 3/32 · **1 Eki 21/44** · 2 Eki 6/39 (düzeltme öncesi + sonrası karışık)
Not: Android 10 cihazında açılışta 2,2 sn ve 4,9 sn donma (`takilma p=0`), ardından `zayif-az-bellek`.
Not: masaüstündeki yüksek oranın bir kısmı WebGL'siz bot/test tarayıcıları olabilir (`statik webgl-yok`) → ayrıştırılmalı.
Not: telemetri sürüm etiketi `akici15` yapıldı; S4 sorgusu bundan sonra düzeltme öncesi/sonrası karşılaştırır.
