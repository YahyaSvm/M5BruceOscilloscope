# M5BruceOsiloskop - v1.5

**Geliştirici:** YahyaSvm, takagi-1
**Hedef Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce)
**Sürüm:** 1.5 (Yayın Tarihi: 2025-05-27)
**Diller:** [English](./README.md) | [Türkçe](./README_tr.md)

M5Stack cihazlarında (M5Stack C Plus 2 gibi) **Bruce Firmware** çalıştıranlar için özel olarak tasarlanmış JavaScript tabanlı bir osiloskop uygulamasıdır. Bu proje, Bruce ortamının yeteneklerini ve standartlaştırılmış buton giriş fonksiyonlarını kullanarak M5Stack üzerinde doğrudan işlevsel bir osiloskop deneyimi sunmayı amaçlamaktadır.

![M5BruceOsiloskop Ekran Görüntüsü](./assets/screenshot_scope.png)

## Özellikler (v1.5)

*   **Bruce Firmware** (pr3y tarafından) hedeflenmiştir.
*   Buton girişleri için Bruce OS'un yerel `getPrevPress()`, `getSelPress()`, `getNextPress()` fonksiyonlarını kullanır, bu da desteklenen cihazlar arasında taşınabilirliği artırır.
*   Çift Kanal Görüntüleme (CH2 devre dışı bırakılabilir).
*   Ayarlanabilir Zaman/Piksel (Yatay tarama hızı).
*   Ayarlanabilir Volt/Kademe (Dikey hassasiyet).
*   Seçili kanal için Vpp (Tepeden Tepeye) Ölçümü.
*   Seçili kanal için Frekans Ölçümü (Temel).
*   Seçilebilir Ölçüm Kanalı (CH1 veya CH2).
*   Yapılandırılabilir Tetikleme Kenarı (Yükselen veya Düşen).
*   Kolay gezinme için Kaydırmalı Menü Tabanlı Arayüz.
*   Kaydırılabilir metin içeren Özel Güvenlik Bilgileri Ekranı.
*   Pil seviyesi ve şarj durumu gösterimi (sezgisel tabanlı).
*   USB güç tespiti uyarısı.

## !!! ÖNEMLİ GÜVENLİK UYARILARI !!!

*   **M5STACK'İNİZİN HASAR GÖRME RİSKİ:**
    *   **VOLTAJ LİMİTLERİ:** M5Stack cihazlarındaki ADC pinlerinin **MAKSİMUM GİRİŞ VOLTAJI (genellikle 0V ila 3.3V)** vardır. Kesin ADC limitleri için özel M5Stack modelinize ve Bruce Firmware belgelerine bakın.
    *   **BU LİMİTLERİ AŞAN VOLTAJLARI ASLA DOĞRUDAN BAĞLAMAYIN.** Aksi takdirde **KALICI HASARA** neden olursunuz.
*   **YÜKSEK VOLTAJ VEYA AC SİNYALLERİN ÖLÇÜMÜ:**
    *   ADC'nin güvenli giriş aralığından daha yüksek voltajlar için bir **VOLTAJ BÖLÜCÜ DEVRESİ** kullanın.
    *   AC sinyaller için uygun şartlandırma devresi kullanın (örn. DC ofset, kenetleme diyotları).
*   **ADC PİN DOĞRULAMASI (KRİTİK):**
    *   Çalıştırmadan önce, `M5BruceOscilloscope_v1.5.js` dosyasının başındaki `CH1_PIN` ve `CH2_PIN` sabitlerinin **KENDİ M5Stack modelinizin Bruce Firmware tarafından tanınan ADC özellikli GPIO'larıyla eşleştiğini DOĞRULAYIN VE DÜZELTİN**.
*   **DENEYSEL YAZILIM:**
    *   Bu yazılımı kullanmak **TAMAMEN SİZİN SORUMLULUĞUNUZDADIR**. Geliştiriciler (YahyaSvm, takagi-1) herhangi bir hasardan sorumlu değildir.

## Donanım Gereksinimleri

*   M5Stack Cihazı (örn. M5StickC, M5StickC Plus, M5Stack C Plus 2, T-Display-S3)
*   **Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce) yüklenmiş ve çalışıyor olmalıdır.
*   **Butonlar:** Script artık Bruce OS'un soyutlanmış buton fonksiyonlarını kullanmaktadır:
    *   `getSelPress()`: **M5 Butonu / Ana Seçim Butonu**'na karşılık gelir (örn. M5Stack C Plus 2'de GPIO 37).
    *   `getPrevPress()`: **"Önceki" / Yukarı Butonu**'na karşılık gelir (örn. M5Stack C Plus 2'de Güç Butonu / GPIO 35).
    *   `getNextPress()`: **"Sonraki" / Aşağı Butonu**'na karşılık gelir (örn. M5Stack C Plus 2'de Buton A / GPIO 39).
    *   *(Tam fiziksel buton eşleşmesi, cihazınızın Bruce OS içindeki `interface.cpp` dosyası tarafından belirlenir.)*
