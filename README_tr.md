# M5BruceOsiloskop - v1.3

**Geliştirici:** YahyaSvm , takagi-1
**Hedef Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce)
**Sürüm:** 1.2 (Yayın Tarihi: [2025-9-5)
**Diller:** [English](./README.md) | [Türkçe](./README_tr.md)

M5Stack cihazlarında **Bruce Firmware** çalıştıranlar için özel olarak tasarlanmış JavaScript tabanlı bir osiloskop uygulamasıdır. Bu proje, Bruce ortamının yeteneklerini kullanarak M5Stack üzerinde doğrudan işlevsel bir osiloskop deneyimi sunmayı amaçlamaktadır.


![M5BruceOsiloskop Ekran Görüntüsü](./assets/screenshot_scope.png)

![How to use Screenshot](./assets/M5stack.png)

## Özellikler (v1.3)

*   **Bruce Firmware** (pr3y tarafından) hedeflenmiştir.
*   Çift Kanal Görüntüleme (CH2 devre dışı bırakılabilir).
*   Ayarlanabilir Zaman/Piksel (Yatay tarama hızı).
*   Yeni osiloskop kımına pause butonu eklendi.
*   Ayarlanabilir Volt/Kademe (Dikey hassasiyet).
*   Seçili kanal için Vpp (Tepeden Tepeye) Ölçümü.
*   Seçili kanal için Frekans Ölçümü (Temel).
*   Seçilebilir Ölçüm Kanalı (CH1 veya CH2).
*   Yapılandırılabilir Tetikleme Kenarı (Yükselen veya Düşen).
*   **İyileştirildi:** Kaydırmalı Menü Arayüzü (Kırpma azaltıldı).
*   Kaydırılabilir metin içeren Özel Güvenlik Bilgileri Ekranı.
*   Yapılandırılabilir Buton Düzeni (M5StickC benzeri cihazlar için varsayılanlar ayarlanmıştır).
*   **YENİ:** Heuristik USB/Şarj Algılama ve Uyarı. USB güç bağlantısını algılamaya çalışır ve kullanıcıyı uyararak, bağlantı varken osiloskop ekranına geçişi engeller (çünkü USB gücü gürültülü okumalara neden olabilir). *(Aşağıdaki uyarılara bakın)*

## !!! ÖNEMLİ GÜVENLİK UYARILARI !!!

*   **M5STACK'İNİZİN HASAR GÖRME RİSKİ:**
    *   **VOLTAJ LİMİTLERİ:** M5Stack cihazlarındaki ADC pinlerinin **MAKSİMUM GİRİŞ VOLTAJI (genellikle 0V ila 3.3V)** vardır. Kesin ADC limitleri için özel M5Stack modelinize ve Bruce Firmware belgelerine bakın.
    *   **BU LİMİTLERİ AŞAN VOLTAJLARI ASLA DOĞRUDAN BAĞLAMAYIN.** Aksi takdirde **KALICI HASARA** neden olursunuz.
*   **YÜKSEK VOLTAJ VEYA AC SİNYALLERİN ÖLÇÜMÜ:**
    *   ADC'nin güvenli giriş aralığından daha yüksek voltajlar için bir **VOLTAJ BÖLÜCÜ DEVRESİ** kullanın.
    *   AC sinyaller için uygun şartlandırma devresi kullanın (DC ofset, kenetleme diyotları).
*   **PİN DOĞRULAMASI (KRİTİK):**
    *   Çalıştırmadan önce, `M5BruceOscilloscope_v1.2.js` dosyasının başındaki `BTN_M5_SELECT_EXIT_PIN`, `BTN_NAV_UP_PIN`, `BTN_NAV_DOWN_PIN`, `CH1_PIN`, `CH2_PIN` ve `USB_DETECT_PIN` sabitlerinin **KENDİ M5Stack modelinizin Bruce Firmware tarafından tanınan GPIO'larıyla eşleştiğini DOĞRULAYIN VE DÜZELTİN**. Yanlış pin atamaları çalışmayan kontrollere veya arızaya yol açar.
*   **USB GÜÇ ETKİLEŞİMİ:**
    *   M5Stack'i USB gücüne (şarj veya veri için) bağlamak, önemli ölçüde gürültü ekleyebilir veya ADC okumalarını etkileyebilir, bu da doğru osiloskop ölçümlerini zorlaştırabilir veya imkansız hale getirebilir.
    *   Bu uygulama, potansiyel USB güç bağlantısını algılamak için bir heuristik içerir ve bir uyarı gösterecektir. **Güvenilir ölçümler için, osiloskopu başlatmadan önce M5Stack'in USB kablosunu çıkarın.**
    *   USB algılama heuristiği **MÜKEMMEL DEĞİLDİR** ve donanımınıza ve bağladığınız problara bağlı olarak yanlış pozitif veya negatif sonuçlar verebilir. Sadece buna güvenmeyin; en iyi sonuçlar için daima USB gücünü ayırın.
*   **DENEYSEL YAZILIM:**
    *   Bu yazılımı kullanmak **TAMAMEN SİZİN SORUMLULUĞUNUZDADIR**. Geliştirici (YahyaSvm) herhangi bir hasardan sorumlu değildir.

## Donanım Gereksinimleri

*   M5Stack Cihazı (örn. M5StickC, M5StickC Plus, M5Stack Core2)
*   **Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce) yüklenmiş ve çalışıyor olmalıdır.
*   **Butonlar:**
    *   **M5 Butonu (Ön/Yan):** Seç / Değeri Değiştir / Çıkış (Varsayılan: GPIO 37)
    *   **Üst Buton:** Yukarı Git / Önceki Öğe (Varsayılan: GPIO 39)
    *   **Alt Buton (varsa):** Aşağı Git / Sonraki Öğe (Varsayılan: GPIO 35)
    *   *(Bunları M5Stack modelinize ve Bruce Firmware'in GPIO eşlemesine göre doğrulayın)*
*   **Analog Girişler:** İki ADC özellikli pin (Varsayılanlar: GPIO 32, GPIO 33)
    *   *(Bunları M5Stack modelinize ve Bruce Firmware'in ADC pin kullanılabilirliğine göre doğrulayın)*

## Kurulum ve Yapılandırma

1.  **Bruce Firmware'i Yükleyin:** M5Stack cihazınıza [Bruce Firmware](https://github.com/pr3y/Bruce)'in yüklü olduğundan emin olun.
2.  **Pinleri Yapılandırın:** `M5BruceOscilloscope_v1.3.js` dosyasını açın ve dosyanın başındaki butonlarınız ve ADC girişleriniz için **GPIO pin numaralarını**, Bruce Firmware'in özel M5Stack modelinizde bunları nasıl tanıdığına göre **dikkatlice ayarlayın**. Özellikle `USB_DETECT_PIN` ve `USB_DETECT_THRESHOLD_RATIO` değerlerine dikkat edin - USB algılama güvenilir değilse kendi cihazınızda eşik değeri ile denemeler yapmanız gerekebilir.
3.  **Karakter Genişliği:** Bruce Firmware'in yazı tipiyle cihazınızın ekranında metin hizalaması bozuksa, script'teki `CHAR_WIDTH_PX` (varsayılan: `6`) değerini ayarlayın.
4.  **Script'i Yükleyin:**
    *   `M5BruceOscilloscope_v1.3.js` dosyasını M5Stack'inize aktarın (örn. Bruce destekliyorsa SD kart aracılığıyla veya Bruce'un REPL/IDE'sine yapıştırarak).
    *   Script'i Bruce Firmware ortamında çalıştırın.

## Kullanım (Buton Düzeni)

*   **M5 Butonu (Ön/Yan):**
    *   **Menüler:** Vurgulanan öğeyi seçin.
    *   **Ayarlar Menüsü:** Seçili ayarın değerini değiştirin / Ayarlardan çıkmak için "Geri" öğesini seçin.
    *   **Osiloskop/Hakkında/Güvenlik Ekranları/USB Uyarı Ekranı:** Önceki menüye çıkın. (USB Uyarı ekranında herhangi bir tuşa basmak çıkarır).
*   **Üst Buton:**
    *   **Menüler:** YUKARI gidin (önceki öğeyi seçin).
    *   **Güvenlik Bilgisi Ekranı:** Metni YUKARI kaydırın.
    *   **USB Uyarı Ekranı:** Önceki menüye çıkın (Herhangi bir tuş çıkarır).
*   **Alt Buton:**
    *   **Menüler:** AŞAĞI gidin (sonraki öğeyi seçin).
    *   **Güvenlik Bilgisi Ekranı:** Metni AŞAĞI kaydırın.
    *   **USB Uyarı Ekranı:** Önceki menüye çıkın (Herhangi bir tuş çıkarır).

## Değişiklik Kaydı (v1.3)


*   **Eklendi:** Yeni osiloskop kımına pause butonu eklendi

## Bilinen Sorunlar / Sınırlamalar

*   Bu script, Bruce Firmware tarafından sağlanan JavaScript ortamı için özel olarak hazırlanmıştır. Diğer M5Stack firmware'leriyle (örn. UIFlow, Arduino, standart Espruino) uyumluluk garanti edilmez.
*   Çok yüksek frekanslı sinyaller için performans, Bruce içindeki JavaScript yürütme hızıyla sınırlı olabilir.
*   USB/Şarj algılama, ADC pin durumuna dayanan bir heuristiktir ve tüm M5Stack modellerinde veya senaryolarda %100 güvenilir olmayabilir. Cihazınız için gerektiğinde `USB_DETECT_THRESHOLD_RATIO` ile denemeler yapın.
*   `digitalRead()` davranışı ve `pinMode()` seçenekleri Bruce'ta diğer ortamlara göre biraz farklılık gösterebilir; mevcut uygulama standart davranışı varsayar.

## Gelecek Fikirleri

*   AC/DC Kuplajı (donanım arayüzü ve yazılım mantığı gerektirir).
*   Daha gelişmiş tetikleme modları (Normal, Otomatik, Tek).
*   Ayarlanabilir tetikleme seviyesi.
*   Ayarları kaydetme/yükleme (Bruce bir dosya sistemi API'si sağlıyorsa).

## Katkıda Bulunma

Katkılarınızı, sorun bildirimlerinizi ve özellik isteklerinizi bekliyoruz!

## Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.
