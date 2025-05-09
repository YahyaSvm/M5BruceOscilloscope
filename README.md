# M5BruceOscilloscope - v1.2

**Author:** YahyaSvm , takagi-1
**Target Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce)
**Version:** 1.2 (Release Date: 2025-9-5)
**Languages:** [English](./README.md) | [Türkçe](./README_tr.md)

A JavaScript-based oscilloscope application specifically designed for M5Stack devices running **Bruce Firmware**. This project aims to provide a functional oscilloscope experience directly on the M5Stack using the capabilities of the Bruce environment.


![M5BruceOscilloscope Screenshot](./assets/screenshot_scope.png)


## Features (v1.2)

*   Targets **Bruce Firmware** by pr3y.
*   Dual Channel Display (CH2 can be disabled).
*   Adjustable Time/Pixel (Horizontal sweep speed).
*   Adjustable Volts/Div (Vertical sensitivity).
*   Vpp (Peak-to-Peak) Measurement for the selected channel.
*   Frequency Measurement (Basic) for the selected channel.
*   Selectable Measurement Channel (CH1 or CH2).
*   Configurable Trigger Edge (Rising or Falling).
*   **Improved:** Scrolling Menu-Driven Interface (Reduced flickering).
*   Dedicated Safety Information Screen with scrolling text.
*   Configurable Button Layout (defaults set for M5StickC-like devices).
*   **NEW:** Heuristic USB/Charging Detection & Warning. Attempts to detect USB power connection and warns the user, preventing entry to the oscilloscope screen while likely connected (as USB power can cause noisy readings). *(See warnings below)*

## !!! IMPORTANT SAFETY WARNINGS !!!

*   **RISK OF DAMAGE TO YOUR M5STACK:**
    *   **VOLTAGE LIMITS:** The ADC pins on M5Stack devices have a **MAXIMUM INPUT VOLTAGE (typically 0V to 3.3V)**. Refer to your specific M5Stack model and Bruce Firmware documentation for precise ADC limits.
    *   **NEVER CONNECT VOLTAGES EXCEEDING THESE LIMITS DIRECTLY.** Doing so will very likely cause **PERMANENT DAMAGE**.
*   **MEASURING HIGHER VOLTAGES OR AC SIGNALS:**
    *   Use a **VOLTAGE DIVIDER CIRCUIT** for voltages greater than the ADC's safe input range.
    *   For AC signals, use appropriate conditioning circuitry (DC offset, clamping diodes).
*   **PIN VERIFICATION (CRITICAL):**
    *   Before running, **VERIFY AND CORRECT** the `BTN_M5_SELECT_EXIT_PIN`, `BTN_NAV_UP_PIN`, `BTN_NAV_DOWN_PIN`, `CH1_PIN`, `CH2_PIN`, and the `USB_DETECT_PIN` constants at the top of the `M5BruceOscilloscope_v1.2.js` file to match **YOUR SPECIFIC M5Stack model's GPIOs as recognized by Bruce Firmware**. Incorrect pin assignments will lead to unresponsive controls or malfunction.
*   **USB POWER INTERFERENCE:**
    *   Connecting the M5Stack to USB power (for charging or data) can introduce significant noise or affect ADC readings, making accurate oscilloscope measurements difficult or impossible.
    *   This application includes a heuristic to detect potential USB power connection and will display a warning. **For reliable measurements, disconnect the USB cable from the M5Stack before starting the oscilloscope.**
    *   The USB detection heuristic is **NOT PERFECT** and might give false positives or negatives depending on your hardware and the probes connected. Do not solely rely on it; always disconnect USB power for best results.
*   **EXPERIMENTAL SOFTWARE:**
    *   Use this software at **YOUR OWN RISK**. The developer (YahyaSvm) is not responsible for any damage.

## Hardware Requirements

