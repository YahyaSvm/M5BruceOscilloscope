var SCREEN_WIDTH = width();
var SCREEN_HEIGHT = height();
var APP_VERSION = "v1.5"; // Version updated: Button system change

var ADC_REF_VOLTAGE = 3.3;
var ADC_MAX_VALUE = 4095;
var NUM_VERT_DIVS = 6;
var NUM_HORZ_DIVS = 8;
var CHAR_WIDTH_PX = 6;

// === M5STACK BUTTON PINS (No longer used directly, Bruce OS functions will be used) ===
// var BTN_M5_SELECT_EXIT_PIN = 37; // Corresponds to getSelPress()
// var BTN_NAV_UP_PIN = 35; // Corresponds to getPrevPress() (Power Button)
// var BTN_NAV_DOWN_PIN = 39; // Corresponds to getNextPress() (Button A)

// ADC Input Pins
var CH1_PIN = 36;
var CH2_PIN = 25;

// === USB/Charging Detection Heuristic (Original) ===
var ENABLE_USB_DETECTION = true;
var USB_DETECT_PIN = CH1_PIN;
var USB_DETECT_THRESHOLD_ADC = ADC_MAX_VALUE * 0.8;
var USB_DETECT_READ_COUNT = 10;
var USB_DETECT_READ_DELAY = 5;

// === Battery Monitoring & Charging Detection ===
var ENABLE_BATTERY_HEURISTIC_DETECTION = true;
var BATTERY_ADC_PIN = 38;
var BATTERY_VOLTAGE_DIVIDER_FACTOR = 2.0;
var BATTERY_MIN_MV = 3300;
var BATTERY_MAX_MV = 4200;
var BATTERY_CHECK_INTERVAL_MS = 3000;
var BATTERY_ADC_RISE_THRESHOLD = 25;
var BATTERY_ADC_FALL_THRESHOLD = 20;

var lastBatteryAdcValue = -1;
var lastBatteryCheckTimeMs = 0;
var isLikelyChargingHeuristic = false;
var currentBatteryPercent = -1;
var hasShownChargingAdvisoryThisSession = false;
var forceRedrawCurrentScreen = false;

// === UI Element Dimensions & Colors ===
var HEADER_HEIGHT = 18; var FOOTER_HEIGHT = 18; var INFO_BAR_HEIGHT = 15;
var COLOR_BACKGROUND = color(0,0,0); var COLOR_FOREGROUND = color(200,200,200);
var COLOR_ACCENT = color(0,120,200); var COLOR_GRID_DARK = color(30,30,30);
var COLOR_GRID_LIGHT = color(50,50,50); var COLOR_CH1 = color(255,60,60);
var COLOR_CH2 = color(60,200,60); var COLOR_WARNING_TEXT = color(255,100,0);
var COLOR_PAUSED_TEXT = color(255, 200, 0);

// === Application Settings (Variables) ===
var timeBaseValues = [2,5,10,20,50,100,200,500];
var timeBaseIndex = 3; var timeBase = timeBaseValues[timeBaseIndex];
var voltsPerDivValues = [0.2,0.5,1.0,1.5,2.0,2.5,3.0];
var voltsPerDivIndex = 2; var voltsPerDiv = voltsPerDivValues[voltsPerDivIndex];
var activeChannel1 = true; var activeChannel2 = false;
var measureChannel = 1; var triggerLevelAdc = ADC_MAX_VALUE/2;
var triggerEdge = 1;


// === Helper Function for Original USB/Charging Detection ===
function isUsbChargingDetected() {
    if (!ENABLE_USB_DETECTION || USB_DETECT_PIN < 0 || typeof analogRead !== 'function') return false;
    var highCount = 0;
    for (var i = 0; i < USB_DETECT_READ_COUNT; i++) {
        var adcVal = analogRead(USB_DETECT_PIN);
        if (adcVal !== null && !isNaN(adcVal) && adcVal > USB_DETECT_THRESHOLD_ADC) highCount++;
        delay(USB_DETECT_READ_DELAY);
    }
    return highCount > (USB_DETECT_READ_COUNT / 2);
}

