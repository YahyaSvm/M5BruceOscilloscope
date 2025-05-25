# M5BruceOsiloskop - v1.5

**Geliştirici:** YahyaSvm, takagi-1
**Hedef Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce)
**Sürüm:** 1.5 (Yayın Tarihi: 2024-07-29)
**Diller:** [English](./README.md) | [Türkçe](./README_tr.md)

M5Stack cihazlarında **Bruce Firmware** çalıştıranlar için özel olarak tasarlanmış JavaScript tabanlı bir osiloskop uygulamasıdır. Bu proje, Bruce ortamının yeteneklerini kullanarak M5Stack üzerinde doğrudan işlevsel bir osiloskop deneyimi sunmayı amaçlamaktadır.

![M5BruceOsiloskop Ekran Görüntüsü](./assets/screenshot_scope.png)
![How to use Screenshot](./assets/M5stack.png)

## Özellikler (v1.5)

*   **Bruce Firmware** (pr3y tarafından) hedeflenmiştir.
*   Çift Kanal Görüntüleme (CH2 varsayılanda devre dışı).
*   Ayarlanabilir Zaman/Piksel (Yatay tarama hızı).
*   Ayarlanabilir Volt/Kademe (Dikey hassasiyet).
*   Ayarlanabilir Tetikleme Seviyesi (ayarlardan seçilebilir yüzdeler: %10, %25, %50, %75, %90).
*   Seçili kanal için Vpp (Tepeden Tepeye) Ölçümü.
*   Seçili kanal için Frekans Ölçümü (Temel).
*   Seçilebilir Ölçüm Kanalı (CH1 veya CH2).
*   Yapılandırılabilir Tetikleme Kenarı (Yükselen veya Düşen).
*   Kaydırmalı Menü Arayüzü.
*   Kaydırılabilir metin içeren Özel Güvenlik Bilgileri Ekranı.
*   Yapılandırılabilir Buton Düzeni.
*   Heuristik USB/Şarj Algılama ve Uyarı (Deneysel, artık engellemeyen, 'Devam Et' seçeneği ve zaman aşımı mevcut).
*   **YENİ (v1.4): Gelişmiş Osiloskop Duraklatma (Pause):**
    *   "Pause" tuşuna basıldığında, ekrandaki mevcut dalga formu **anında dondurulur**.
    *   Duraklatma anındaki Vpp ve Frekans değerleri bilgi çubuğunda gösterilir.
    *   "PAUSED" mesajı, daha iyi okunabilirlik için kendi küçük arka planıyla dondurulmuş grafiğin üzerine çizilir.
    *   Footer "Resume" (Devam Et) olarak güncellenir.
*   **YENİ (v1.4): Şarj Uyarısı Butonu Güncellemesi:**
    *   Şarj uyarısı ekranındaki "OK (Kapat)" butonu, sadece "OK" olarak değiştirildi.

## !!! ÖNEMLİ GÜVENLİK UYARILARI !!!

*   **M5STACK'İNİZİN HASAR GÖRME RİSKİ:**
    *   **VOLTAJ LİMİTLERİ:** M5Stack cihazlarındaki ADC pinlerinin **MAKSİMUM GİRİŞ VOLTAJI (genellikle 0V ila 3.3V)** vardır. Kesin ADC limitleri için özel M5Stack modelinize ve Bruce Firmware belgelerine bakın.
    *   **BU LİMİTLERİ AŞAN VOLTAJLARI ASLA DOĞRUDAN BAĞLAMAYIN.** Aksi takdirde **KALICI HASARA** neden olursunuz.
*   **YÜKSEK VOLTAJ VEYA AC SİNYALLERİN ÖLÇÜMÜ:**
    *   ADC'nin güvenli giriş aralığından daha yüksek voltajlar için bir **VOLTAJ BÖLÜCÜ DEVRESİ** kullanın.
    *   AC sinyaller için uygun şartlandırma devresi kullanın (DC ofset, kenetleme diyotları).
