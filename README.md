# BIOSHsim

BIOSHsim is a web-based emulator designed to replicate the look, feel, and functionality of classic Award BIOS setups from the 1990s and early 2000s. It provides an authentic experience of navigating BIOS settings as if you were booting up an old PC.

## Features

*   **Authentic Boot Sequence:** Includes a loading screen, followed by a simulated startup/memtest screen (`boot.html`), and finally the main BIOS setup utility (`bios.html`).
*   **Realistic BIOS Interface:** The main setup utility (`bios.html`) features a classic two-column menu layout and detailed submenus with an "Item Help" section, mimicking Award BIOS.
*   **Interactive Settings:** Navigate menus using keyboard keys (↑↓ Enter +/- F10 ESC) or mouse clicks. Most settings within submenus can be adjusted to predefined values.
*   **BIOS Functions:** Includes options to save changes and exit, exit without saving, load fail-safe defaults, load optimized defaults, and set supervisor/user passwords (though password storage is simulated).
*   **Visual Fidelity:** Uses a dark blue background, yellow text, red highlighting, and a monospace font (`Courier New`) for a classic look. Includes a logo placeholder on the loading screen (`index.html`) and boot screen (`boot.html`).
*   **File Structure:** Organized into separate HTML files (`index.html`, `boot.html`, `bios.html`), a shared CSS file (`styles.css`), and a shared JavaScript file (`script.js`).

## How to Use

1.  **Prerequisites:** You need a modern web browser (e.g., Chrome, Firefox, Edge).
2.  **Setup:**
    *   Save all the project files (`index.html`, `boot.html`, `bios.html`, `styles.css`, `script.js`) into a single folder on your computer.
3.  **Running:**
    *   Open `index.html` in your web browser.
    *   The loading screen will appear for 5 seconds.
    *   It will then transition to the boot screen (`boot.html`), simulating a PC startup.
    *   Press the `DEL` key (on your keyboard) when prompted on the boot screen to enter the BIOS setup utility (`bios.html`).
    *   Use the keyboard or mouse to navigate and change settings within the BIOS.

## Controls

*   **Navigation:** `↑` (Up Arrow), `↓` (Down Arrow), `Enter`
*   **Value Change:** `+` (Plus), `-` (Minus), or click on the value itself in a submenu.
*   **Save & Exit:** `F10`
*   **General Help:** `F1`
*   **Exit Submenu/Cancel:** `Esc`
*   **Enter BIOS from Boot Screen:** `Del`

## File Structure

*   `index.html`: The initial loading screen with a progress bar.
*   `boot.html`: The simulated PC startup/boot screen.
*   `bios.html`: The main BIOS setup utility interface.
*   `styles.css`: Contains all the CSS styling for the application.
*   `script.js`: Contains all the JavaScript logic for navigation, settings, and UI updates.

## Acknowledgements

BIOSHsim is inspired by Award BIOS, a product of Award Software International, Inc.

## License

This project is licensed under the Apache 2.0 - see the [LICENSE](LICENSE) file for details.