// === Battery Status Update & Advisory Function ===
function updateBatteryStateAndHandleAdvisory() {
    if (!ENABLE_BATTERY_HEURISTIC_DETECTION || BATTERY_ADC_PIN < 0 || typeof analogRead !== 'function') {
        isLikelyChargingHeuristic = false; currentBatteryPercent = -1; hasShownChargingAdvisoryThisSession = false; return;
    }
    var currentTimeMs = Date.now();
    if (lastBatteryCheckTimeMs !== 0 && (currentTimeMs - lastBatteryCheckTimeMs < BATTERY_CHECK_INTERVAL_MS)) return;

    var adcVal = analogRead(BATTERY_ADC_PIN); var previousChargingState = isLikelyChargingHeuristic;
    if (adcVal !== null && !isNaN(adcVal)) {
        var batteryVoltageMv = (adcVal / ADC_MAX_VALUE) * ADC_REF_VOLTAGE * BATTERY_VOLTAGE_DIVIDER_FACTOR * 1000;
        if (batteryVoltageMv <= BATTERY_MIN_MV) currentBatteryPercent = 0;
        else if (batteryVoltageMv >= BATTERY_MAX_MV) currentBatteryPercent = 100;
        else currentBatteryPercent = Math.round(((batteryVoltageMv - BATTERY_MIN_MV) / (BATTERY_MAX_MV - BATTERY_MIN_MV)) * 100);
        currentBatteryPercent = Math.max(0, Math.min(100, currentBatteryPercent));
        if (lastBatteryAdcValue !== -1) {
            if (adcVal > (lastBatteryAdcValue + BATTERY_ADC_RISE_THRESHOLD)) isLikelyChargingHeuristic = true;
            else if (adcVal < (lastBatteryAdcValue - BATTERY_ADC_FALL_THRESHOLD)) { isLikelyChargingHeuristic = false; hasShownChargingAdvisoryThisSession = false; }
        } else { isLikelyChargingHeuristic = false; hasShownChargingAdvisoryThisSession = false; }
        lastBatteryAdcValue = adcVal;
    } else { currentBatteryPercent = -1; isLikelyChargingHeuristic = false; hasShownChargingAdvisoryThisSession = false; lastBatteryAdcValue = -1; }
    lastBatteryCheckTimeMs = currentTimeMs;
    if (isLikelyChargingHeuristic && !previousChargingState && !hasShownChargingAdvisoryThisSession) {
        if (!(ENABLE_USB_DETECTION && isUsbChargingDetected())) {
            showChargingFluctuationWarning(); hasShownChargingAdvisoryThisSession = true; forceRedrawCurrentScreen = true;
        }
    }
}

// === UI Helper Functions ===
function drawHeader(title) {
    drawFillRect(0,0,SCREEN_WIDTH,HEADER_HEIGHT,COLOR_ACCENT); setTextSize(1); setTextColor(color(255,255,255));
    var titleActualWidth = title.length * CHAR_WIDTH_PX; var titleX = Math.floor(SCREEN_WIDTH/2 - titleActualWidth/2);
    drawString(title, titleX, 4);
    if (ENABLE_BATTERY_HEURISTIC_DETECTION && currentBatteryPercent !== -1) {
        var batteryInfo = (isLikelyChargingHeuristic ? "C " : "") + currentBatteryPercent + "%";
        var batteryInfoWidth = batteryInfo.length * CHAR_WIDTH_PX; var batteryInfoX = SCREEN_WIDTH - batteryInfoWidth - 5;
        if (batteryInfoX > titleX + titleActualWidth + 5 || batteryInfoX > SCREEN_WIDTH / 2) drawString(batteryInfo, batteryInfoX, 4);
    } setTextColor(COLOR_FOREGROUND);
}
function drawFooter(hintNavUp, hintSelectExit, hintNavDown) {
    drawFillRect(0,SCREEN_HEIGHT - FOOTER_HEIGHT, SCREEN_WIDTH, FOOTER_HEIGHT, color(25,25,25));
    setTextSize(1); setTextColor(COLOR_FOREGROUND); var yPos = SCREEN_HEIGHT - FOOTER_HEIGHT + 5;
    if(hintNavUp) drawString(hintNavUp, 5, yPos);
    if(hintSelectExit) { var selectWidth = hintSelectExit.length * CHAR_WIDTH_PX; drawString(hintSelectExit, Math.floor(SCREEN_WIDTH/2 - selectWidth/2), yPos); }
    if(hintNavDown) { var downWidth = hintNavDown.length * CHAR_WIDTH_PX; drawString(hintNavDown, SCREEN_WIDTH - downWidth - 10, yPos); }
}
function drawScrollableMenuItem(text, index, selectedIndex, viewTopIndex, yOffset, itemHeight, itemAreaHeight) {
    var itemPadding = 3; var displayY = yOffset + ((index - viewTopIndex) * itemHeight);
    if (displayY >= yOffset - itemHeight && displayY < yOffset + itemAreaHeight) {
        drawFillRect(0, displayY - itemPadding, SCREEN_WIDTH, itemHeight + (itemPadding*2) -1 , COLOR_BACKGROUND); setTextSize(1);
        if (index === selectedIndex) {
            drawFillRect(5, displayY - itemPadding, SCREEN_WIDTH - 10, itemHeight + (itemPadding*2) - 2 , color(40,50,70));
            setTextColor(COLOR_ACCENT); drawString(">" + text, 10, displayY);
        } else { setTextColor(COLOR_FOREGROUND); drawString(" " + text, 10, displayY); }
        setTextColor(COLOR_FOREGROUND);
    }
}