*   **PİN DOĞRULAMASI (KRİTİK):**
    *   Çalıştırmadan önce, `M5BruceOscilloscope_v1.4.js` (veya güncel sürüm) dosyasının başındaki `BTN_M5_SELECT_EXIT_PIN`, `BTN_NAV_UP_PIN`, `BTN_NAV_DOWN_PIN`, `CH1_PIN`, `CH2_PIN` ve `USB_DETECT_PIN` (kullanılıyorsa) sabitlerinin **KENDİ M5Stack modelinizin Bruce Firmware tarafından tanınan GPIO'larıyla eşleştiğini DOĞRULAYIN VE DÜZELTİN**. Yanlış pin atamaları çalışmayan kontrollere veya arızaya yol açar.
*   **USB GÜÇ ETKİLEŞİMİ:**
    *   M5Stack'i USB gücüne (şarj veya veri için) bağlamak, önemli ölçüde gürültü ekleyebilir veya ADC okumalarını etkileyebilir, bu da doğru osiloskop ölçümlerini zorlaştırabilir veya imkansız hale getirebilir.
    *   Bu uygulama, potansiyel USB güç bağlantısını algılamak için bir heuristik içerir ve bir uyarı gösterecektir. **Güvenilir ölçümler için, osiloskopu başlatmadan önce M5Stack'in USB kablosunu çıkarın.**
    *   USB algılama heuristiği **MÜKEMMEL DEĞİLDİR** ve donanımınıza ve bağladığınız problara bağlı olarak yanlış pozitif veya negatif sonuçlar verebilir. Sadece buna güvenmeyin; en iyi sonuçlar için daima USB gücünü ayırın.
*   **DENEYSEL YAZILIM:**
    *   Bu yazılımı kullanmak **TAMAMEN SİZİN SORUMLULUĞUNUZDADIR**. Geliştiriciler (YahyaSvm, takagi-1) herhangi bir hasardan sorumlu değildir.

## Donanım Gereksinimleri

*   M5Stack Cihazı (örn. M5StickC, M5StickC Plus, M5Stack Core2)
*   **Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce) yüklenmiş ve çalışıyor olmalıdır.
*   **Butonlar:** (Script başındaki sabitlerle M5Stack modelinize göre doğrulayın)
    *   **M5 Butonu (Ön/Yan):** Seç / Değeri Değiştir / Çıkış (Varsayılan: GPIO 37)
    *   **Üst Buton:** Yukarı Git / Önceki Öğe / Osiloskopta Pause/Resume (Varsayılan: GPIO 35)
    *   **Alt Buton (varsa):** Aşağı Git / Sonraki Öğe (Varsayılan: GPIO 39)
*   **Analog Girişler:** İki ADC özellikli pin (Script başındaki sabitlerle M5Stack modelinize göre doğrulayın. Varsayılanlar: CH1_PIN=36, CH2_PIN=25)
*   **Batarya Voltaj Pini (isteğe bağlı, heuristik şarj algılama için):** (Varsayılan: BATTERY_ADC_PIN=38)

## Kurulum ve Yapılandırma

1.  **Bruce Firmware'i Yükleyin:** M5Stack cihazınıza [Bruce Firmware](https://github.com/pr3y/Bruce)'in yüklü olduğundan emin olun.
2.  **Pinleri Yapılandırın:** `M5BruceOscilloscope_v1.5.js` (veya güncel sürüm) dosyasını açın ve dosyanın başındaki butonlarınız, ADC girişleriniz ve batarya pini (kullanılıyorsa) için **GPIO pin numaralarını**, Bruce Firmware'in özel M5Stack modelinizde bunları nasıl tanıdığına göre **dikkatlice ayarlayın**.
3.  **Karakter Genişliği:** Bruce Firmware'in yazı tipiyle cihazınızın ekranında metin hizalaması bozuksa, script'teki `CHAR_WIDTH_PX` (varsayılan: `6`) değerini ayarlayın.
4.  **Script'i Yükleyin:**
    *   `M5BruceOscilloscope_v1.5.js` dosyasını M5Stack'inize aktarın (örn. Bruce destekliyorsa SD kart aracılığıyla veya Bruce'un REPL/IDE'sine yapıştırarak).
    *   Script'i Bruce Firmware ortamında çalıştırın.

