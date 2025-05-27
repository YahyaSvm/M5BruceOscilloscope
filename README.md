# M5BruceOscilloscope - v1.5

**Author:** YahyaSvm, takagi-1
**Target Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce)
**Version:** 1.5 (Release Date: 2025-05-27)
**Languages:** [English](./README.md) | [Türkçe](./README_tr.md)

A JavaScript-based oscilloscope application specifically designed for M5Stack devices (like M5Stack C Plus 2) running **Bruce Firmware**. This project aims to provide a functional oscilloscope experience directly on the M5Stack using the capabilities of the Bruce environment and its standardized button input functions.

![M5BruceOscilloscope Screenshot](./assets/screenshot_scope.png) 

## Features (v1.5)

*   Targets **Bruce Firmware** by pr3y.
*   Utilizes Bruce OS's native `getPrevPress()`, `getSelPress()`, `getNextPress()` for button inputs, enhancing portability across supported devices.
*   Dual Channel Display (CH2 can be disabled).
*   Adjustable Time/Pixel (Horizontal sweep speed).
*   Adjustable Volts/Div (Vertical sensitivity).
*   Vpp (Peak-to-Peak) Measurement for the selected channel.
*   Frequency Measurement (Basic) for the selected channel.
*   Selectable Measurement Channel (CH1 or CH2).
*   Configurable Trigger Edge (Rising or Falling).
*   Menu-Driven Interface with Scrolling for easy navigation.
*   Dedicated Safety Information Screen with scrolling text.
*   Battery level and charging status display (heuristic-based).
*   USB power detection advisory.

## !!! IMPORTANT SAFETY WARNINGS !!!

*   **RISK OF DAMAGE TO YOUR M5STACK:**
    *   **VOLTAGE LIMITS:** The ADC pins on M5Stack devices have a **MAXIMUM INPUT VOLTAGE (typically 0V to 3.3V)**. Refer to your specific M5Stack model and Bruce Firmware documentation for precise ADC limits.
    *   **NEVER CONNECT VOLTAGES EXCEEDING THESE LIMITS DIRECTLY.** Doing so will very likely cause **PERMANENT DAMAGE**.
*   **MEASURING HIGHER VOLTAGES OR AC SIGNALS:**
    *   Use a **VOLTAGE DIVIDER CIRCUIT** for voltages greater than the ADC's safe input range.
    *   For AC signals, use appropriate conditioning circuitry (e.g., DC offset, clamping diodes).
*   **ADC PIN VERIFICATION (CRITICAL):**
    *   Before running, **VERIFY AND CORRECT** the `CH1_PIN` and `CH2_PIN` constants at the top of the `M5BruceOscilloscope_v1.5.js` file to match **YOUR SPECIFIC M5Stack model's ADC-capable GPIOs as recognized by Bruce Firmware**.
*   **EXPERIMENTAL SOFTWARE:**
    *   Use this software at **YOUR OWN RISK**. The developers (YahyaSvm, takagi-1) are not responsible for any damage.

## Hardware Requirements

*   M5Stack Device (e.g., M5StickC, M5StickC Plus, M5Stack C Plus 2, T-Display-S3)
*   **Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce) must be installed and running.
*   **Buttons:** The script now uses Bruce OS's abstracted button functions:
    *   `getSelPress()`: Corresponds to the **M5 Button / Main Select Button** (e.g., GPIO 37 on M5Stack C Plus 2).
    *   `getPrevPress()`: Corresponds to the **"Previous" / Up Button** (e.g., Power Button / GPIO 35 on M5Stack C Plus 2).
    *   `getNextPress()`: Corresponds to the **"Next" / Down Button** (e.g., Button A / GPIO 39 on M5Stack C Plus 2).
    *   *(The exact physical button mapping is determined by your device's `interface.cpp` in Bruce OS.)*
*   **Analog Inputs:** Two ADC-capable pins (e.g., `CH1_PIN = 36`, `CH2_PIN = 25` are defaults in script).
    *   *(Verify and adjust these in the script based on your M5Stack model and Bruce Firmware's ADC pin availability.)*

## Setup and Configuration

1.  **Install Bruce Firmware:** Ensure [Bruce Firmware](https://github.com/pr3y/Bruce) is installed on your M5Stack device.
2.  **Configure ADC Pins:** Open `M5BruceOscilloscope_v1.5.js` and **carefully set the GPIO pin numbers** for `CH1_PIN` and `CH2_PIN` at the top of the file, according to how Bruce Firmware recognizes ADC-capable pins on your specific M5Stack model. Button pin configuration is no longer needed in the script.
3.  **Character Width (Optional):** Adjust `CHAR_WIDTH_PX` (default: `6`) in the script if text alignment is off on your device's screen with Bruce Firmware's font.
4.  **Load Script:**
    *   Transfer the `M5BruceOscilloscope_v1.5.js` file to your M5Stack (e.g., via SD card if Bruce supports it, or by pasting into Bruce's REPL/IDE).
    *   Execute the script within the Bruce Firmware environment.

## Usage (Button Functions with Bruce OS v1.5+)

The script now utilizes Bruce OS's standard navigation functions (`getPrevPress()`, `getSelPress()`, `getNextPress()`). The physical buttons corresponding to these functions depend on your device's specific `interface.cpp` file within Bruce OS. For an M5Stack C Plus 2, this typically means:

*   **`getSelPress()` (e.g., M5 Button / Side Button - GPIO 37):**
    *   **Menus:** Select highlighted item.
    *   **Settings Menu:** Change value of selected setting / Select "Back" item to exit Settings.
    *   **Oscilloscope/About/Safety Screens:** Exit to previous menu.
*   **`getPrevPress()` (e.g., Power Button - GPIO 35):**
    *   **Menus:** Navigate UP (select previous item).
    *   **Safety Info Screen:** Scroll text UP.
    *   **Oscilloscope Screen:** Pause / Resume waveform display.
*   **`getNextPress()` (e.g., Button A under screen - GPIO 39):**
    *   **Menus:** Navigate DOWN (select next item).
    *   **Safety Info Screen:** Scroll text DOWN.

## Changelog (v1.5)

*   **Major Change:** Refactored button handling to use Bruce OS native functions: `getPrevPress()`, `getSelPress()`, `getNextPress()`. This resolves button sticking issues and improves portability across devices supported by Bruce OS.
*   Removed direct `digitalRead()` and `pinMode()` for button pins from the script.
*   Updated footer hints to reflect typical M5Stack C Plus 2 button functions (e.g., "Up (Pwr)", "Select", "Down (A)").
*   Adjusted main loop delays in UI screens for better responsiveness with the new button system.
*   Version updated to v1.5.

*(For v1.0 changes, see previous README versions.)*

## Known Issues / Limitations

*   This script is tailored for the JavaScript environment provided by Bruce Firmware. Compatibility with other M5Stack firmwares (e.g., UIFlow, Arduino, standard Espruino) is not guaranteed.
*   Performance for very high-frequency signals might be limited by the JavaScript execution speed within Bruce.
*   The behavior of the "Power Button" (`getPrevPress()` on M5Stack C Plus 2) for navigation should be tested, as it might have overriding system-level functions.

## Future Ideas

*   AC/DC Coupling (would require hardware interface and software logic).
*   More advanced trigger modes (Normal, Auto, Single).
*   Saving/Loading settings (if Bruce provides a filesystem API).

## Contributing

Contributions, issues, and feature requests are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](./LICENSE).