// === Original USB Warning Screen (Hard Stop) ===
function showUsbWarningAndBlock() {
    var tempEnableBattery = ENABLE_BATTERY_HEURISTIC_DETECTION; ENABLE_BATTERY_HEURISTIC_DETECTION = false;
    drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, COLOR_BACKGROUND); drawHeader("WARNING");
    setTextSize(1); setTextColor(COLOR_WARNING_TEXT);
    var warnings = [ "USB Power Detected!", "High voltage on CH1 pin.", "This can affect ADC readings.", "DISCONNECT USB CABLE", "for accurate measurements,", "or ensure CH1 has a load.", "", "Press Select to Continue" ]; // Text updated
    var yPos = HEADER_HEIGHT + 10; var lineHeight = 12;
    for (var i = 0; i < warnings.length; i++) { var line = warnings[i]; var lineWidth = line.length * CHAR_WIDTH_PX; drawString(line, Math.floor(SCREEN_WIDTH / 2 - lineWidth / 2), yPos + i * lineHeight); }
    drawFooter("", "Select: Continue", ""); // Footer updated

    while (true) { // Loop until Select is pressed
        if (getSelPress()) {
            break; // Exit loop when Select is pressed
        }
        delay(50); // Check periodically
    }
    // getSelPress() handles debounce, so no extra delay needed here for that.
    ENABLE_BATTERY_HEURISTIC_DETECTION = tempEnableBattery; forceRedrawCurrentScreen = true;
}

// === Charging Fluctuation Warning Screen (Soft Warning) ===
function showChargingFluctuationWarning() {
    var tempEnableBattery = ENABLE_BATTERY_HEURISTIC_DETECTION; var tempLastCheckTime = lastBatteryCheckTimeMs;
    ENABLE_BATTERY_HEURISTIC_DETECTION = false;
    drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, COLOR_BACKGROUND); drawHeader("CHARGING ADVISORY");
    setTextSize(1); setTextColor(COLOR_WARNING_TEXT);
    var warnings = [ "Device appears to be charging.", "(Battery voltage rising)", "Measurements may fluctuate", "or be less accurate.", "" ];
    var yPos = HEADER_HEIGHT + 15; var lineHeight = 12;
    for (var i = 0; i < warnings.length; i++) { var line = warnings[i]; var lineWidth = line.length * CHAR_WIDTH_PX; drawString(line, Math.floor(SCREEN_WIDTH / 2 - lineWidth / 2), yPos + i * lineHeight); }
    drawFooter("", "OK (Select)", ""); // Footer updated

    while (true) { // Loop until Select is pressed
        if (getSelPress()) {
            break; // Exit loop when Select is pressed
        }
        delay(50); // Check periodically
    }
    ENABLE_BATTERY_HEURISTIC_DETECTION = tempEnableBattery; lastBatteryCheckTimeMs = tempLastCheckTime;
}