*   M5Stack Device (e.g., M5StickC, M5StickC Plus, M5Stack Core2)
*   **Firmware:** [Bruce Firmware by pr3y](https://github.com/pr3y/Bruce) must be installed and running.
*   **Buttons:**
    *   **M5 Button (Front/Side):** Select / Change Value / Exit (Default: GPIO 37)
    *   **Top Button:** Navigate Up / Previous Item (Default: GPIO 39)
    *   **Bottom Button (if available):** Navigate Down / Next Item (Default: GPIO 35)
    *   *(Verify these against your M5Stack model and Bruce Firmware's GPIO mapping)*
*   **Analog Inputs:** Two ADC-capable pins (Defaults: GPIO 32, GPIO 33)
    *   *(Verify these against your M5Stack model and Bruce Firmware's ADC pin availability)*

## Setup and Configuration

1.  **Install Bruce Firmware:** Ensure [Bruce Firmware](https://github.com/pr3y/Bruce) is installed on your M5Stack device.
2.  **Configure Pins:** Open `M5BruceOscilloscope_v1.2.js` and **carefully set the GPIO pin numbers** for your buttons and ADC inputs at the top of the file, according to how Bruce Firmware recognizes them on your specific M5Stack model. Pay particular attention to `USB_DETECT_PIN` and the `USB_DETECT_THRESHOLD_RATIO` - you might need to experiment with the threshold value on your specific device if the USB detection is unreliable.
3.  **Character Width:** Adjust `CHAR_WIDTH_PX` (default: `6`) in the script if text alignment is off on your device's screen with Bruce Firmware's font.
4.  **Load Script:**
    *   Transfer the `M5BruceOscilloscope_v1.2.js` file to your M5Stack (e.g., via SD card if Bruce supports it, or by pasting into Bruce's REPL/IDE).
    *   Execute the script within the Bruce Firmware environment.

## Usage (Button Layout)

*   **M5 Button (Front/Side):**
    *   **Menus:** Select highlighted item.
    *   **Settings Menu:** Change value of selected setting / Select "Back" item to exit Settings.
    *   **Oscilloscope/About/Safety Screens/USB Warning Screen:** Exit to previous menu. (Any button press exits the USB Warning).
*   **Top Button:**
    *   **Menus:** Navigate UP (select previous item).
    *   **Safety Info Screen:** Scroll text UP.
    *   **USB Warning Screen:** Exit to previous menu (Any button exits).
*   **Bottom Button:**
    *   **Menus:** Navigate DOWN (select next item).
    *   **Safety Info Screen:** Scroll text DOWN.
    *   **USB Warning Screen:** Exit to previous menu (Any button exits).

## Changelog (v1.2)

*   **Removed:** Unreliable USB voltage reading and display feature.
*   **Added:** Heuristic USB/Charging detection mechanism with a warning screen that blocks entry to the oscilloscope if detected.
*   **Improved:** Menu scrolling implementation to reduce flickering.
*   **Refined:** Logic for Vpp measurement and triggering when one or both channels are off.

## Known Issues / Limitations

*   This script is tailored for the JavaScript environment provided by Bruce Firmware. Compatibility with other M5Stack firmwares (e.g., UIFlow, Arduino, standard Espruino) is not guaranteed.
*   Performance for very high-frequency signals might be limited by the JavaScript execution speed within Bruce.
*   The USB/Charging detection is a heuristic based on ADC pin state and may not be 100% reliable across all M5Stack models or scenarios. Experiment with `USB_DETECT_THRESHOLD_RATIO` if needed for your device.
*   The `digitalRead()` behavior and `pinMode()` options might differ slightly in Bruce compared to other environments; the current implementation assumes standard behavior.

## Future Ideas

*   AC/DC Coupling (would require hardware interface and software logic).
*   More advanced trigger modes (Normal, Auto, Single).
*   Adjustable trigger level.
*   Saving/Loading settings (if Bruce provides a filesystem API).

## Contributing

Contributions, issues, and feature requests are welcome!

## License

This project is licensed under the [MIT License](./LICENSE).
