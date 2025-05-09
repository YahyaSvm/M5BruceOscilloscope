# M5BruceOsiloskop - v1.0

**Geliştirici:** YahyaSvm
**Hedef Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce)
**Sürüm:** 1.0 (Yayın Tarihi: YYYY-AA-GG) <!-- Kendi yayın tarihinizi yazın -->
**Diller:** [English](./README.md) | [Türkçe](./README_tr.md)

M5Stack cihazlarında **Bruce Firmware** çalıştıranlar için özel olarak tasarlanmış JavaScript tabanlı bir osiloskop uygulamasıdır. Bu proje, Bruce ortamının yeteneklerini kullanarak M5Stack üzerinde doğrudan işlevsel bir osiloskop deneyimi sunmayı amaçlamaktadır.

<!-- Opsiyonel: Ekran görüntünüz varsa ekleyin -->
<!-- ![M5BruceOsiloskop Ekran Görüntüsü](./assets/screenshot_scope.png) -->

## Özellikler (v1.0)

*   **Bruce Firmware** (pr3y tarafından) hedeflenmiştir.
*   Çift Kanal Görüntüleme (CH2 devre dışı bırakılabilir).
*   Ayarlanabilir Zaman/Piksel (Yatay tarama hızı).
*   Ayarlanabilir Volt/Kademe (Dikey hassasiyet).
*   Seçili kanal için Vpp (Tepeden Tepeye) Ölçümü.
*   Seçili kanal için Frekans Ölçümü (Temel).
*   Seçilebilir Ölçüm Kanalı (CH1 veya CH2).
*   Yapılandırılabilir Tetikleme Kenarı (Yükselen veya Düşen).
*   Kolay gezinme için Kaydırmalı Menü Tabanlı Arayüz.
*   Kaydırılabilir metin içeren Özel Güvenlik Bilgileri Ekranı.
*   Yapılandırılabilir Buton Düzeni (M5StickC benzeri cihazlar için varsayılanlar ayarlanmıştır).

## !!! ÖNEMLİ GÜVENLİK UYARILARI !!!

*   **M5STACK'İNİZİN HASAR GÖRME RİSKİ:**
    *   **VOLTAJ LİMİTLERİ:** M5Stack cihazlarındaki ADC pinlerinin **MAKSİMUM GİRİŞ VOLTAJI (genellikle 0V ila 3.3V)** vardır. Kesin ADC limitleri için özel M5Stack modelinize ve Bruce Firmware belgelerine bakın.
    *   **BU LİMİTLERİ AŞAN VOLTAJLARI ASLA DOĞRUDAN BAĞLAMAYIN.** Aksi takdirde **KALICI HASARA** neden olursunuz.
*   **YÜKSEK VOLTAJ VEYA AC SİNYALLERİN ÖLÇÜMÜ:**
    *   ADC'nin güvenli giriş aralığından daha yüksek voltajlar için bir **VOLTAJ BÖLÜCÜ DEVRESİ** kullanın.
    *   AC sinyaller için uygun şartlandırma devresi kullanın (DC ofset, kenetleme diyotları).
*   **PİN DOĞRULAMASI (KRİTİK):**
    *   Çalıştırmadan önce, `M5BruceOscilloscope_v1.0.js` dosyasının başındaki `BTN_M5_SELECT_EXIT_PIN`, `BTN_NAV_UP_PIN`, `BTN_NAV_DOWN_PIN`, `CH1_PIN` ve `CH2_PIN` sabitlerinin **KENDİ M5Stack modelinizin Bruce Firmware tarafından tanınan GPIO'larıyla eşleştiğini DOĞRULAYIN VE DÜZELTİN**. Yanlış pin atamaları çalışmayan kontrollere veya arızaya yol açar.
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
2.  **Pinleri Yapılandırın:** `M5BruceOscilloscope_v1.0.js` dosyasını açın ve dosyanın başındaki butonlarınız ve ADC girişleriniz için **GPIO pin numaralarını**, Bruce Firmware'in özel M5Stack modelinizde bunları nasıl tanıdığına göre **dikkatlice ayarlayın**.
3.  **Karakter Genişliği:** Bruce Firmware'in yazı tipiyle cihazınızın ekranında metin hizalaması bozuksa, script'teki `CHAR_WIDTH_PX` (varsayılan: `6`) değerini ayarlayın.
4.  **Script'i Yükleyin:**
    *   `M5BruceOscilloscope_v1.0.js` dosyasını M5Stack'inize aktarın (örn. Bruce destekliyorsa SD kart aracılığıyla veya Bruce'un REPL/IDE'sine yapıştırarak).
    *   Script'i Bruce Firmware ortamında çalıştırın.

## Kullanım (Buton Düzeni v1.0)

*   **M5 Butonu (Ön/Yan):**
    *   **Menüler:** Vurgulanan öğeyi seçin.
    *   **Ayarlar Menüsü:** Seçili ayarın değerini değiştirin / Ayarlardan çıkmak için "Geri" öğesini seçin.
    *   **Osiloskop/Hakkında/Güvenlik Ekranları:** Önceki menüye çıkın.
*   **Üst Buton:**
    *   **Menüler:** YUKARI gidin (önceki öğeyi seçin).
    *   **Güvenlik Bilgisi Ekranı:** Metni YUKARI kaydırın.
*   **Alt Buton:**
    *   **Menüler:** AŞAĞI gidin (sonraki öğeyi seçin).
    *   **Güvenlik Bilgisi Ekranı:** Metni AŞAĞI kaydırın.

## Değişiklik Kaydı (v1.0)

*   Bruce Firmware için ilk genel sürüm.
*   Menüler ve güvenlik bilgileri için kaydırma özelliği eklendi.
*   Sezgisel gezinme için buton kontrol şeması revize edildi.
*   Kapsamlı güvenlik uyarıları eklendi.
*   Temel osiloskop işlevleri: çift kanal (opsiyonel), Vpp, Frekans, Zaman/Kademe, Volt/Kademe.

## Bilinen Sorunlar / Sınırlamalar

*   Bu script, Bruce Firmware tarafından sağlanan JavaScript ortamı için özel olarak hazırlanmıştır. Diğer M5Stack firmware'leriyle (örn. UIFlow, Arduino, standart Espruino) uyumluluk garanti edilmez.
*   Çok yüksek frekanslı sinyaller için performans, Bruce içindeki JavaScript yürütme hızıyla sınırlı olabilir.
*   `digitalRead()` davranışı ve `pinMode()` seçenekleri Bruce'ta diğer ortamlara göre biraz farklılık gösterebilir; mevcut uygulama standart davranışı varsayar.

## Gelecek Fikirleri

*   AC/DC Kuplajı (donanım arayüzü ve yazılım mantığı gerektirir).
*   Daha gelişmiş tetikleme modları (Normal, Otomatik, Tek).
*   Ayarları kaydetme/yükleme (Bruce bir dosya sistemi API'si sağlıyorsa).

## Katkıda Bulunma

Katkılarınızı, sorun bildirimlerinizi ve özellik isteklerinizi bekliyoruz!

## Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.