// === Settings Menu ===
function settingsMenu() {
    var selectedIndex = 0; var viewTopIndex = 0; var menuItemHeight = 16; var menuDisplayAreaY = HEADER_HEIGHT + 5;
    var menuDisplayAreaHeight = SCREEN_HEIGHT - menuDisplayAreaY - FOOTER_HEIGHT - 5; var maxVisibleItems = Math.floor(menuDisplayAreaHeight / menuItemHeight);
    var menuStructure = [
        { name: "Time/Px", getVal: function(){return timeBaseValues[timeBaseIndex] + "ms";}, action: function(){timeBaseIndex=(timeBaseIndex+1)%timeBaseValues.length; timeBase=timeBaseValues[timeBaseIndex];}},
        { name: "V/Div", getVal: function(){return voltsPerDivValues[voltsPerDivIndex].toFixed(1)+"V";}, action: function(){voltsPerDivIndex=(voltsPerDivIndex+1)%voltsPerDivValues.length; voltsPerDiv=voltsPerDivValues[voltsPerDivIndex];}},
        { name: "CH1", getVal: function(){return activeChannel1?"On":"Off";}, action: function(){activeChannel1=!activeChannel1;}},
        { name: "CH2", getVal: function(){return activeChannel2?"On":"Off";}, action: function(){activeChannel2=!activeChannel2;}},
        { name: "Meas.Ch", getVal: function(){return "CH"+measureChannel;}, action: function(){measureChannel=(measureChannel%2)+1; if(!activeChannel1 && !activeChannel2) measureChannel=1;}},
        { name: "TrigEdge", getVal: function(){return triggerEdge==1?"Rise":"Fall";}, action: function(){triggerEdge=1-triggerEdge;}},
        { name: "Back", getVal: function(){return "";}, action: "EXIT_MENU" }
    ];
    var redrawScreen = true;
    while (true) {
        updateBatteryStateAndHandleAdvisory(); if (forceRedrawCurrentScreen) { redrawScreen = true; forceRedrawCurrentScreen = false; }
        if (redrawScreen) {
            drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("Settings");
            for (var i=0; i<menuStructure.length; i++) {
                var itemText = menuStructure[i].name; var valueText = menuStructure[i].getVal(); if (valueText) itemText += ": " + valueText;
                if (itemText.length*CHAR_WIDTH_PX > SCREEN_WIDTH-25) itemText = itemText.substring(0, Math.floor((SCREEN_WIDTH-25)/CHAR_WIDTH_PX)-1) + "..";
                drawScrollableMenuItem(itemText, i, selectedIndex, viewTopIndex, menuDisplayAreaY, menuItemHeight, menuDisplayAreaHeight);
            } drawFooter("Up (Pwr)", "Select/Do", "Down (A)"); redrawScreen = false; // Footer hints updated
        }
        // No main loop delay needed here, button checks are event-driven by get...Press()

        if (getSelPress()) { // BTN_M5_SELECT_EXIT_PIN (GPIO37)
            var currentItem = menuStructure[selectedIndex]; 
            if (currentItem.action === "EXIT_MENU") { return; } // Exit immediately
            else if (typeof currentItem.action === 'function') {
                currentItem.action();
                if ((currentItem.name === "CH1" || currentItem.name === "CH2") && measureChannel === 1 && !activeChannel1 && activeChannel2) measureChannel = 2;
                else if ((currentItem.name === "CH1" || currentItem.name === "CH2") && measureChannel === 2 && !activeChannel2 && activeChannel1) measureChannel = 1;
                else if (!activeChannel1 && !activeChannel2) measureChannel = 1;
                redrawScreen = true;
            }
            // getSelPress() handles debounce and single trigger
        }
        if (getPrevPress()) { // BTN_NAV_UP_PIN (Power Button - GPIO35)
            selectedIndex = (selectedIndex - 1 + menuStructure.length) % menuStructure.length;
            if (selectedIndex < viewTopIndex) viewTopIndex = selectedIndex; 
            else if (selectedIndex >= viewTopIndex + maxVisibleItems) viewTopIndex = selectedIndex - maxVisibleItems + 1;
            redrawScreen = true; 
        }
        if (getNextPress()) { // BTN_NAV_DOWN_PIN (Button A - GPIO39)
            selectedIndex = (selectedIndex + 1) % menuStructure.length;
            if (selectedIndex >= viewTopIndex + maxVisibleItems) viewTopIndex = selectedIndex - maxVisibleItems + 1; 
            else if (selectedIndex < viewTopIndex) viewTopIndex = selectedIndex;
            redrawScreen = true; 
        }
        delay(50); // Add a small delay to prevent tight loop if no buttons pressed, and allow screen updates
    }
}

// === Main Menu ===
function mainMenu() {
    var selectedIndex = 0; var viewTopIndex = 0; var menuItemHeight = 20; var menuDisplayAreaY = HEADER_HEIGHT + 10;
    var menuDisplayAreaHeight = SCREEN_HEIGHT - menuDisplayAreaY - FOOTER_HEIGHT - 5; var maxVisibleItems = Math.floor(menuDisplayAreaHeight / menuItemHeight);
    var menuItems = [ "Oscilloscope", "Settings", "About", "Safety Info", "Exit to Bruce" ]; var redrawScreen = true;
    while (true) {
        updateBatteryStateAndHandleAdvisory(); if (forceRedrawCurrentScreen) { redrawScreen = true; forceRedrawCurrentScreen = false; }
        if (redrawScreen) {
            drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("M5Scope " + APP_VERSION);
            for (var i=0; i<menuItems.length; i++) {
                var itemText = menuItems[i]; if (itemText.length*CHAR_WIDTH_PX > SCREEN_WIDTH-25) itemText = itemText.substring(0, Math.floor((SCREEN_WIDTH-25)/CHAR_WIDTH_PX)-1) + "..";
                drawScrollableMenuItem(itemText, i, selectedIndex, viewTopIndex, menuDisplayAreaY, menuItemHeight, menuDisplayAreaHeight);
            } drawFooter("Up (Pwr)", "Select", "Down (A)"); redrawScreen = false; // Footer hints updated
        }

        if (getPrevPress()) { // Up
            selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
            if (selectedIndex < viewTopIndex) viewTopIndex = selectedIndex; 
            else if (selectedIndex >= viewTopIndex + maxVisibleItems) viewTopIndex = selectedIndex - maxVisibleItems + 1;
            redrawScreen = true; 
        }
        if (getNextPress()) { // Down
            selectedIndex = (selectedIndex + 1) % menuItems.length;
            if (selectedIndex >= viewTopIndex + maxVisibleItems) viewTopIndex = selectedIndex - maxVisibleItems + 1; 
            else if (selectedIndex < viewTopIndex) viewTopIndex = selectedIndex;
            redrawScreen = true; 
        }
        if (getSelPress()) { // Select
            return selectedIndex; 
        }
        delay(50); // Add a small delay
    }
}

