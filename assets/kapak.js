// ⏰ Canlı Saat ve Tarih + Analog Saat
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    // Digital saat
    const timeEl = document.getElementById('cIsik');
    if (timeEl) {
        timeEl.innerHTML = `<time>${day}/${month}/${year} ${hours}:${minutes}:${seconds}</time>`;
    }
    
    // Analog saat kollarını güncelle
    const hour = now.getHours() % 12;
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const millisecond = now.getMilliseconds();
    
    // Saniye kolunun smooth rotasyonu (milliseconds dahil)
    const secondDegree = (second + millisecond / 1000) * 6;
    const minuteDegree = (minute + second / 60) * 6;
    const hourDegree = (hour + minute / 60) * 30;
    
    const secondHand = document.getElementById('secondHand');
    const minuteHand = document.getElementById('minuteHand');
    const hourHand = document.getElementById('hourHand');
    
    if (secondHand) secondHand.setAttribute('transform', `rotate(${secondDegree} 100 100)`);
    if (minuteHand) minuteHand.setAttribute('transform', `rotate(${minuteDegree} 100 100)`);
    if (hourHand) hourHand.setAttribute('transform', `rotate(${hourDegree} 100 100)`);
}

// 🌅 Güneş Konumuna Göre Fotoğraf Geçişi (Sabah/Akşam/Gece)
function updateDayPhase() {
    const now = new Date();
    const hour = now.getHours();
    let filterValue = '';
    
    if (hour >= 5 && hour < 8) {
        // Sabah - Açık, parlak gökyüzü
        filterValue = 'brightness(1.15) saturate(1.1) hue-rotate(-8deg)';
    } else if (hour >= 8 && hour < 17) {
        // Gün - Normal
        filterValue = 'brightness(1) saturate(1) hue-rotate(0deg)';
    } else if (hour >= 17 && hour < 21) {
        // Akşam/Gün Batımı - Turuncu/Kızıl tonlar
        filterValue = 'brightness(0.9) saturate(1.4) hue-rotate(25deg) sepia(0.3)';
    } else {
        // Gece - Koyu, mavi tonlar
        filterValue = 'brightness(0.5) saturate(0.7) hue-rotate(-15deg)';
    }
    
    const kapakKat = document.querySelector('.kapak-kat img');
    if (kapakKat) {
        kapakKat.style.filter = filterValue;
    }
}

// 🌪️ Rüzgar Hızına Göre Rotor Devri
async function updateWindTurbine() {
    try {
        const response = await fetch('/api/ruzgar?s=bergama');
        const data = await response.json();
        
        if (data.ok && data.current) {
            const windSpeed = data.current.wind_speed_120m || 0;
            const rpm = calculateRPM(windSpeed);
            
            // Rüzgar hızını göster
            const windSpeedEl = document.getElementById('cHava');
            if (windSpeedEl) {
                windSpeedEl.innerHTML = `${windSpeed.toFixed(1)} m/s`;
            }
            
            // Rotor devri göster
            const rpmEl = document.getElementById('kDevir');
            if (rpmEl) {
                rpmEl.textContent = rpm.toFixed(1);
            }
            
            // Rotoru döndür
            const rotor = document.querySelector('.pal');
            if (rotor && rpm > 0) {
                rotor.style.animation = `spin ${(60 / rpm).toFixed(2)}s linear infinite`;
            } else if (rotor) {
                rotor.style.animation = 'none';
            }
        }
    } catch (error) {
        console.error('Rüzgar verisi hatası:', error);
    }
}

// RPM hesaplama (Nordex N90 specifications)
function calculateRPM(windSpeed) {
    if (windSpeed < 3) return 0;
    if (windSpeed >= 3 && windSpeed < 12) {
        return (windSpeed / 12) * 12;
    }
    if (windSpeed >= 12) return 12;
    return 0;
}

// CSS animasyonu ekle
function addAnimationStyle() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .pal { transform-origin: center; will-change: transform; }
    `;
    document.head.appendChild(style);
}

// Başlat
console.log('kapak.js dosyası yüklendi');

function init() {
    console.log('init() başlatılıyor');
    addAnimationStyle();
    updateClock();
    updateDayPhase();
    updateWindTurbine();
    
    // Saat: her 50ms güncellensin (smooth animasyon)
    setInterval(updateClock, 50);
    // Filtre: her 60 saniye
    setInterval(updateDayPhase, 60000);
    // Rüzgar: her 60 saniye
    setInterval(updateWindTurbine, 60000);
}

if (document.readyState === 'loading') {
    console.log('DOMContentLoaded bekleniyor');
    document.addEventListener('DOMContentLoaded', init);
} else {
    console.log('DOM zaten yüklendi, init() çalıştırılıyor');
    init();
}
