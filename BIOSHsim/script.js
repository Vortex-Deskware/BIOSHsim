document.addEventListener('DOMContentLoaded', function() {
    const biosContainer = document.getElementById('biosContainer');
    const mainContent = document.getElementById('mainContent');
    const statusBar = document.getElementById('statusBar');
    let currentMenu = 'main'; // Track the current menu state ('main', 'standard', etc.)
    let currentSelectedIndex = 0; // Track the selected item index within the current menu
    let currentMenuItems = []; // Store the current list of menu items
    let settings = {};
    let passwordInputActive = false; // Track if password input is active
    let passwordInputField = null; // Store reference to active password input
    let defaultsType = null; // Track which defaults menu is active
    let confirmAction = null; // Store the action to confirm ('save', 'exit', 'defaults', 'optimized')
    let selectedItemHelp = ""; // Store the help text for the currently selected setting

    // Initialize settings with default values or load from localStorage if available
    initializeSettings();

    // Initialize status bar
    updateStatusBar();

    // Focus the container for keyboard events
    biosContainer.focus();

    // Initial load of the main menu
    loadMainMenu();

    // Handle keyboard navigation
    biosContainer.addEventListener('keydown', function(e) {
        // Prevent default behavior for BIOS-like keys if not in password input
        if (!passwordInputActive && [38, 40, 13, 27, 112, 121, 187, 189, 89, 78].includes(e.keyCode)) {
            e.preventDefault();
        }

        // If password input is active, only ESC and ENTER are handled globally
        if (passwordInputActive) {
            if (e.keyCode === 27) { // ESC
                passwordInputActive = false;
                passwordInputField = null;
                loadMenu(currentMenu); // Reload current menu to clear input state
                return;
            } else if (e.keyCode === 13) { // ENTER
                if (currentMenu === 'passwordMenu' || currentMenu === 'userPasswordMenu') {
                    const newPassword = document.getElementById('newPasswordInput').value;
                    const confirmNewPassword = document.getElementById('confirmPasswordInput').value;
                    if (newPassword === confirmNewPassword) {
                        // In a real sim, you'd store the hash
                        if (currentMenu === 'passwordMenu') {
                            alert("Supervisor password set.");
                        } else {
                            alert("User password set.");
                        }
                        passwordInputActive = false;
                        passwordInputField = null;
                        loadMainMenu(); // Return to main menu after setting password
                    } else {
                        alert("Passwords do not match!");
                        document.getElementById('newPasswordInput').value = '';
                        document.getElementById('confirmPasswordInput').value = '';
                        document.getElementById('newPasswordInput').focus();
                    }
                }
                return; // Don't process other keys if input is active
            }
            // Let other keys be handled by the input field itself
            return;
        }

        switch(e.keyCode) {
            case 38: // Up arrow
                if (currentSelectedIndex > 0) {
                    currentMenuItems[currentSelectedIndex].classList.remove('selected');
                    currentSelectedIndex--;
                    currentMenuItems[currentSelectedIndex].classList.add('selected');
                    updateSelectedItemHelp(); // Update help text when selection changes
                }
                break;
            case 40: // Down arrow
                if (currentSelectedIndex < currentMenuItems.length - 1) {
                    currentMenuItems[currentSelectedIndex].classList.remove('selected');
                    currentSelectedIndex++;
                    currentMenuItems[currentSelectedIndex].classList.add('selected');
                    updateSelectedItemHelp(); // Update help text when selection changes
                }
                break;
            case 13: // Enter key
                if (currentMenuItems.length > 0) {
                    const selectedElement = currentMenuItems[currentSelectedIndex];
                    const action = selectedElement.getAttribute('data-action');
                    const menuId = selectedElement.getAttribute('data-menu');

                    if (action) {
                        // Handle actions like 'save', 'exit', 'defaults', 'optimized', 'password'
                        if (action === 'save' || action === 'exit' || action === 'defaults' || action === 'optimized') {
                            confirmAction = action;
                            loadConfirmationPrompt(action);
                        } else if (action === 'password' || action === 'user') {
                            loadPasswordMenu(action);
                        }
                    } else if (menuId) {
                        // Navigate to a submenu
                        loadSubMenu(menuId);
                    }
                }
                break;
            case 27: // ESC key
                if (currentMenu !== 'main') {
                    loadMainMenu(); // ESC always goes back to main menu
                } else {
                     // Handle ESC on main menu if needed (e.g., show exit prompt)
                     confirmAction = 'exit';
                     loadConfirmationPrompt('exit');
                }
                break;
            case 112: // F1
                alert("Help: Use ↑↓ to navigate, ENTER to select, ESC to exit");
                break;
            case 121: // F10
                confirmAction = 'save';
                loadConfirmationPrompt('save');
                break;
            case 187: // Plus key
            case 107: // Numpad Plus
                changeSetting(true);
                break;
            case 189: // Minus key
            case 109: // Numpad Minus
                changeSetting(false);
                break;
            case 89: // Y key (for confirmations)
            case 78: // N key (for confirmations)
                const key = e.keyCode === 89 ? 'Y' : 'N';
                if (confirmAction) {
                    if (key === 'Y') {
                        handleConfirmationYes(confirmAction);
                    } else { // key === 'N'
                        // For all confirmation prompts, 'N' returns to the previous menu
                        if (confirmAction === 'save' || confirmAction === 'exit') {
                            loadMainMenu(); // Return to main menu after canceling save/exit
                        } else if (confirmAction === 'defaults' || confirmAction === 'optimized') {
                            // Return to the menu where defaults was selected (likely main)
                            loadMainMenu();
                        }
                    }
                    confirmAction = null; // Reset action after handling
                }
                break;
        }
    });

    function initializeSettings() {
        settings = {
            'date': '05/15/2000',
            'time': '12:34:56',
            'ide-primary-master': '[Auto]',
            'ide-primary-slave': '[None]',
            'ide-secondary-master': '[Auto]',
            'ide-secondary-slave': '[None]',
            'drive-a': '[1.44M, 3.5"]',
            'drive-b': '[None]',
            'video': '[EGA/VGA]',
            'halt-on': '[All Errors]',
            'virus-warning': '[Disabled]',
            'cpu-cache': '[Enabled]',
            'external-cache': '[Enabled]',
            'quick-powertest': '[Enabled]',
            'first-boot': '[HDD-0]',
            'second-boot': '[Floppy]',
            'third-boot': '[CDROM]',
            'boot-other': '[Enabled]',
            'swap-floppy': '[Disabled]',
            'floppy-seek': '[Disabled]',
            'numlock': '[On]',
            'gate-a20': '[Fast]',
            'typematic': '[Disabled]',
            'security': '[Setup]',
            'dram-timing': '[By SPD]',
            'cas-latency': '[2.5]',
            'ras-to-cas': '[3]',
            'ras-precharge': '[3]',
            'bios-cache': '[Enabled]',
            'video-cache': '[Enabled]',
            'memory-hole': '[Disabled]',
            'agp-aperture': '[64MB]',
            'agp-mode': '[4X]',
            'agp-fast': '[Enabled]',
            'agp-graphics': '[64MB]',
            'usb-controller': '[Enabled]',
            'usb-keyboard': '[Enabled]',
            'fdc-controller': '[Enabled]',
            'serial-port1': '[3F8/IRQ4]',
            'serial-port2': '[2F8/IRQ3]',
            'parallel-port': '[378/IRQ7]',
            'parallel-mode': '[ECP+EPP]',
            'ecp-dma': '[3]',
            'epp-mode': '[EPP1.7]',
            'ide-controller': '[Both]',
            'primary-master': '[Auto]',
            'primary-slave': '[Auto]',
            'secondary-master': '[Auto]',
            'secondary-slave': '[Auto]',
            'audio-controller': '[Enabled]',
            'lan-controller': '[Enabled]',
            'acpi': '[Enabled]',
            'power-mgmt': '[User Define]',
            'pm-apm': '[Yes]',
            'video-off': '[DPMS]',
            'video-suspend': '[Yes]',
            'suspend-type': '[Stop Grant]',
            'hdd-power': '[15 Min]',
            'soft-off': '[Delay 4 Sec]',
            'ring-power': '[Enabled]',
            'mouse-power': '[Disabled]',
            'kbd-power': '[Disabled]',
            'wake-events': '[Enabled]',
            'reset-config': '[Disabled]',
            'resources': '[Auto]',
            'irq-resources': '[Available IRQs]',
            'dma-resources': '[Available DMAs]',
            'pci-irq': '[Auto]',
            'irq3': '[Legacy ISA]',
            'irq4': '[Legacy ISA]',
            'irq5': '[Legacy ISA]',
            'irq7': '[Legacy ISA]',
            'irq9': '[Legacy ISA]',
            'irq10': '[Legacy ISA]',
            'irq11': '[Legacy ISA]',
            'irq12': '[Legacy ISA]',
            'irq14': '[Legacy ISA]',
            'irq15': '[Legacy ISA]',
            'chassis': '[Disabled]',
            'temp-alarm': '[Enabled]',
            'fan-alarm': '[Enabled]',
            'voltage-alarm': '[Enabled]',
            'cpu-freq': '[800MHz]',
            'cpu-mult': '[8x]',
            'fsb-freq': '[100MHz]',
            'dram-freq': '[100MHz]',
            'agp-freq': '[66MHz]',
            'cpu-voltage': '[1.65V]',
            'agp-voltage': '[1.5V]',
            'dram-voltage': '[2.5V]',
            'cpu-vcore': '[Auto]',
            'dram-vcore': '[Auto]',
            'agp-vcore': '[Auto]',
            'overclock': '[Disabled]',
            'mem-timing': '[Auto]'
        };
    }

    function loadMainMenu() {
        currentMenu = 'main';
        const mainMenuHTML = `
            <div class="main-menu">
                <div class="main-menu-left" id="leftPanel">
                    <div class="menu-item selected" data-menu="standard">Standard CMOS Features</div>
                    <div class="menu-item" data-menu="advanced">Advanced BIOS Features</div>
                    <div class="menu-item" data-menu="chipset">Advanced Chipset Features</div>
                    <div class="menu-item" data-menu="peripherals">Integrated Peripherals</div>
                    <div class="menu-item" data-menu="power">Power Management Setup</div>
                    <div class="menu-item" data-menu="pnppci">PnP/PCI Configurations</div>
                    <div class="menu-item" data-menu="health">PC Health Status</div>
                </div>
                <div class="main-menu-right" id="rightPanel">
                    <div class="menu-item" data-menu="frequency">Frequency/Voltage Control</div>
                    <div class="menu-item" data-action="defaults">Load Fail-Safe Defaults</div>
                    <div class="menu-item" data-action="optimized">Load Optimized Defaults</div>
                    <div class="menu-item" data-action="password">Set Supervisor Password</div>
                    <div class="menu-item" data-action="user">Set User Password</div>
                    <div class="menu-item" data-action="save">Save & Exit Setup</div>
                    <div class="menu-item" data-action="exit">Exit Without Saving</div>
                </div>
            </div>
        `;
        mainContent.innerHTML = mainMenuHTML;
        currentMenuItems = Array.from(document.querySelectorAll('.menu-item'));
        currentSelectedIndex = 0;
        if (currentMenuItems[currentSelectedIndex]) {
            currentMenuItems[currentSelectedIndex].classList.add('selected');
        }
    }

    function loadSubMenu(menuId) {
        // Store the previous menu state if needed for back navigation (ESC)
        const previousMenu = currentMenu;
        currentMenu = menuId;

        let submenuHTML = '<div class="submenu-content">';

        // Define content for each submenu
        switch(menuId) {
            case 'standard':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">Date (mm/dd/yyyy)</div><div class="setting-value setting-value" data-setting="date">${settings['date']}</div></div>
                        <div class="setting-row"><div class="setting-name">Time (hh:mm:ss)</div><div class="setting-value setting-value" data-setting="time">${settings['time']}</div></div>
                        <div class="setting-row"><div class="setting-name">IDE Primary Master</div><div class="setting-value setting-value" data-setting="ide-primary-master">${settings['ide-primary-master']}</div></div>
                        <div class="setting-row"><div class="setting-name">IDE Primary Slave</div><div class="setting-value setting-value" data-setting="ide-primary-slave">${settings['ide-primary-slave']}</div></div>
                        <div class="setting-row"><div class="setting-name">IDE Secondary Master</div><div class="setting-value setting-value" data-setting="ide-secondary-master">${settings['ide-secondary-master']}</div></div>
                        <div class="setting-row"><div class="setting-name">IDE Secondary Slave</div><div class="setting-value setting-value" data-setting="ide-secondary-slave">${settings['ide-secondary-slave']}</div></div>
                        <div class="setting-row"><div class="setting-name">Drive A</div><div class="setting-value setting-value" data-setting="drive-a">${settings['drive-a']}</div></div>
                        <div class="setting-row"><div class="setting-name">Drive B</div><div class="setting-value setting-value" data-setting="drive-b">${settings['drive-b']}</div></div>
                        <div class="setting-row"><div class="setting-name">Video</div><div class="setting-value setting-value" data-setting="video">${settings['video']}</div></div>
                        <div class="setting-row"><div class="setting-name">Halt On</div><div class="setting-value setting-value" data-setting="halt-on">${settings['halt-on']}</div></div>
                        <div class="setting-row"><div class="setting-name">Base Memory</div><div class="setting-value">640K</div></div>
                        <div class="setting-row"><div class="setting-name">Extended Memory</div><div class="setting-value">256MB</div></div>
                        <div class="setting-row"><div class="setting-name">Total Memory</div><div class="setting-value">256MB</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Allows you to set the system date and time.</div>
                    </div>
                `;
                break;
            case 'advanced':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">Virus Warning</div><div class="setting-value setting-value" data-setting="virus-warning">${settings['virus-warning']}</div></div>
                        <div class="setting-row"><div class="setting-name">CPU Level 1 Cache</div><div class="setting-value setting-value" data-setting="cpu-cache">${settings['cpu-cache']}</div></div>
                        <div class="setting-row"><div class="setting-name">CPU Level 2 Cache</div><div class="setting-value setting-value" data-setting="external-cache">${settings['external-cache']}</div></div>
                        <div class="setting-row"><div class="setting-name">Quick Power On Self Test</div><div class="setting-value setting-value" data-setting="quick-powertest">${settings['quick-powertest']}</div></div>
                        <div class="setting-row"><div class="setting-name">First Boot Device</div><div class="setting-value setting-value" data-setting="first-boot">${settings['first-boot']}</div></div>
                        <div class="setting-row"><div class="setting-name">Second Boot Device</div><div class="setting-value setting-value" data-setting="second-boot">${settings['second-boot']}</div></div>
                        <div class="setting-row"><div class="setting-name">Third Boot Device</div><div class="setting-value setting-value" data-setting="third-boot">${settings['third-boot']}</div></div>
                        <div class="setting-row"><div class="setting-name">Boot Other Device</div><div class="setting-value setting-value" data-setting="boot-other">${settings['boot-other']}</div></div>
                        <div class="setting-row"><div class="setting-name">Swap Floppy Drive</div><div class="setting-value setting-value" data-setting="swap-floppy">${settings['swap-floppy']}</div></div>
                        <div class="setting-row"><div class="setting-name">Floppy Drive Seek</div><div class="setting-value setting-value" data-setting="floppy-seek">${settings['floppy-seek']}</div></div>
                        <div class="setting-row"><div class="setting-name">Boot Up NumLock Status</div><div class="setting-value setting-value" data-setting="numlock">${settings['numlock']}</div></div>
                        <div class="setting-row"><div class="setting-name">Gate A20 Option</div><div class="setting-value setting-value" data-setting="gate-a20">${settings['gate-a20']}</div></div>
                        <div class="setting-row"><div class="setting-name">Typematic Rate Setting</div><div class="setting-value setting-value" data-setting="typematic">${settings['typematic']}</div></div>
                        <div class="setting-row"><div class="setting-name">Security Option</div><div class="setting-value setting-value" data-setting="security">${settings['security']}</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Allows you to choose the VIRUS warning feature for IDE Hard Disk boot sector protection. If this function is enabled and someone attempt to write data into this area, BIOS will show a warning message on screen and alarm beep.</div>
                    </div>
                `;
                break;
            // Add other submenus similarly...
            case 'chipset':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">DRAM Timing Settings</div><div class="setting-value setting-value" data-setting="dram-timing">${settings['dram-timing']}</div></div>
                        <div class="setting-row"><div class="setting-name">SDRAM CAS Latency</div><div class="setting-value setting-value" data-setting="cas-latency">${settings['cas-latency']}</div></div>
                        <div class="setting-row"><div class="setting-name">SDRAM RAS# to CAS# Delay</div><div class="setting-value setting-value" data-setting="ras-to-cas">${settings['ras-to-cas']}</div></div>
                        <div class="setting-row"><div class="setting-name">SDRAM RAS# Precharge</div><div class="setting-value setting-value" data-setting="ras-precharge">${settings['ras-precharge']}</div></div>
                        <div class="setting-row"><div class="setting-name">System BIOS Cacheable</div><div class="setting-value setting-value" data-setting="bios-cache">${settings['bios-cache']}</div></div>
                        <div class="setting-row"><div class="setting-name">Video BIOS Cacheable</div><div class="setting-value setting-value" data-setting="video-cache">${settings['video-cache']}</div></div>
                        <div class="setting-row"><div class="setting-name">Memory Hole at 15M-16M</div><div class="setting-value setting-value" data-setting="memory-hole">${settings['memory-hole']}</div></div>
                        <div class="setting-row"><div class="setting-name">AGP Aperture Size</div><div class="setting-value setting-value" data-setting="agp-aperture">${settings['agp-aperture']}</div></div>
                        <div class="setting-row"><div class="setting-name">AGP Mode</div><div class="setting-value setting-value" data-setting="agp-mode">${settings['agp-mode']}</div></div>
                        <div class="setting-row"><div class="setting-name">AGP Fast Write</div><div class="setting-value setting-value" data-setting="agp-fast">${settings['agp-fast']}</div></div>
                        <div class="setting-row"><div class="setting-name">AGP Graphics Aperture Size</div><div class="setting-value setting-value" data-setting="agp-graphics">${settings['agp-graphics']}</div></div>
                        <div class="setting-row"><div class="setting-name">USB Controller</div><div class="setting-value setting-value" data-setting="usb-controller">${settings['usb-controller']}</div></div>
                        <div class="setting-row"><div class="setting-name">USB Keyboard Support</div><div class="setting-value setting-value" data-setting="usb-keyboard">${settings['usb-keyboard']}</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Allows you to configure the AGP settings for your graphics card.</div>
                    </div>
                `;
                break;
            case 'peripherals':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">Onboard FDC Controller</div><div class="setting-value setting-value" data-setting="fdc-controller">${settings['fdc-controller']}</div></div>
                        <div class="setting-row"><div class="setting-name">Onboard Serial Port 1</div><div class="setting-value setting-value" data-setting="serial-port1">${settings['serial-port1']}</div></div>
                        <div class="setting-row"><div class="setting-name">Onboard Serial Port 2</div><div class="setting-value setting-value" data-setting="serial-port2">${settings['serial-port2']}</div></div>
                        <div class="setting-row"><div class="setting-name">Onboard Parallel Port</div><div class="setting-value setting-value" data-setting="parallel-port">${settings['parallel-port']}</div></div>
                        <div class="setting-row"><div class="setting-name">Parallel Port Mode</div><div class="setting-value setting-value" data-setting="parallel-mode">${settings['parallel-mode']}</div></div>
                        <div class="setting-row"><div class="setting-name">ECP Mode Use DMA</div><div class="setting-value setting-value" data-setting="ecp-dma">${settings['ecp-dma']}</div></div>
                        <div class="setting-row"><div class="setting-name">EPP Mode</div><div class="setting-value setting-value" data-setting="epp-mode">${settings['epp-mode']}</div></div>
                        <div class="setting-row"><div class="setting-name">Onboard IDE Controller</div><div class="setting-value setting-value" data-setting="ide-controller">${settings['ide-controller']}</div></div>
                        <div class="setting-row"><div class="setting-name">Primary IDE Master</div><div class="setting-value setting-value" data-setting="primary-master">${settings['primary-master']}</div></div>
                        <div class="setting-row"><div class="setting-name">Primary IDE Slave</div><div class="setting-value setting-value" data-setting="primary-slave">${settings['primary-slave']}</div></div>
                        <div class="setting-row"><div class="setting-name">Secondary IDE Master</div><div class="setting-value setting-value" data-setting="secondary-master">${settings['secondary-master']}</div></div>
                        <div class="setting-row"><div class="setting-name">Secondary IDE Slave</div><div class="setting-value setting-value" data-setting="secondary-slave">${settings['secondary-slave']}</div></div>
                        <div class="setting-row"><div class="setting-name">Onboard Audio Controller</div><div class="setting-value setting-value" data-setting="audio-controller">${settings['audio-controller']}</div></div>
                        <div class="setting-row"><div class="setting-name">Onboard LAN Controller</div><div class="setting-value setting-value" data-setting="lan-controller">${settings['lan-controller']}</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Allows you to configure the onboard peripherals such as serial ports, parallel port, and IDE controllers.</div>
                    </div>
                `;
                break;
            case 'power':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">ACPI Function</div><div class="setting-value setting-value" data-setting="acpi">${settings['acpi']}</div></div>
                        <div class="setting-row"><div class="setting-name">Power Management</div><div class="setting-value setting-value" data-setting="power-mgmt">${settings['power-mgmt']}</div></div>
                        <div class="setting-row"><div class="setting-name">PM Control by APM</div><div class="setting-value setting-value" data-setting="pm-apm">${settings['pm-apm']}</div></div>
                        <div class="setting-row"><div class="setting-name">Video Off Method</div><div class="setting-value setting-value" data-setting="video-off">${settings['video-off']}</div></div>
                        <div class="setting-row"><div class="setting-name">Video Off in Suspend</div><div class="setting-value setting-value" data-setting="video-suspend">${settings['video-suspend']}</div></div>
                        <div class="setting-row"><div class="setting-name">Suspend Type</div><div class="setting-value setting-value" data-setting="suspend-type">${settings['suspend-type']}</div></div>
                        <div class="setting-row"><div class="setting-name">HDD Power Down</div><div class="setting-value setting-value" data-setting="hdd-power">${settings['hdd-power']}</div></div>
                        <div class="setting-row"><div class="setting-name">Soft-Off by PWR-BTTN</div><div class="setting-value setting-value" data-setting="soft-off">${settings['soft-off']}</div></div>
                        <div class="setting-row"><div class="setting-name">Power On by Ring</div><div class="setting-value setting-value" data-setting="ring-power">${settings['ring-power']}</div></div>
                        <div class="setting-row"><div class="setting-name">Power On by Mouse</div><div class="setting-value setting-value" data-setting="mouse-power">${settings['mouse-power']}</div></div>
                        <div class="setting-row"><div class="setting-name">Power On by Keyboard</div><div class="setting-value setting-value" data-setting="kbd-power">${settings['kbd-power']}</div></div>
                        <div class="setting-row"><div class="setting-name">Wake-Up Events</div><div class="setting-value setting-value" data-setting="wake-events">${settings['wake-events']}</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Allows you to configure the power management settings for your system.</div>
                    </div>
                `;
                break;
            case 'pnppci':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">Reset Configuration Data</div><div class="setting-value setting-value" data-setting="reset-config">${settings['reset-config']}</div></div>
                        <div class="setting-row"><div class="setting-name">Resources Controlled By</div><div class="setting-value setting-value" data-setting="resources">${settings['resources']}</div></div>
                        <div class="setting-row"><div class="setting-name">IRQ Resources</div><div class="setting-value setting-value" data-setting="irq-resources">${settings['irq-resources']}</div></div>
                        <div class="setting-row"><div class="setting-name">DMA Resources</div><div class="setting-value setting-value" data-setting="dma-resources">${settings['dma-resources']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ Assignment</div><div class="setting-value setting-value" data-setting="pci-irq">${settings['pci-irq']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ3 Assigned To</div><div class="setting-value setting-value" data-setting="irq3">${settings['irq3']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ4 Assigned To</div><div class="setting-value setting-value" data-setting="irq4">${settings['irq4']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ5 Assigned To</div><div class="setting-value setting-value" data-setting="irq5">${settings['irq5']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ7 Assigned To</div><div class="setting-value setting-value" data-setting="irq7">${settings['irq7']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ9 Assigned To</div><div class="setting-value setting-value" data-setting="irq9">${settings['irq9']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ10 Assigned To</div><div class="setting-value setting-value" data-setting="irq10">${settings['irq10']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ11 Assigned To</div><div class="setting-value setting-value" data-setting="irq11">${settings['irq11']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ12 Assigned To</div><div class="setting-value setting-value" data-setting="irq12">${settings['irq12']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ14 Assigned To</div><div class="setting-value setting-value" data-setting="irq14">${settings['irq14']}</div></div>
                        <div class="setting-row"><div class="setting-name">PCI IRQ15 Assigned To</div><div class="setting-value setting-value" data-setting="irq15">${settings['irq15']}</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Allows you to configure the PnP/PCI settings for your system.</div>
                    </div>
                `;
                break;
            case 'health':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">CPU Temperature</div><div class="setting-value">[45°C]</div></div>
                        <div class="setting-row"><div class="setting-name">System Temperature</div><div class="setting-value">[38°C]</div></div>
                        <div class="setting-row"><div class="setting-name">CPU Fan Speed</div><div class="setting-value">[3200 RPM]</div></div>
                        <div class="setting-row"><div class="setting-name">System Fan Speed</div><div class="setting-value">[2800 RPM]</div></div>
                        <div class="setting-row"><div class="setting-name">Voltage +12V</div><div class="setting-value">[12.1V]</div></div>
                        <div class="setting-row"><div class="setting-name">Voltage +5V</div><div class="setting-value">[5.05V]</div></div>
                        <div class="setting-row"><div class="setting-name">Voltage +3.3V</div><div class="setting-value">[3.32V]</div></div>
                        <div class="setting-row"><div class="setting-name">Voltage Vcore</div><div class="setting-value">[1.65V]</div></div>
                        <div class="setting-row"><div class="setting-name">Chassis Intrusion</div><div class="setting-value setting-value" data-setting="chassis">${settings['chassis']}</div></div>
                        <div class="setting-row"><div class="setting-name">Temperature Alarm</div><div class="setting-value setting-value" data-setting="temp-alarm">${settings['temp-alarm']}</div></div>
                        <div class="setting-row"><div class="setting-name">Fan Alarm</div><div class="setting-value setting-value" data-setting="fan-alarm">${settings['fan-alarm']}</div></div>
                        <div class="setting-row"><div class="setting-name">Voltage Alarm</div><div class="setting-value setting-value" data-setting="voltage-alarm">${settings['voltage-alarm']}</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Displays the current system health status, including temperatures, fan speeds, and voltages.</div>
                    </div>
                `;
                break;
            case 'frequency':
                submenuHTML += `
                    <div class="setting-list">
                        <div class="setting-row"><div class="setting-name">CPU Frequency</div><div class="setting-value setting-value" data-setting="cpu-freq">${settings['cpu-freq']}</div></div>
                        <div class="setting-row"><div class="setting-name">CPU Multiplier</div><div class="setting-value setting-value" data-setting="cpu-mult">${settings['cpu-mult']}</div></div>
                        <div class="setting-row"><div class="setting-name">FSB Frequency</div><div class="setting-value setting-value" data-setting="fsb-freq">${settings['fsb-freq']}</div></div>
                        <div class="setting-row"><div class="setting-name">DRAM Frequency</div><div class="setting-value setting-value" data-setting="dram-freq">${settings['dram-freq']}</div></div>
                        <div class="setting-row"><div class="setting-name">AGP Frequency</div><div class="setting-value setting-value" data-setting="agp-freq">${settings['agp-freq']}</div></div>
                        <div class="setting-row"><div class="setting-name">CPU Voltage</div><div class="setting-value setting-value" data-setting="cpu-voltage">${settings['cpu-voltage']}</div></div>
                        <div class="setting-row"><div class="setting-name">AGP Voltage</div><div class="setting-value setting-value" data-setting="agp-voltage">${settings['agp-voltage']}</div></div>
                        <div class="setting-row"><div class="setting-name">DRAM Voltage</div><div class="setting-value setting-value" data-setting="dram-voltage">${settings['dram-voltage']}</div></div>
                        <div class="setting-row"><div class="setting-name">CPU Core Voltage Control</div><div class="setting-value setting-value" data-setting="cpu-vcore">${settings['cpu-vcore']}</div></div>
                        <div class="setting-row"><div class="setting-name">DRAM Voltage Control</div><div class="setting-value setting-value" data-setting="dram-vcore">${settings['dram-vcore']}</div></div>
                        <div class="setting-row"><div class="setting-name">AGP Voltage Control</div><div class="setting-value setting-value" data-setting="agp-vcore">${settings['agp-vcore']}</div></div>
                        <div class="setting-row"><div class="setting-name">Overclocking Feature</div><div class="setting-value setting-value" data-setting="overclock">${settings['overclock']}</div></div>
                        <div class="setting-row"><div class="setting-name">Memory Timing Control</div><div class="setting-value setting-value" data-setting="mem-timing">${settings['mem-timing']}</div></div>
                    </div>
                    <div class="scrollbar">
                        <div class="scroll-arrow">▲</div>
                        <div class="scroll-arrow">▼</div>
                    </div>
                    <div class="item-help">
                        <div class="item-help-header">Item Help</div>
                        <div class="item-help-text">Allows you to configure the CPU frequency, voltage, and memory timing settings.</div>
                    </div>
                `;
                break;
            default:
                submenuHTML += '<div class="setting-list"><div class="setting-row"><div class="setting-name">[Submenu Content Not Found]</div></div></div>';
        }

        submenuHTML += '</div>'; // Close submenu-content

        mainContent.innerHTML = submenuHTML;
        currentMenuItems = Array.from(document.querySelectorAll('.setting-row')); // Selectable items are now settings
        currentSelectedIndex = 0;
        if (currentMenuItems[currentSelectedIndex]) {
            currentMenuItems[currentSelectedIndex].classList.add('selected-setting');
            updateSelectedItemHelp(); // Update help text for the first item
        }

        // Add click handlers to setting values
        document.querySelectorAll('.setting-value').forEach((setting, index) => {
            setting.addEventListener('click', function() {
                // Deselect previous
                if (currentMenuItems[currentSelectedIndex]) {
                    currentMenuItems[currentSelectedIndex].classList.remove('selected-setting');
                }
                // Select new
                currentSelectedIndex = index;
                this.parentElement.classList.add('selected-setting'); // Add class to the parent row
                updateSelectedItemHelp(); // Update help text when selection changes
            });
        });
    }

    function updateSelectedItemHelp() {
        // This function updates the help text based on the currently selected setting
        if (currentMenuItems.length > 0 && currentMenuItems[currentSelectedIndex] && currentMenuItems[currentSelectedIndex].querySelector('.setting-value')) {
            const settingName = currentMenuItems[currentSelectedIndex].querySelector('.setting-value').getAttribute('data-setting');
            // Define help text for each setting
            switch(settingName) {
                case 'virus-warning':
                    selectedItemHelp = "Allows you to choose the VIRUS warning feature for IDE Hard Disk boot sector protection. If this function is enabled and someone attempt to write data into this area, BIOS will show a warning message on screen and alarm beep.";
                    break;
                case 'cpu-cache':
                    selectedItemHelp = "Enables or disables the CPU Level 1 cache.";
                    break;
                case 'external-cache':
                    selectedItemHelp = "Enables or disables the CPU Level 2 cache.";
                    break;
                case 'quick-powertest':
                    selectedItemHelp = "Enables or disables the Quick Power On Self Test feature.";
                    break;
                case 'first-boot':
                    selectedItemHelp = "Sets the first boot device for the system.";
                    break;
                case 'second-boot':
                    selectedItemHelp = "Sets the second boot device for the system.";
                    break;
                case 'third-boot':
                    selectedItemHelp = "Sets the third boot device for the system.";
                    break;
                case 'boot-other':
                    selectedItemHelp = "Enables or disables the Boot Other Device feature.";
                    break;
                case 'swap-floppy':
                    selectedItemHelp = "Enables or disables the Swap Floppy Drive feature.";
                    break;
                case 'floppy-seek':
                    selectedItemHelp = "Enables or disables the Floppy Drive Seek feature.";
                    break;
                case 'numlock':
                    selectedItemHelp = "Sets the Boot Up NumLock Status.";
                    break;
                case 'gate-a20':
                    selectedItemHelp = "Sets the Gate A20 Option.";
                    break;
                case 'typematic':
                    selectedItemHelp = "Enables or disables the Typematic Rate Setting.";
                    break;
                case 'security':
                    selectedItemHelp = "Sets the Security Option.";
                    break;
                case 'dram-timing':
                    selectedItemHelp = "Sets the DRAM Timing Settings.";
                    break;
                case 'cas-latency':
                    selectedItemHelp = "Sets the SDRAM CAS Latency.";
                    break;
                case 'ras-to-cas':
                    selectedItemHelp = "Sets the SDRAM RAS# to CAS# Delay.";
                    break;
                case 'ras-precharge':
                    selectedItemHelp = "Sets the SDRAM RAS# Precharge.";
                    break;
                case 'bios-cache':
                    selectedItemHelp = "Enables or disables the System BIOS Cacheable feature.";
                    break;
                case 'video-cache':
                    selectedItemHelp = "Enables or disables the Video BIOS Cacheable feature.";
                    break;
                case 'memory-hole':
                    selectedItemHelp = "Enables or disables the Memory Hole at 15M-16M.";
                    break;
                case 'agp-aperture':
                    selectedItemHelp = "Sets the AGP Aperture Size.";
                    break;
                case 'agp-mode':
                    selectedItemHelp = "Sets the AGP Mode.";
                    break;
                case 'agp-fast':
                    selectedItemHelp = "Enables or disables the AGP Fast Write feature.";
                    break;
                case 'agp-graphics':
                    selectedItemHelp = "Sets the AGP Graphics Aperture Size.";
                    break;
                case 'usb-controller':
                    selectedItemHelp = "Enables or disables the USB Controller.";
                    break;
                case 'usb-keyboard':
                    selectedItemHelp = "Enables or disables the USB Keyboard Support.";
                    break;
                case 'fdc-controller':
                    selectedItemHelp = "Enables or disables the Onboard FDC Controller.";
                    break;
                case 'serial-port1':
                    selectedItemHelp = "Sets the Onboard Serial Port 1 configuration.";
                    break;
                case 'serial-port2':
                    selectedItemHelp = "Sets the Onboard Serial Port 2 configuration.";
                    break;
                case 'parallel-port':
                    selectedItemHelp = "Sets the Onboard Parallel Port configuration.";
                    break;
                case 'parallel-mode':
                    selectedItemHelp = "Sets the Parallel Port Mode.";
                    break;
                case 'ecp-dma':
                    selectedItemHelp = "Sets the ECP Mode Use DMA.";
                    break;
                case 'epp-mode':
                    selectedItemHelp = "Sets the EPP Mode.";
                    break;
                case 'ide-controller':
                    selectedItemHelp = "Sets the Onboard IDE Controller configuration.";
                    break;
                case 'primary-master':
                    selectedItemHelp = "Sets the Primary IDE Master configuration.";
                    break;
                case 'primary-slave':
                    selectedItemHelp = "Sets the Primary IDE Slave configuration.";
                    break;
                case 'secondary-master':
                    selectedItemHelp = "Sets the Secondary IDE Master configuration.";
                    break;
                case 'secondary-slave':
                    selectedItemHelp = "Sets the Secondary IDE Slave configuration.";
                    break;
                case 'audio-controller':
                    selectedItemHelp = "Enables or disables the Onboard Audio Controller.";
                    break;
                case 'lan-controller':
                    selectedItemHelp = "Enables or disables the Onboard LAN Controller.";
                    break;
                case 'acpi':
                    selectedItemHelp = "Enables or disables the ACPI Function.";
                    break;
                case 'power-mgmt':
                    selectedItemHelp = "Sets the Power Management configuration.";
                    break;
                case 'pm-apm':
                    selectedItemHelp = "Enables or disables the PM Control by APM feature.";
                    break;
                case 'video-off':
                    selectedItemHelp = "Sets the Video Off Method.";
                    break;
                case 'video-suspend':
                    selectedItemHelp = "Enables or disables the Video Off in Suspend feature.";
                    break;
                case 'suspend-type':
                    selectedItemHelp = "Sets the Suspend Type.";
                    break;
                case 'hdd-power':
                    selectedItemHelp = "Sets the HDD Power Down configuration.";
                    break;
                case 'soft-off':
                    selectedItemHelp = "Sets the Soft-Off by PWR-BTTN configuration.";
                    break;
                case 'ring-power':
                    selectedItemHelp = "Enables or disables the Power On by Ring feature.";
                    break;
                case 'mouse-power':
                    selectedItemHelp = "Enables or disables the Power On by Mouse feature.";
                    break;
                case 'kbd-power':
                    selectedItemHelp = "Enables or disables the Power On by Keyboard feature.";
                    break;
                case 'wake-events':
                    selectedItemHelp = "Enables or disables the Wake-Up Events feature.";
                    break;
                case 'reset-config':
                    selectedItemHelp = "Enables or disables the Reset Configuration Data feature.";
                    break;
                case 'resources':
                    selectedItemHelp = "Sets the Resources Controlled By configuration.";
                    break;
                case 'irq-resources':
                    selectedItemHelp = "Sets the IRQ Resources configuration.";
                    break;
                case 'dma-resources':
                    selectedItemHelp = "Sets the DMA Resources configuration.";
                    break;
                case 'pci-irq':
                    selectedItemHelp = "Sets the PCI IRQ Assignment configuration.";
                    break;
                case 'irq3':
                    selectedItemHelp = "Sets the PCI IRQ3 Assigned To configuration.";
                    break;
                case 'irq4':
                    selectedItemHelp = "Sets the PCI IRQ4 Assigned To configuration.";
                    break;
                case 'irq5':
                    selectedItemHelp = "Sets the PCI IRQ5 Assigned To configuration.";
                    break;
                case 'irq7':
                    selectedItemHelp = "Sets the PCI IRQ7 Assigned To configuration.";
                    break;
                case 'irq9':
                    selectedItemHelp = "Sets the PCI IRQ9 Assigned To configuration.";
                    break;
                case 'irq10':
                    selectedItemHelp = "Sets the PCI IRQ10 Assigned To configuration.";
                    break;
                case 'irq11':
                    selectedItemHelp = "Sets the PCI IRQ11 Assigned To configuration.";
                    break;
                case 'irq12':
                    selectedItemHelp = "Sets the PCI IRQ12 Assigned To configuration.";
                    break;
                case 'irq14':
                    selectedItemHelp = "Sets the PCI IRQ14 Assigned To configuration.";
                    break;
                case 'irq15':
                    selectedItemHelp = "Sets the PCI IRQ15 Assigned To configuration.";
                    break;
                case 'chassis':
                    selectedItemHelp = "Enables or disables the Chassis Intrusion feature.";
                    break;
                case 'temp-alarm':
                    selectedItemHelp = "Enables or disables the Temperature Alarm feature.";
                    break;
                case 'fan-alarm':
                    selectedItemHelp = "Enables or disables the Fan Alarm feature.";
                    break;
                case 'voltage-alarm':
                    selectedItemHelp = "Enables or disables the Voltage Alarm feature.";
                    break;
                case 'cpu-freq':
                    selectedItemHelp = "Sets the CPU Frequency.";
                    break;
                case 'cpu-mult':
                    selectedItemHelp = "Sets the CPU Multiplier.";
                    break;
                case 'fsb-freq':
                    selectedItemHelp = "Sets the FSB Frequency.";
                    break;
                case 'dram-freq':
                    selectedItemHelp = "Sets the DRAM Frequency.";
                    break;
                case 'agp-freq':
                    selectedItemHelp = "Sets the AGP Frequency.";
                    break;
                case 'cpu-voltage':
                    selectedItemHelp = "Sets the CPU Voltage.";
                    break;
                case 'agp-voltage':
                    selectedItemHelp = "Sets the AGP Voltage.";
                    break;
                case 'dram-voltage':
                    selectedItemHelp = "Sets the DRAM Voltage.";
                    break;
                case 'cpu-vcore':
                    selectedItemHelp = "Sets the CPU Core Voltage Control.";
                    break;
                case 'dram-vcore':
                    selectedItemHelp = "Sets the DRAM Voltage Control.";
                    break;
                case 'agp-vcore':
                    selectedItemHelp = "Sets the AGP Voltage Control.";
                    break;
                case 'overclock':
                    selectedItemHelp = "Enables or disables the Overclocking Feature.";
                    break;
                case 'mem-timing':
                    selectedItemHelp = "Sets the Memory Timing Control.";
                    break;
                case 'date':
                    selectedItemHelp = "Allows you to set the system date.";
                    break;
                case 'time':
                    selectedItemHelp = "Allows you to set the system time.";
                    break;
                case 'ide-primary-master':
                    selectedItemHelp = "Sets the IDE Primary Master configuration.";
                    break;
                case 'ide-primary-slave':
                    selectedItemHelp = "Sets the IDE Primary Slave configuration.";
                    break;
                case 'ide-secondary-master':
                    selectedItemHelp = "Sets the IDE Secondary Master configuration.";
                    break;
                case 'ide-secondary-slave':
                    selectedItemHelp = "Sets the IDE Secondary Slave configuration.";
                    break;
                case 'drive-a':
                    selectedItemHelp = "Sets the Drive A configuration.";
                    break;
                case 'drive-b':
                    selectedItemHelp = "Sets the Drive B configuration.";
                    break;
                case 'video':
                    selectedItemHelp = "Sets the Video configuration.";
                    break;
                case 'halt-on':
                    selectedItemHelp = "Sets the Halt On configuration.";
                    break;
                default:
                    selectedItemHelp = "No help available for this setting.";
            }
            // Update the help text in the UI
            const itemHelpText = document.querySelector('.item-help-text');
            if (itemHelpText) {
                itemHelpText.textContent = selectedItemHelp;
            }
        }
    }

    function loadPasswordMenu(type) {
        currentMenu = type === 'password' ? 'passwordMenu' : 'userPasswordMenu';
        const title = type === 'password' ? 'Set Supervisor Password' : 'Set User Password';
        const description = type === 'password' ? 'Password is required to access BIOS settings.' : 'Password is required to boot the system.';
        const action = type === 'password' ? 'setSupervisor' : 'setUser';

        const passwordHTML = `
            <div class="left-panel">
                <div class="option-row"><div class="option-name">${title}</div></div>
                <div class="password-input-row">
                    <div>Enter New Password:</div>
                    <input type="password" class="password-input" id="newPasswordInput">
                </div>
                <div class="password-input-row">
                    <div>Confirm Password:</div>
                    <input type="password" class="password-input" id="confirmPasswordInput">
                </div>
                <div style="margin: 5px 0;">${description}</div>
                <div style="margin: 5px 0;">Press ESC to cancel or ENTER to confirm.</div>
            </div>
            <div class="right-panel"></div>
        `;
        mainContent.innerHTML = passwordHTML;

        const newPasswordInput = document.getElementById('newPasswordInput');
        passwordInputField = newPasswordInput; // Store reference
        passwordInputActive = true; // Set flag
        newPasswordInput.focus();

         // Add event listener to confirm input field as well
         document.getElementById('confirmPasswordInput').addEventListener('keydown', function(e) {
             if (e.keyCode === 13 || e.keyCode === 27) {
                 // Trigger the container's keydown handler for ENTER/ESC
                 biosContainer.dispatchEvent(new KeyboardEvent('keydown', {'keyCode': e.keyCode}));
             }
         });
    }

    function loadConfirmationPrompt(type) {
        let title, message, actionDesc;
        if (type === 'save') {
            title = 'Save & Exit Setup';
            message = 'Save configuration changes and exit?';
            actionDesc = 'Saving changes will restart your computer.';
        } else if (type === 'exit') {
            title = 'Exit Without Saving';
            message = 'Discard all changes and exit?';
            actionDesc = 'Exiting without saving will not affect your current settings.';
        } else if (type === 'defaults') {
            title = 'Load Fail-Safe Defaults';
            message = 'Load fail-safe default settings?';
            actionDesc = 'These settings are optimized for stability.';
        } else if (type === 'optimized') {
            title = 'Load Optimized Defaults';
            message = 'Load optimized default settings?';
            actionDesc = 'These settings are optimized for performance.';
        }

        const confirmHTML = `
            <div class="left-panel">
                <div class="option-row"><div class="option-name">${title}</div></div>
                <div class="confirmation-prompt">
                    <div style="margin: 10px 0;">${message}</div>
                    <div style="margin: 10px 0;">Press Y to confirm, N to cancel.</div>
                    <div style="margin: 10px 0;">${actionDesc}</div>
                </div>
            </div>
            <div class="right-panel"></div>
        `;
        mainContent.innerHTML = confirmHTML;
        // No specific item selection needed for confirmation prompts
    }

    function handleConfirmationYes(action) {
        if (action === 'save') {
            alert("Configuration saved! System restarting..."); // Simulate save/restart
            loadMainMenu(); // Return to main menu or reload page in a real sim
        } else if (action === 'exit') {
            alert("Exiting without saving..."); // Simulate exit
            loadMainMenu(); // Return to main menu or reload page in a real sim
        } else if (action === 'defaults') {
             // Load fail-safe defaults (simplified example, reset to basic known values)
             settings['cpu-cache'] = '[Enabled]';
             settings['external-cache'] = '[Enabled]';
             settings['first-boot'] = '[HDD-0]';
             settings['security'] = '[Setup]';
             settings['halt-on'] = '[All Errors]';
             alert("Fail-safe defaults loaded.");
             loadMainMenu(); // Return to main menu after reset
        } else if (action === 'optimized') {
             // Load optimized defaults (simplified example)
             settings['cpu-cache'] = '[Enabled]';
             settings['external-cache'] = '[Enabled]';
             settings['first-boot'] = '[HDD-0]';
             settings['cpu-freq'] = '[1000MHz]'; // Example optimized value
             settings['cpu-mult'] = '[10x]'; // Example optimized value
             settings['security'] = '[System]';
             alert("Optimized defaults loaded.");
             loadMainMenu(); // Return to main menu after reset
        }
    }

    function changeSetting(increment) {
        if (currentMenuItems.length > 0 && currentMenuItems[currentSelectedIndex] && currentMenuItems[currentSelectedIndex].querySelector('.setting-value') && currentMenuItems[currentSelectedIndex].querySelector('.setting-value').hasAttribute('data-setting')) {
            const settingElement = currentMenuItems[currentSelectedIndex].querySelector('.setting-value');
            const settingName = settingElement.getAttribute('data-setting');
            const currentValue = settings[settingName];
            // Get possible values for this setting
            const possibleValues = getPossibleValues(settingName);
            if (possibleValues.length > 1) {
                // Find current index
                let currentIndex = possibleValues.indexOf(currentValue);
                if (increment) {
                    currentIndex = (currentIndex + 1) % possibleValues.length;
                } else {
                    currentIndex = (currentIndex - 1 + possibleValues.length) % possibleValues.length;
                }
                // Update the setting
                settings[settingName] = possibleValues[currentIndex];
                settingElement.textContent = possibleValues[currentIndex];
                updateSelectedItemHelp(); // Update help text after changing a setting
            }
        }
    }

    function getPossibleValues(settingName) {
        // Define possible values for each setting
        switch(settingName) {
            case 'video':
                return ['[EGA/VGA]', '[VGA]', '[EGA]', '[CGA4]', '[CGA8]', '[MONO]'];
            case 'halt-on':
                return ['[All Errors]', '[No Errors]', '[All, But Keyboard]', '[All, But Disk]', '[All, But Memory]'];
            case 'virus-warning':
            case 'cpu-cache':
            case 'external-cache':
            case 'quick-powertest':
            case 'boot-other':
            case 'swap-floppy':
            case 'floppy-seek':
            case 'numlock':
            case 'typematic':
            case 'bios-cache':
            case 'video-cache':
            case 'memory-hole':
            case 'agp-fast':
            case 'usb-controller':
            case 'usb-keyboard':
            case 'fdc-controller':
            case 'acpi':
            case 'pm-apm':
            case 'video-suspend':
            case 'ring-power':
            case 'mouse-power':
            case 'kbd-power':
            case 'wake-events':
            case 'reset-config':
            case 'chassis':
            case 'temp-alarm':
            case 'fan-alarm':
            case 'voltage-alarm':
            case 'overclock':
                return ['[Enabled]', '[Disabled]'];
            case 'gate-a20':
                return ['[Fast]', '[Normal]'];
            case 'security':
                return ['[Setup]', '[System]', '[Always]'];
            case 'dram-timing':
                return ['[By SPD]', '[Manual]'];
            case 'cas-latency':
                return ['[2]', '[2.5]', '[3]'];
            case 'ras-to-cas':
                return ['[2]', '[3]', '[4]'];
            case 'ras-precharge':
                return ['[2]', '[3]', '[4]'];
            case 'agp-aperture':
            case 'agp-graphics':
                return ['[4MB]', '[8MB]', '[16MB]', '[32MB]', '[64MB]', '[128MB]', '[256MB]'];
            case 'agp-mode':
                return ['[1X]', '[2X]', '[4X]'];
            case 'parallel-mode':
                return ['[SPP]', '[EPP]', '[ECP]', '[ECP+EPP]'];
            case 'ecp-dma':
                return ['[1]', '[3]'];
            case 'epp-mode':
                return ['[EPP1.7]', '[EPP1.9]'];
            case 'ide-controller':
                return ['[Disabled]', '[Primary]', '[Secondary]', '[Both]'];
            case 'first-boot':
                return ['[HDD-0]', '[HDD-1]', '[Floppy]', '[CDROM]', '[ZIP100]', '[LS120]'];
            case 'second-boot':
            case 'third-boot':
                return ['[HDD-0]', '[HDD-1]', '[Floppy]', '[CDROM]', '[ZIP100]', '[LS120]', '[Disabled]'];
            case 'power-mgmt':
                return ['[Disabled]', 'User Define', 'Min Power', 'Max Performance'];
            case 'video-off':
                return ['[Disabled]', '[VESA]', '[DPMS]'];
            case 'suspend-type':
                return ['[Disabled]', '[Stop Grant]', '[Sleep]', '[Suspend]'];
            case 'hdd-power':
                return ['[Never]', '1 Min', '5 Min', '10 Min', '15 Min', '20 Min', '30 Min'];
            case 'soft-off':
                return ['[Instant-Off]', 'Delay 4 Sec'];
            case 'resources':
                return ['[Auto]', '[Manual]'];
            case 'cpu-vcore':
            case 'dram-vcore':
            case 'agp-vcore':
            case 'mem-timing':
                return ['[Auto]', '[Manual]'];
            case 'overclock':
                return ['[Disabled]', '[Enabled]'];
            case 'drive-a':
                return ['[1.44M, 3.5"]', '[2.88M, 3.5"]', '[1.2M, 5.25"]', '[None]'];
            case 'drive-b':
                return ['[None]', '[1.44M, 3.5"]', '[2.88M, 3.5"]', '[1.2M, 5.25"]'];
            case 'ide-primary-master':
            case 'ide-primary-slave':
            case 'ide-secondary-master':
            case 'ide-secondary-slave':
                return ['[Auto]', '[None]', '[Manual]'];
            default:
                return [currentValue];
        }
    }

    function updateStatusBar() {
        // Simulate updating the status bar with current time and date
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

        // Update the status bar text (you could add more simulated hardware info)
        statusBar.textContent = `System Time: ${timeStr} | Date: ${dateStr} | HDD: None | FDD: 1.44M`;
    }

    // Optional: Update the status bar every second
    setInterval(updateStatusBar, 1000);

});