// === About Screen ===
function aboutScreen() {
    var redrawScreen = true;
    while(true) {
        updateBatteryStateAndHandleAdvisory(); if (forceRedrawCurrentScreen) { redrawScreen = true; forceRedrawCurrentScreen = false; }
        if (redrawScreen) {
            drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("About M5Scope");
            setTextSize(1); setTextColor(COLOR_FOREGROUND);
            var textLines = [ "M5Scope "+APP_VERSION, "By YahyaSvm & Takagi-1", "JS Oscilloscope", "github.com/", "YahyaSvm/", "M5Oscilloscope" ];
            var yPos = HEADER_HEIGHT + 10; var lineHeight = 12;
            for(var i=0; i<textLines.length; i++) {
                var line = textLines[i]; if (line.length*CHAR_WIDTH_PX > SCREEN_WIDTH-10) line = line.substring(0, Math.floor((SCREEN_WIDTH-10)/CHAR_WIDTH_PX)-1) + "..";
                var lineWidth = line.length * CHAR_WIDTH_PX; drawString(line, Math.floor(SCREEN_WIDTH/2 - lineWidth/2), yPos + i*lineHeight);
            } drawFooter("", "Back (Sel)", ""); redrawScreen = false; // Footer hints updated
        }
        if (getSelPress()) { return; } 
        delay(50); // Add a small delay
    }
}

// === Safety Information Screen ===
function safetyInfoScreen() {
    var viewTopLine = 0; var lineHeight = 11; var textDisplayAreaY = HEADER_HEIGHT + 7;
    var textDisplayAreaHeight = SCREEN_HEIGHT - textDisplayAreaY - FOOTER_HEIGHT - 5; var maxVisibleLines = Math.floor(textDisplayAreaHeight / lineHeight);
    var warnings = [ "HIGH VOLTAGE RISK!", "Max ADC input: 0-" + ADC_REF_VOLTAGE.toFixed(1) + "V.", "Exceeding WILL DAMAGE M5Stack.", "", "Use voltage dividers for", "higher voltages or AC.", "", "Verify ADC & Button pins.", "This is EXPERIMENTAL.", "Use at YOUR OWN RISK.", "Developer is not liable." ];
    var redrawScreen = true;
    while(true) {
        updateBatteryStateAndHandleAdvisory(); if (forceRedrawCurrentScreen) { redrawScreen = true; forceRedrawCurrentScreen = false; }
        if (redrawScreen) {
            drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("SAFETY WARNINGS");
            setTextSize(1); setTextColor(COLOR_WARNING_TEXT);
            for(var i = 0; i < warnings.length; i++) {
                var displayY = textDisplayAreaY + ((i - viewTopLine) * lineHeight);
                if (displayY >= textDisplayAreaY - lineHeight && displayY < textDisplayAreaY + textDisplayAreaHeight) {
                    drawFillRect(0, displayY, SCREEN_WIDTH, lineHeight, COLOR_BACKGROUND);
                    var line = warnings[i]; var lineWidth = line.length * CHAR_WIDTH_PX; drawString(line, Math.floor(SCREEN_WIDTH/2 - lineWidth/2), displayY);
                }
            } setTextColor(COLOR_FOREGROUND); drawFooter("Up (Pwr)", "Back (Sel)", "Down (A)"); redrawScreen = false; // Footer hints updated
        }
        
        if (getSelPress()) { return; }
        if (getPrevPress()) { // Up
            var prevViewTopLine = viewTopLine; if (viewTopLine > 0) viewTopLine--;
            if (viewTopLine !== prevViewTopLine) redrawScreen = true; 
        }
        if (getNextPress()) { // Down
            var prevViewTopLine = viewTopLine; if (viewTopLine < warnings.length - maxVisibleLines) viewTopLine++;
            if (viewTopLine !== prevViewTopLine) redrawScreen = true; 
        }
        delay(50); // Add a small delay
    }
}