*   **Analog Girişler:** İki ADC özellikli pin (örn. script'teki varsayılanlar: `CH1_PIN = 36`, `CH2_PIN = 25`).
    *   *(Bunları M5Stack modelinize ve Bruce Firmware'in ADC pin kullanılabilirliğine göre script içinde doğrulayın ve ayarlayın.)*

## Kurulum ve Yapılandırma

1.  **Bruce Firmware'i Yükleyin:** M5Stack cihazınıza [Bruce Firmware](https://github.com/pr3y/Bruce)'in yüklü olduğundan emin olun.
2.  **ADC Pinlerini Yapılandırın:** `M5BruceOscilloscope_v1.5.js` dosyasını açın ve dosyanın başındaki `CH1_PIN` ve `CH2_PIN` için **GPIO pin numaralarını**, Bruce Firmware'in özel M5Stack modelinizde ADC özellikli pinleri nasıl tanıdığına göre **dikkatlice ayarlayın**. Script içinde buton pin yapılandırmasına artık gerek yoktur.
3.  **Karakter Genişliği (İsteğe Bağlı):** Bruce Firmware'in yazı tipiyle cihazınızın ekranında metin hizalaması bozuksa, script'teki `CHAR_WIDTH_PX` (varsayılan: `6`) değerini ayarlayın.
4.  **Script'i Yükleyin:**
    *   `M5BruceOscilloscope_v1.5.js` dosyasını M5Stack'inize aktarın (örn. Bruce destekliyorsa SD kart aracılığıyla veya Bruce'un REPL/IDE'sine yapıştırarak).
    *   Script'i Bruce Firmware ortamında çalıştırın.

## Kullanım (Bruce OS v1.5+ ile Buton Fonksiyonları)

Script artık Bruce OS'un standart navigasyon fonksiyonlarını (`getPrevPress()`, `getSelPress()`, `getNextPress()`) kullanmaktadır. Bu fonksiyonlara karşılık gelen fiziksel butonlar, cihazınızın Bruce OS içindeki özel `interface.cpp` dosyasına bağlıdır. Bir M5Stack C Plus 2 için bu genellikle şu anlama gelir:

*   **`getSelPress()` (örn. M5 Butonu / Yan Buton - GPIO 37):**
    *   **Menüler:** Vurgulanan öğeyi seçin.
    *   **Ayarlar Menüsü:** Seçili ayarın değerini değiştirin / Ayarlardan çıkmak için "Geri" öğesini seçin.
    *   **Osiloskop/Hakkında/Güvenlik Ekranları:** Önceki menüye çıkın.
*   **`getPrevPress()` (örn. Güç Butonu - GPIO 35):**
    *   **Menüler:** YUKARI gidin (önceki öğeyi seçin).
    *   **Güvenlik Bilgisi Ekranı:** Metni YUKARI kaydırın.
    *   **Osiloskop Ekranı:** Dalga formunu Duraklat / Devam Ettir.
*   **`getNextPress()` (örn. Ekran Altındaki Buton A - GPIO 39):**
    *   **Menüler:** AŞAĞI gidin (sonraki öğeyi seçin).
    *   **Güvenlik Bilgisi Ekranı:** Metni AŞAĞI kaydırın.

## Değişiklik Kaydı (v1.5)

*   **Önemli Değişiklik:** Buton yönetimi, Bruce OS yerel fonksiyonları olan `getPrevPress()`, `getSelPress()`, `getNextPress()` kullanılacak şekilde yeniden düzenlendi. Bu, buton takılma sorunlarını çözer ve Bruce OS tarafından desteklenen cihazlar arasında taşınabilirliği artırır.
*   Buton pinleri için doğrudan `digitalRead()` ve `pinMode()` kullanımı script'ten kaldırıldı.
*   Alt bilgi ipuçları, tipik M5Stack C Plus 2 buton fonksiyonlarını yansıtacak şekilde güncellendi (örn. "Yukarı (Pwr)", "Seç", "Aşağı (A)").
*   Kullanıcı arayüzü ekranlarındaki ana döngü gecikmeleri, yeni buton sistemiyle daha iyi yanıt verecek şekilde ayarlandı.
*   Sürüm v1.5'e güncellendi.

*(v1.0 değişiklikleri için önceki README sürümlerine bakın.)*

## Bilinen Sorunlar / Sınırlamalar

*   Bu script, Bruce Firmware tarafından sağlanan JavaScript ortamı için özel olarak hazırlanmıştır. Diğer M5Stack firmware'leriyle (örn. UIFlow, Arduino, standart Espruino) uyumluluk garanti edilmez.
*   Çok yüksek frekanslı sinyaller için performans, Bruce içindeki JavaScript yürütme hızıyla sınırlı olabilir.
*   "Güç Butonu"nun (`getPrevPress()` M5Stack C Plus 2'de) navigasyon için davranışı test edilmelidir, çünkü sistem düzeyinde geçersiz kılan işlevleri olabilir.

## Gelecek Fikirleri

*   AC/DC Kuplajı (donanım arayüzü ve yazılım mantığı gerektirir).
*   Daha gelişmiş tetikleme modları (Normal, Otomatik, Tek).
*   Ayarları kaydetme/yükleme (Bruce bir dosya sistemi API'si sağlıyorsa).

## Katkıda Bulunma

Katkılarınızı, sorun bildirimlerinizi ve özellik isteklerinizi bekliyoruz! Lütfen bir "issue" açın veya "pull request" gönderin.

## Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.