## Kullanım (Buton Düzeni)

*   **M5 Butonu (Ön/Yan - Genellikle GPIO 37):**
    *   **Menüler:** Vurgulanan öğeyi seçin.
    *   **Ayarlar Menüsü:** Seçili ayarın değerini değiştirin / Ayarlardan çıkmak için "Back" öğesini seçin.
    *   **Osiloskop/Hakkında/Güvenlik Ekranları:** Önceki menüye çıkın.
    *   **USB Uyarı Ekranı:** Ana menüye dönmek için "Menü"yü seçin.
*   **Üst Buton (Genellikle GPIO 35 M5StickC'de, veya sizin atadığınız):**
    *   **Menüler:** YUKARI gidin (önceki öğeyi seçin).
    *   **Osiloskop Ekranı:** Pause (Duraklat) / Resume (Devam Et).
    *   **Güvenlik Bilgisi Ekranı:** Metni YUKARI kaydırın.
    *   **USB Uyarı Ekranı:** Osiloskopa devam etmek için "Devam Et"i seçin.
*   **Alt Buton (Genellikle GPIO 39 M5StickC'de, veya sizin atadığınız):**
    *   **Menüler:** AŞAĞI gidin (sonraki öğeyi seçin).
    *   **Güvenlik Bilgisi Ekranı:** Metni AŞAĞI kaydırın.

## Değişiklik Kaydı

*   **v1.5 (2024-07-29):**
    *   Ayarlanabilir Tetikleme Seviyesi eklendi (ayarlar üzerinden yüzdesel seçimle).
    *   USB/Şarj uyarısı, 'Devam Et' seçeneği ve zaman aşımı ile engellemeyen şekilde düzenlendi.
    *   Ayarlardaki 'Ölçüm Kanalı' seçim mantığı daha iyi kullanılabilirlik için iyileştirildi.
    *   Kod yapısını iyileştirmek için `oscilloscopeScreen` fonksiyonunda dahili yeniden düzenleme yapıldı.
*   **v1.4 (2025-11-5):**
    *   Gelişmiş Osiloskop Duraklatma (Pause) işlevi eklendi: Anlık dalga formu dondurma, duraklatma anındaki Vpp/Frekans gösterimi.
    *   Şarj uyarısı buton metni "OK" olarak güncellendi.
    *   Kod yapısında küçük iyileştirmeler (resetSweepState fonksiyonu).
*   **v1.3 (2025-10-5):**
    *   Osiloskop ekranına temel Pause/Resume butonu eklendi.
    *   İyileştirilmiş kaydırmalı menü arayüzü.
    *   Heuristik USB/Şarj algılama ve uyarı eklendi.
    *   Takagi-1 geliştirici olarak eklendi.

## Bilinen Sorunlar / Sınırlamalar

*   Bu script, Bruce Firmware tarafından sağlanan JavaScript ortamı için özel olarak hazırlanmıştır. Diğer M5Stack firmware'leriyle (örn. UIFlow, Arduino, standart Espruino) uyumluluk garanti edilmez.
*   Çok yüksek frekanslı sinyaller için performans, Bruce içindeki JavaScript yürütme hızıyla sınırlı olabilir.
*   USB/Şarj algılama, ADC pin durumuna dayanan bir heuristiktir ve tüm M5Stack modellerinde veya senaryolarda %100 güvenilir olmayabilir.
*   `digitalRead()` davranışı ve `pinMode()` seçenekleri Bruce'ta diğer ortamlara göre biraz farklılık gösterebilir; mevcut uygulama standart davranışı varsayar.

## Gelecek Fikirleri

*   AC/DC Kuplajı (donanım arayüzü ve yazılım mantığı gerektirir).
*   Daha gelişmiş tetikleme modları (Normal, Otomatik, Tek).
*   Ayarları kaydetme/yükleme (Bruce bir dosya sistemi API'si sağlıyorsa).

## Katkıda Bulunma

Katkılarınızı, sorun bildirimlerinizi ve özellik isteklerinizi bekliyoruz!

## Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.