// === Oscilloscope Function ===
function oscilloscopeScreen() {
    var graphOriginX = 1; var graphAreaY = HEADER_HEIGHT + INFO_BAR_HEIGHT;
    var graphRenderHeight = SCREEN_HEIGHT - graphAreaY - FOOTER_HEIGHT;
    var graphRenderWidth = SCREEN_WIDTH - (2*graphOriginX);
    var currentX, prevY1, prevY2;
    var minAdcValue, maxAdcValue, measuredFreq, samplesSinceTrigger;
    var lastTriggerStateAdc, readyForNextTrigger, triggeredThisSweep;
    var isPaused = false;
    var initialAdcValue = ADC_MAX_VALUE/2;
    var needsFullRedraw = true; 

    function resetSweepState() { /* ... (no changes needed here) ... */ 
        prevY1 = adcToScreenY(initialAdcValue);
        prevY2 = adcToScreenY(initialAdcValue);
        currentX = graphOriginX;
        minAdcValue = ADC_MAX_VALUE; maxAdcValue = 0;
        samplesSinceTrigger = 0;
        lastTriggerStateAdc = triggerLevelAdc;
        readyForNextTrigger = true;
        triggeredThisSweep = false;
    }
    function adcToScreenY(adcValue){ /* ... (no changes needed here) ... */ 
        adcValue = Math.max(0, Math.min(ADC_MAX_VALUE, adcValue)); var voltage = (adcValue / ADC_MAX_VALUE) * ADC_REF_VOLTAGE;
        var voltageRelativeToCenter = voltage - (ADC_REF_VOLTAGE / 2); var totalVoltsOnScreen = voltsPerDiv * NUM_VERT_DIVS;
        var pixelsPerVolt = graphRenderHeight / totalVoltsOnScreen; var yOnGraph = (graphRenderHeight / 2) - (voltageRelativeToCenter * pixelsPerVolt);
        var finalScreenY = graphAreaY + yOnGraph;
        if(finalScreenY < graphAreaY) finalScreenY = graphAreaY; if(finalScreenY >= graphAreaY + graphRenderHeight - 1) finalScreenY = graphAreaY + graphRenderHeight - 1;
        return Math.floor(finalScreenY);
    }
    function drawScopeGrid(){ /* ... (no changes needed here) ... */ 
        drawFillRect(graphOriginX,graphAreaY,graphRenderWidth,graphRenderHeight,COLOR_BACKGROUND);
        var horzDivPixelWidth = graphRenderWidth / NUM_HORZ_DIVS; var vertDivPixelHeight = graphRenderHeight / NUM_VERT_DIVS;
        for(var i = 0; i <= NUM_HORZ_DIVS; i++){ var lineX = graphOriginX + Math.floor(i * horzDivPixelWidth); drawLine(lineX, graphAreaY, lineX, graphAreaY + graphRenderHeight, (i === NUM_HORZ_DIVS/2) ? COLOR_GRID_LIGHT : COLOR_GRID_DARK); }
        for(var j = 0; j <= NUM_VERT_DIVS; j++){ var lineY = graphAreaY + Math.floor(j * vertDivPixelHeight); drawLine(graphOriginX, lineY, graphOriginX + graphRenderWidth, lineY, (j === NUM_VERT_DIVS/2) ? COLOR_GRID_LIGHT : COLOR_GRID_DARK); }
    }
    function printScopeInfo(){ /* ... (no changes needed here) ... */ 
        drawFillRect(0,HEADER_HEIGHT,SCREEN_WIDTH,INFO_BAR_HEIGHT,color(15,15,15)); setTextSize(1); setTextColor(COLOR_FOREGROUND);
        var infoY = HEADER_HEIGHT + 3; var vppVolts = ((maxAdcValue - minAdcValue) / ADC_MAX_VALUE) * ADC_REF_VOLTAGE;
        if (vppVolts < 0.005 || maxAdcValue === 0 || minAdcValue === ADC_MAX_VALUE || (!activeChannel1 && !activeChannel2)) vppVolts = 0;
        var vdivStr = voltsPerDiv.toFixed(1) + "V"; var tdivStrText = (timeBase < 1000) ? timeBase.toFixed(0)+"ms" : (timeBase/1000.0).toFixed(1)+"s";
        var vppStr = "Vpp:" + vppVolts.toFixed(1); var hzStr = (measuredFreq > 0.1 && measuredFreq < 20000 ? measuredFreq.toFixed(0) : "---") + "Hz";
        drawString(vdivStr, 3, infoY); var tdivWidth = tdivStrText.length * CHAR_WIDTH_PX; drawString(tdivStrText, SCREEN_WIDTH - tdivWidth - 3, infoY);
        var vppWidth = vppStr.length * CHAR_WIDTH_PX; var hzWidth = hzStr.length * CHAR_WIDTH_PX;
        var leftTaken = (vdivStr.length * CHAR_WIDTH_PX + 5); var rightTaken = (tdivStrText.length * CHAR_WIDTH_PX + 5) ; var availableMidSpace = SCREEN_WIDTH - leftTaken - rightTaken;
        if(vppWidth + hzWidth + 10 < availableMidSpace){ var startX = Math.floor(leftTaken + (availableMidSpace - (vppWidth + hzWidth + 5))/2 ); drawString(vppStr, startX, infoY); drawString(hzStr, startX + vppWidth + 5, infoY);
        } else if (vppWidth < availableMidSpace) { drawString(vppStr, Math.floor(leftTaken + (availableMidSpace - vppWidth)/2 ), infoY);
        } else if (hzWidth < availableMidSpace) { drawString(hzStr, Math.floor(leftTaken + (availableMidSpace - hzWidth)/2 ), infoY); }
    }

    while (true) {
        var oldBatteryPercent = currentBatteryPercent;
        var oldIsLikelyCharging = isLikelyChargingHeuristic;
        updateBatteryStateAndHandleAdvisory();
        var headerNeedsUpdate = (currentBatteryPercent !== oldBatteryPercent) || (isLikelyChargingHeuristic !== oldIsLikelyCharging);

        if (forceRedrawCurrentScreen) {
            needsFullRedraw = true;
            forceRedrawCurrentScreen = false;
        }

        // Handle Pause/Resume button (PrevPress - Power Button)
        // Note: Power button might have system-level functions too. Test carefully.
        if (getPrevPress()) { 
            isPaused = !isPaused;
            if (!isPaused) { // Just UNPAUSED
                needsFullRedraw = true;
            } else { // Just PAUSED
                drawHeader("Oscilloscope");
                printScopeInfo(); 
            }
        }

        if (needsFullRedraw) {
            drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND);
            drawHeader("Oscilloscope");
            drawScopeGrid();
            resetSweepState(); 
            printScopeInfo();  
            needsFullRedraw = false;
        } else if (isPaused && headerNeedsUpdate) {
            drawHeader("Oscilloscope");
        }

        if (!isPaused) {
            var adcValCh1 = analogRead(CH1_PIN);
            var adcValCh2 = activeChannel2 ? analogRead(CH2_PIN) : initialAdcValue;

            if (adcValCh1 === null || isNaN(adcValCh1) || (activeChannel2 && (adcValCh2 === null || isNaN(adcValCh2)))) {
                delay(timeBase > 0 ? timeBase : 1);
                if (headerNeedsUpdate) drawHeader("Oscilloscope"); 
                drawFooter("Pause(Pwr)", "Exit(Sel)", ""); // Footer hints updated
                continue;
            }
            var screenYCh1 = adcToScreenY(adcValCh1);
            var screenYCh2 = activeChannel2 ? adcToScreenY(adcValCh2) : adcToScreenY(initialAdcValue);

            if(currentX >= graphOriginX + graphRenderWidth) { 
                currentX = graphOriginX;
                drawScopeGrid(); 
                printScopeInfo(); 
                minAdcValue = ADC_MAX_VALUE; maxAdcValue = 0; 
                if(!triggeredThisSweep && measuredFreq > 0) measuredFreq = 0; 
                triggeredThisSweep = false; readyForNextTrigger = true;
                prevY1 = screenYCh1; 
                prevY2 = screenYCh2;
            }

            if(currentX > graphOriginX){
                if(activeChannel1) drawLine(currentX-1, prevY1, currentX, screenYCh1, COLOR_CH1);
                if(activeChannel2) drawLine(currentX-1, prevY2, currentX, screenYCh2, COLOR_CH2);
            }
            prevY1 = screenYCh1; prevY2 = screenYCh2;

            var adcValueForMeasurement = initialAdcValue;
            if (measureChannel === 1 && activeChannel1) adcValueForMeasurement = adcValCh1;
            else if (measureChannel === 2 && activeChannel2) adcValueForMeasurement = adcValCh2;
            else if (activeChannel1) adcValueForMeasurement = adcValCh1;
            else if (activeChannel2) adcValueForMeasurement = adcValCh2;

            if (activeChannel1 || activeChannel2) {
                 if (adcValueForMeasurement > maxAdcValue) maxAdcValue = adcValueForMeasurement;
                 if (adcValueForMeasurement < minAdcValue) minAdcValue = adcValueForMeasurement;
            } else { minAdcValue = ADC_MAX_VALUE; maxAdcValue = 0; }

            var triggerSourceAdc = initialAdcValue;
            if (activeChannel1) triggerSourceAdc = adcValCh1; else if (activeChannel2) triggerSourceAdc = adcValCh2;
            var currentTriggerLevel = triggerLevelAdc;

            if(readyForNextTrigger){
                var triggerOccurred = false;
                if(triggerEdge == 1){ if(triggerSourceAdc > currentTriggerLevel && lastTriggerStateAdc <= currentTriggerLevel) triggerOccurred = true; }
                else { if(triggerSourceAdc < currentTriggerLevel && lastTriggerStateAdc >= currentTriggerLevel) triggerOccurred = true; }
                if(triggerOccurred && (activeChannel1 || activeChannel2)){
                    if(samplesSinceTrigger > 2 && timeBase > 0){ measuredFreq = 1000.0 / (samplesSinceTrigger * timeBase); triggeredThisSweep = true; }
                    samplesSinceTrigger = 0; readyForNextTrigger = false;
                }
            }
            if(!readyForNextTrigger && (activeChannel1 || activeChannel2)){
                var hysteresisValue = ADC_MAX_VALUE * 0.02;
                if(triggerEdge == 1){ if(triggerSourceAdc < currentTriggerLevel - hysteresisValue) readyForNextTrigger = true; }
                else { if(triggerSourceAdc > currentTriggerLevel + hysteresisValue) readyForNextTrigger = true; }
            } else if (!activeChannel1 && !activeChannel2) { readyForNextTrigger = true; measuredFreq = 0; }
            lastTriggerStateAdc = triggerSourceAdc;
            if(samplesSinceTrigger < (SCREEN_WIDTH * 100)) samplesSinceTrigger++;
            currentX++;

            if (headerNeedsUpdate) drawHeader("Oscilloscope"); 
            delay(timeBase > 0 ? timeBase : 1);
        }
        
        if (isPaused) {
            var pauseMsgText = "PAUSED";
            var pauseMsgWidth = pauseMsgText.length * CHAR_WIDTH_PX;
            var pauseMsgHeight = 10; 
            var pauseMsgX = Math.floor(SCREEN_WIDTH/2 - pauseMsgWidth/2);
            var pauseMsgY = graphAreaY + Math.floor(graphRenderHeight / 2) - (pauseMsgHeight / 2); 

            drawFillRect(pauseMsgX - 3, pauseMsgY - 2, pauseMsgWidth + 6, pauseMsgHeight + 4, COLOR_BACKGROUND);
            setTextSize(1); setTextColor(COLOR_PAUSED_TEXT);
            drawString(pauseMsgText, pauseMsgX, pauseMsgY);
            drawFooter("Resume(Pwr)", "Exit(Sel)", ""); // Footer hints updated
        } else {
            drawFooter("Pause(Pwr)", "Exit(Sel)", ""); // Footer hints updated
        }

        if (getSelPress()) { return; } // Exit Oscilloscope screen

        if (isPaused) {
            delay(50); 
        }
        // If not paused, delay is handled by timeBase inside the ADC loop.
        // If not drawing ADC, add small delay for button responsiveness if needed
        if (isPaused && !getSelPress() && !getPrevPress()) { 
            delay(20); // Small delay to keep UI responsive while paused and no buttons are pressed
        } else if (!isPaused) {
            // ADC loop has its own delay via timeBase
        } else { // Paused, but a button might have been processed, loop again quickly
            delay(1);
        }

    }
}


// === Program Entry Point ===
function main() {
    // pinMode for buttons are no longer needed as getPrevPress etc handle this.
    // pinMode(BTN_M5_SELECT_EXIT_PIN, INPUT_PULLUP); 
    // pinMode(BTN_NAV_UP_PIN, INPUT_PULLUP); 
    // pinMode(BTN_NAV_DOWN_PIN, INPUT_PULLUP);
    if (ENABLE_BATTERY_HEURISTIC_DETECTION && BATTERY_ADC_PIN >= 0) pinMode(BATTERY_ADC_PIN, INPUT);

    drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); setTextSize(1);
    setTextColor(COLOR_ACCENT); var welcomeMsg="M5Scope "+APP_VERSION; drawString(welcomeMsg, Math.floor(SCREEN_WIDTH/2-(welcomeMsg.length*CHAR_WIDTH_PX)/2), 10);
    setTextColor(COLOR_WARNING_TEXT); var warn1="MAX INPUT: "+ADC_REF_VOLTAGE.toFixed(1)+"V!"; var warn2="EXCEEDING WILL CAUSE DAMAGE!";
    drawString(warn1, Math.floor(SCREEN_WIDTH/2-(warn1.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2-20);
    drawString(warn2, Math.floor(SCREEN_WIDTH/2-(warn2.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2-5);
    setTextColor(COLOR_FOREGROUND); var author="by YahyaSvm & Takagi-1"; drawString(author, Math.floor(SCREEN_WIDTH/2-(author.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT-FOOTER_HEIGHT-10);
    delay(2000);

    mainLoop:
    while (true) {
        updateBatteryStateAndHandleAdvisory();
        var menuSelection = mainMenu();
        if (menuSelection == 0) { 
            if (ENABLE_USB_DETECTION && isUsbChargingDetected()) showUsbWarningAndBlock();
            else { oscilloscopeScreen(); forceRedrawCurrentScreen = true; }
        } else if (menuSelection == 1) { settingsMenu(); forceRedrawCurrentScreen = true;
        } else if (menuSelection == 2) { aboutScreen(); forceRedrawCurrentScreen = true;
        } else if (menuSelection == 3) { safetyInfoScreen(); forceRedrawCurrentScreen = true;
        } else if (menuSelection == 4) { 
            drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); updateBatteryStateAndHandleAdvisory(); drawHeader("Exiting to Bruce");
            setTextSize(1); setTextColor(COLOR_FOREGROUND); var msg1 = "Returning to Bruce OS...";
            drawString(msg1, Math.floor(SCREEN_WIDTH/2-(msg1.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2 - 5);
            delay(1500); break mainLoop;
        }
    }
    drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND);
}

main();
