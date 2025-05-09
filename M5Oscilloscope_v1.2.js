var SCREEN_WIDTH = width();
var SCREEN_HEIGHT = height();
var APP_VERSION = "v1.2"; // Increment version

var ADC_REF_VOLTAGE = 3.3;
var ADC_MAX_VALUE = 4095; // Assuming 12-bit ADC
var NUM_VERT_DIVS = 6;
var NUM_HORZ_DIVS = 8;
var CHAR_WIDTH_PX = 6; // Approximate width of a standard font character in pixels

// === M5STACK BUTTON PINS === (Verify for your model and Bruce Firmware)
// M5Stack Basic/Gray/Fire buttons are typically 37, 38, 39.
// Bruce maps these differently in some configurations. 37=Select/A, 35=Up/B, 39=Down/C seems common.
// VERIFY THIS ON YOUR DEVICE IF BUTTONS AREN'T RESPONDING!
var BTN_M5_SELECT_EXIT_PIN = 37; // Typically M5's Button A
var BTN_NAV_UP_PIN = 35;       // Typically M5's Button B
var BTN_NAV_DOWN_PIN = 39;     // Typically M5's Button C

// ADC Input Pins
// These are typically GPIO pins capable of ADC readings.
var CH1_PIN = 32;
var CH2_PIN = 33;

// === USB/Charging Detection Heuristic ===
// This code tries to detect if the device might be connected to USB power,
// as this can interfere with sensitive analog measurements on some M5Stack models.
// IT DOES NOT DIRECTLY DETECT CHARGING OR VBUS PRESENCE RELIABLY ON ALL HARDWARE.
// It works by checking if a disconnected ADC pin (CH1_PIN) reads a high value,
// which might happen due to charging circuitry interaction when no probe is attached.
// If detected, it warns the user and prevents entering the oscilloscope screen.
// Adjust USB_DETECT_THRESHOLD_ADC if needed for your specific hardware.
var ENABLE_USB_DETECTION = true; // Set to 'false' to disable this check entirely
var USB_DETECT_PIN = CH1_PIN; // The pin to check for high voltage (e.g., CH1 or CH2 pin)
// Threshold for detection: ADC value must be consistently ABOVE this to trigger warning.
// ADC_MAX_VALUE * 0.8 means > ~2.64V for a 3.3V reference.
var USB_DETECT_THRESHOLD_ADC = ADC_MAX_VALUE * 0.8;
var USB_DETECT_READ_COUNT = 10; // Number of readings to average/check
var USB_DETECT_READ_DELAY = 5; // Delay in ms between detection readings

// === UI Element Dimensions & Colors ===
var HEADER_HEIGHT = 18; var FOOTER_HEIGHT = 18; var INFO_BAR_HEIGHT = 15;
var COLOR_BACKGROUND = color(0,0,0); var COLOR_FOREGROUND = color(200,200,200);
var COLOR_ACCENT = color(0,120,200); var COLOR_GRID_DARK = color(30,30,30);
var COLOR_GRID_LIGHT = color(50,50,50); var COLOR_CH1 = color(255,60,60);
var COLOR_CH2 = color(60,200,60); var COLOR_WARNING_TEXT = color(255,100,0);

// === Application Settings (Variables) ===
// Note: These variables store the *current* setting, derived from the index into the values array.
var timeBaseValues = [2,5,10,20,50,100,200,500]; // Time per pixel in milliseconds
var timeBaseIndex = 3; // Default: 20ms/px
var timeBase = timeBaseValues[timeBaseIndex]; // Calculated timeBase value

var voltsPerDivValues = [0.2,0.5,1.0,1.5,2.0,2.5,3.0]; // Volts per vertical division
var voltsPerDivIndex = 2; // Default: 1.0V/Div
var voltsPerDiv = voltsPerDivValues[voltsPerDivIndex]; // Calculated voltsPerDiv value

var activeChannel1 = true;
var activeChannel2 = false;
var measureChannel = 1; // Channel used for Vpp and Freq measurements (1 or 2)

// Basic Trigger settings - currently fixed, could be added to settings menu
var triggerLevelAdc = ADC_MAX_VALUE/2; // ADC value for trigger level (approx 1.65V for 3.3V ref)
var triggerEdge = 1; // 1 for rising, 0 for falling

// Removed showUsbVoltageOnScope as USB reading is removed

// === Helper Function for USB/Charging Detection (Heuristic) ===
// Returns true if USB/Charging is likely detected based on ADC pin state.
// THIS IS A HEURISTIC AND MAY NOT BE RELIABLE ON ALL HARDWARE.
function isUsbChargingDetected() {
    if (!ENABLE_USB_DETECTION || USB_DETECT_PIN < 0 || typeof analogRead !== 'function') {
        return false; // Detection disabled or not configured/possible
    }

    var highCount = 0;
    for (var i = 0; i < USB_DETECT_READ_COUNT; i++) {
        var adcVal = analogRead(USB_DETECT_PIN);
        if (adcVal !== null && !isNaN(adcVal) && adcVal > USB_DETECT_THRESHOLD_ADC) {
            highCount++;
        }
        delay(USB_DETECT_READ_DELAY);
    }

    // Consider it detected if a majority of readings were high
    return highCount > (USB_DETECT_READ_COUNT / 2);
}

// === UI Helper Functions ===
function drawHeader(title) {
  drawFillRect(0,0,SCREEN_WIDTH,HEADER_HEIGHT,COLOR_ACCENT); setTextSize(1); setTextColor(color(255,255,255));
  var titleDisplayWidth = title.length * CHAR_WIDTH_PX;
  drawString(title, Math.floor(SCREEN_WIDTH/2 - titleDisplayWidth/2), 4); setTextColor(COLOR_FOREGROUND);
}
function drawFooter(hintNavUp, hintSelectExit, hintNavDown) {
  drawFillRect(0,SCREEN_HEIGHT - FOOTER_HEIGHT, SCREEN_WIDTH, FOOTER_HEIGHT, color(25,25,25));
  setTextSize(1); setTextColor(COLOR_FOREGROUND); var yPos = SCREEN_HEIGHT - FOOTER_HEIGHT + 5;
  if(hintNavUp) drawString(hintNavUp, 5, yPos);
  if(hintSelectExit) {
    var selectWidth = hintSelectExit.length * CHAR_WIDTH_PX;
    drawString(hintSelectExit, Math.floor(SCREEN_WIDTH/2 - selectWidth/2), yPos);
  }
  if(hintNavDown) {
    var downWidth = hintNavDown.length * CHAR_WIDTH_PX;
    drawString(hintNavDown, SCREEN_WIDTH - downWidth - 10, yPos);
  }
}
// Helper to draw a single menu item, handling selection and visibility
function drawScrollableMenuItem(text, index, selectedIndex, viewTopIndex, yOffset, itemHeight, itemAreaHeight) {
    var itemPadding = 3;
    // Calculate vertical position only if it could potentially be visible
    var displayY = yOffset + ((index - viewTopIndex) * itemHeight);

    // Check if the item is within the visible display area
    // Adding a small buffer (+ itemHeight) to ensure partially visible items are drawn correctly
    if (displayY >= yOffset - itemHeight && displayY < yOffset + itemAreaHeight) {
        // Clear the specific item area before drawing it
        // This helps prevent drawing artifacts when items scroll
        drawFillRect(0, displayY - itemPadding, SCREEN_WIDTH, itemHeight + (itemPadding*2) -1 , COLOR_BACKGROUND);

        setTextSize(1);
        if (index === selectedIndex) {
            // Draw highlight box behind selected item text
            drawFillRect(5, displayY - itemPadding, SCREEN_WIDTH - 10, itemHeight + (itemPadding*2) - 2 , color(40,50,70));
            setTextColor(COLOR_ACCENT);
            drawString(">" + text, 10, displayY);
        } else {
            setTextColor(COLOR_FOREGROUND);
            drawString(" " + text, 10, displayY);
        }
        setTextColor(COLOR_FOREGROUND); // Reset color for subsequent draws
    }
}

// === USB Warning Screen ===
function showUsbWarningAndBlock() {
    drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, COLOR_BACKGROUND);
    drawHeader("WARNING");
    setTextSize(1);
    setTextColor(COLOR_WARNING_TEXT);

    var warnings = [
        "USB/Charging detected.",
        "Disconnect USB power",
        "before using the",
        "oscilloscope.",
        "",
        "USB power can cause",
        "noisy measurements.",
        "DISCONNECT USB CABLE!"
    ];

    var yPos = HEADER_HEIGHT + 10;
    var lineHeight = 12;
    for (var i = 0; i < warnings.length; i++) {
        var line = warnings[i];
        var lineWidth = line.length * CHAR_WIDTH_PX;
        drawString(line, Math.floor(SCREEN_WIDTH / 2 - lineWidth / 2), yPos + i * lineHeight);
    }

    drawFooter("", "Press Any Button", ""); // Hint to exit

    // Wait for any button press to return to the menu
    while (digitalRead(BTN_M5_SELECT_EXIT_PIN) && digitalRead(BTN_NAV_UP_PIN) && digitalRead(BTN_NAV_DOWN_PIN)) {
        delay(50);
    }
    delay(200); // Debounce
     drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, COLOR_BACKGROUND); // Clear screen after button press
}


// === Settings Menu ===
function settingsMenu() {
  var selectedIndex = 0; var viewTopIndex = 0;
  var menuItemHeight = 16; var menuDisplayAreaY = HEADER_HEIGHT + 5;
  var menuDisplayAreaHeight = SCREEN_HEIGHT - menuDisplayAreaY - FOOTER_HEIGHT - 5;
  var maxVisibleItems = Math.floor(menuDisplayAreaHeight / menuItemHeight);
  var menuStructure = [
    { name: "Time/Px", getVal: function(){return timeBaseValues[timeBaseIndex] + "ms";}, action: function(){timeBaseIndex=(timeBaseIndex+1)%timeBaseValues.length; timeBase=timeBaseValues[timeBaseIndex];}},
    { name: "V/Div", getVal: function(){return voltsPerDivValues[voltsPerDivIndex].toFixed(1)+"V";}, action: function(){voltsPerDivIndex=(voltsPerDivIndex+1)%voltsPerDivValues.length; voltsPerDiv=voltsPerDivValues[voltsPerDivIndex];}},
    { name: "CH1", getVal: function(){return activeChannel1?"On":"Off";}, action: function(){activeChannel1=!activeChannel1;}},
    { name: "CH2", getVal: function(){return activeChannel2?"On":"Off";}, action: function(){activeChannel2=!activeChannel2;}},
    { name: "Meas.Ch", getVal: function(){return "CH"+measureChannel;}, action: function(){measureChannel=(measureChannel%2)+1; if(!activeChannel1 && !activeChannel2) measureChannel=1;}}, // Prevent selecting a channel that's off unless both are off
    { name: "TrigEdge", getVal: function(){return triggerEdge==1?"Rise":"Fall";}, action: function(){triggerEdge=1-triggerEdge;}}, // Simple toggle for edge
    // Removed USB V Read setting
    { name: "Back", getVal: function(){return "";}, action: "EXIT_MENU" }
  ];

  var redrawScreen = true; // Flag to indicate when the screen needs a full redraw (for flickering fix)

  while (true) {
    if (redrawScreen) {
        drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); // Clear background only on redraw
        drawHeader("Settings");
        // Redraw all potentially visible items
        for (var i=0; i<menuStructure.length; i++) {
          var itemText = menuStructure[i].name; var valueText = menuStructure[i].getVal();
          if (valueText) itemText += ": " + valueText;
          // Truncate long text if necessary
          if (itemText.length*CHAR_WIDTH_PX > SCREEN_WIDTH-25) itemText = itemText.substring(0, Math.floor((SCREEN_WIDTH-25)/CHAR_WIDTH_PX)-1) + "..";
          drawScrollableMenuItem(itemText, i, selectedIndex, viewTopIndex, menuDisplayAreaY, menuItemHeight, menuDisplayAreaHeight);
        }
        drawFooter("Up", "Select/Do", "Down");
        redrawScreen = false; // Reset flag
    }

    delay(100); // Small delay to debounce and save power

    var prevSelectedIndex = selectedIndex;
    var prevViewTopIndex = viewTopIndex;

    // Handle button presses
    if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) {
      var currentItem = menuStructure[selectedIndex];
      if (currentItem.action === "EXIT_MENU") { delay(200); return; } // Exit this function
      else if (typeof currentItem.action === 'function') {
          currentItem.action(); // Perform the menu item's action
          // After action, adjust selected measurement channel if needed
          if ((currentItem.name === "CH1" || currentItem.name === "CH2") && measureChannel === 1 && !activeChannel1 && activeChannel2) {
             // If CH1 was just turned off and CH2 is on, and measurement was on CH1, switch measurement to CH2
             measureChannel = 2;
          } else if ((currentItem.name === "CH1" || currentItem.name === "CH2") && measureChannel === 2 && !activeChannel2 && activeChannel1) {
             // If CH2 was just turned off and CH1 is on, and measurement was on CH2, switch measurement to CH1
             measureChannel = 1;
          } else if (!activeChannel1 && !activeChannel2) {
             // If both are off, default measurement back to 1 (though it measures initialAdcValue)
             measureChannel = 1;
          }

          redrawScreen = true; // Action might change displayed value, force redraw
      }
      delay(200); // Debounce
    }
    if (!digitalRead(BTN_NAV_UP_PIN)) {
      selectedIndex = (selectedIndex - 1 + menuStructure.length) % menuStructure.length;
      // Adjust viewTopIndex for scrolling
      if (selectedIndex < viewTopIndex) { viewTopIndex = selectedIndex; }
      else if (selectedIndex >= viewTopIndex + maxVisibleItems) { /* Should not happen with UP, but defensive */ viewTopIndex = selectedIndex - maxVisibleItems + 1; }
      redrawScreen = true; // Index changed, force redraw
      delay(180); // Debounce
    }
    if (!digitalRead(BTN_NAV_DOWN_PIN)) {
      selectedIndex = (selectedIndex + 1) % menuStructure.length;
       // Adjust viewTopIndex for scrolling
      if (selectedIndex >= viewTopIndex + maxVisibleItems) { viewTopIndex = selectedIndex - maxVisibleItems + 1; }
      else if (selectedIndex < viewTopIndex) { /* Should not happen with DOWN, but defensive */ viewTopIndex = selectedIndex; }
      redrawScreen = true; // Index changed, force redraw
      delay(180); // Debounce
    }
  }
}

// === Main Menu ===
function mainMenu() {
  var selectedIndex = 0; var viewTopIndex = 0;
  var menuItemHeight = 20; var menuDisplayAreaY = HEADER_HEIGHT + 10;
  var menuDisplayAreaHeight = SCREEN_HEIGHT - menuDisplayAreaY - FOOTER_HEIGHT - 5;
  var maxVisibleItems = Math.floor(menuDisplayAreaHeight / menuItemHeight);
  var menuItems = [ "Oscilloscope", "Settings", "About", "Safety Info", "Exit to Bruce" ];

  var redrawScreen = true; // Flag to indicate when the screen needs a full redraw (for flickering fix)

  while (true) {
    if (redrawScreen) {
        drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); // Clear background only on redraw
        drawHeader("M5Scope " + APP_VERSION);
        // Redraw all potentially visible items
        for (var i=0; i<menuItems.length; i++) {
            var itemText = menuItems[i];
            // Truncate long text if necessary
            if (itemText.length*CHAR_WIDTH_PX > SCREEN_WIDTH-25) itemText = itemText.substring(0, Math.floor((SCREEN_WIDTH-25)/CHAR_WIDTH_PX)-1) + "..";
            drawScrollableMenuItem(itemText, i, selectedIndex, viewTopIndex, menuDisplayAreaY, menuItemHeight, menuDisplayAreaHeight);
        }
        drawFooter("Up", "Select", "Down");
        redrawScreen = false; // Reset flag
    }

    delay(100); // Small delay to debounce and save power

    var prevSelectedIndex = selectedIndex;
    var prevViewTopIndex = viewTopIndex;

    // Handle button presses
    if (!digitalRead(BTN_NAV_UP_PIN)) {
      selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
      // Adjust viewTopIndex for scrolling
      if (selectedIndex < viewTopIndex) { viewTopIndex = selectedIndex; }
      else if (selectedIndex >= viewTopIndex + maxVisibleItems) { /* Should not happen with UP */ viewTopIndex = selectedIndex - maxVisibleItems + 1; }
      redrawScreen = true; // Index changed, force redraw
      delay(180); // Debounce
    }
    if (!digitalRead(BTN_NAV_DOWN_PIN)) {
      selectedIndex = (selectedIndex + 1) % menuItems.length;
      // Adjust viewTopIndex for scrolling
      if (selectedIndex >= viewTopIndex + maxVisibleItems) { viewTopIndex = selectedIndex - maxVisibleItems + 1; }
       else if (selectedIndex < viewTopIndex) { /* Should not happen with DOWN */ viewTopIndex = selectedIndex; }
      redrawScreen = true; // Index changed, force redraw
      delay(180); // Debounce
    }
    if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) {
        delay(250); // Debounce
        return selectedIndex; // Return the selected menu item index
    }
  }
}

// === About Screen ===
function aboutScreen() {
    // About screen is static, draw once and wait for button press
    drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND);
    drawHeader("About M5Scope");
    setTextSize(1); setTextColor(COLOR_FOREGROUND);
    var textLines = [ "M5Scope "+APP_VERSION, "By YahyaSvm", "JS Oscilloscope", "github.com/", "YahyaSvm/", "M5Oscilloscope" ];
    var yPos = HEADER_HEIGHT + 10; var lineHeight = 12;
    for(var i=0; i<textLines.length; i++) {
        var line = textLines[i];
        if (line.length*CHAR_WIDTH_PX > SCREEN_WIDTH-10) line = line.substring(0, Math.floor((SCREEN_WIDTH-10)/CHAR_WIDTH_PX)-1) + "..";
        var lineWidth = line.length * CHAR_WIDTH_PX;
        drawString(line, Math.floor(SCREEN_WIDTH/2 - lineWidth/2), yPos + i*lineHeight);
    }
    drawFooter("", "Back", "");
    // Wait for select/exit button press
    while(digitalRead(BTN_M5_SELECT_EXIT_PIN)) { delay(50); }
    delay(200); // Debounce
}

// === Safety Information Screen (with scrolling) ===
function safetyInfoScreen() {
    var viewTopLine = 0; var lineHeight = 11;
    var textDisplayAreaY = HEADER_HEIGHT + 7;
    var textDisplayAreaHeight = SCREEN_HEIGHT - textDisplayAreaY - FOOTER_HEIGHT - 5;
    var maxVisibleLines = Math.floor(textDisplayAreaHeight / lineHeight);
    var warnings = [
        "HIGH VOLTAGE RISK!", "Max ADC input: 0-" + ADC_REF_VOLTAGE.toFixed(1) + "V.",
        "Exceeding WILL DAMAGE M5Stack.", "", "Use voltage dividers for",
        "higher voltages or AC.", "", "Verify ADC & Button pins.",
        "This is EXPERIMENTAL.", "Use at YOUR OWN RISK.", "Developer is not liable."
    ];

    var redrawScreen = true; // Flag for flickering fix

    while(true) {
        if (redrawScreen) {
            drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); // Clear background only on redraw
            drawHeader("SAFETY WARNINGS");
            setTextSize(1); setTextColor(COLOR_WARNING_TEXT);
            // Draw only visible lines
            for(var i = 0; i < warnings.length; i++) {
                var displayY = textDisplayAreaY + ((i - viewTopLine) * lineHeight);
                // Only draw if the line is within the visible area
                if (displayY >= textDisplayAreaY - lineHeight && displayY < textDisplayAreaY + textDisplayAreaHeight) {
                     // Clear line area before drawing - helps with smooth scrolling if drawScrollableMenuItem isn't used
                    drawFillRect(0, displayY, SCREEN_WIDTH, lineHeight, COLOR_BACKGROUND);
                    var line = warnings[i]; var lineWidth = line.length * CHAR_WIDTH_PX;
                    drawString(line, Math.floor(SCREEN_WIDTH/2 - lineWidth/2), displayY);
                }
            }
            setTextColor(COLOR_FOREGROUND); // Reset color
            drawFooter("Up", "Back", "Down");
            redrawScreen = false; // Reset flag
        }

        delay(100); // Small delay

        // Handle buttons
        if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) { delay(200); return; } // Exit screen
        if (!digitalRead(BTN_NAV_UP_PIN)) {
            var prevViewTopLine = viewTopLine;
            if (viewTopLine > 0) viewTopLine--;
            if (viewTopLine !== prevViewTopLine) redrawScreen = true; // Only redraw if scroll happened
            delay(150); // Debounce
        }
        if (!digitalRead(BTN_NAV_DOWN_PIN)) {
            var prevViewTopLine = viewTopLine;
            if (viewTopLine < warnings.length - maxVisibleLines) viewTopLine++;
             if (viewTopLine !== prevViewTopLine) redrawScreen = true; // Only redraw if scroll happened
            delay(150); // Debounce
        }
    }
}

// === Oscilloscope Function ===
// This function necessarily redraws constantly as it plots real-time data
function oscilloscopeScreen() {
  var graphOriginX = 1; // Start graph drawing slightly in from left edge
  var graphAreaY = HEADER_HEIGHT + INFO_BAR_HEIGHT;
  var graphRenderHeight = SCREEN_HEIGHT - graphAreaY - FOOTER_HEIGHT;
  var graphRenderWidth = SCREEN_WIDTH - (2*graphOriginX); // Use full width minus margins
  var currentX = graphOriginX; // Current X position for plotting
  var prevY1 = graphAreaY + graphRenderHeight/2; // Y position of the previous point for channel 1
  var prevY2 = graphAreaY + graphRenderHeight/2; // Y position of the previous point for channel 2

  // Variables for measurement (Vpp, Freq)
  var minAdcValue = ADC_MAX_VALUE, maxAdcValue = 0;
  var measuredFreq = 0;

  // Variables for triggering and frequency counting
  var samplesSinceTrigger = 0; // Number of samples collected since the last trigger event
  var lastTriggerStateAdc = triggerLevelAdc; // Previous ADC value of the trigger source
  var readyForNextTrigger = true; // Flag to indicate if the scope is waiting for a new trigger event
  var triggeredThisSweep = false; // Flag to indicate if a trigger occurred during the current sweep

  // Removed USB voltage display variables

  // Helper to convert ADC value to screen Y coordinate
  function adcToScreenY(adcValue){
    // Ensure adcValue is within bounds
    adcValue = Math.max(0, Math.min(ADC_MAX_VALUE, adcValue));
    // Convert ADC value to voltage (relative to 0V)
    var voltage = (adcValue / ADC_MAX_VALUE) * ADC_REF_VOLTAGE;
    // Calculate voltage relative to the center line (Vref/2)
    var voltageRelativeToCenter = voltage - (ADC_REF_VOLTAGE / 2);
    // Calculate total voltage range displayed vertically
    var totalVoltsOnScreen = voltsPerDiv * NUM_VERT_DIVS;
    // Calculate pixels per volt
    var pixelsPerVolt = graphRenderHeight / totalVoltsOnScreen;
    // Calculate Y position on the graph area relative to its top
    var yOnGraph = (graphRenderHeight / 2) - (voltageRelativeToCenter * pixelsPerVolt);
    // Calculate final screen Y coordinate
    var finalScreenY = graphAreaY + yOnGraph;

    // Clamp Y position to graph area boundaries
    if(finalScreenY < graphAreaY) finalScreenY = graphAreaY;
    if(finalScreenY >= graphAreaY + graphRenderHeight - 1) finalScreenY = graphAreaY + graphRenderHeight - 1; // -1 to stay within bounds

    return Math.floor(finalScreenY);
  }

  // Helper to draw the background grid
  function drawScopeGrid(){
    drawFillRect(graphOriginX,graphAreaY,graphRenderWidth,graphRenderHeight,COLOR_BACKGROUND); // Clear graph area
    var horzDivPixelWidth = graphRenderWidth / NUM_HORZ_DIVS;
    var vertDivPixelHeight = graphRenderHeight / NUM_VERT_DIVS;

    // Draw vertical grid lines
    for(var i = 0; i <= NUM_HORZ_DIVS; i++){
      var lineX = graphOriginX + Math.floor(i * horzDivPixelWidth);
      drawLine(lineX, graphAreaY, lineX, graphAreaY + graphRenderHeight, (i === NUM_HORZ_DIVS/2) ? COLOR_GRID_LIGHT : COLOR_GRID_DARK);
    }
    // Draw horizontal grid lines
    for(var j = 0; j <= NUM_VERT_DIVS; j++){
      var lineY = graphAreaY + Math.floor(j * vertDivPixelHeight);
      drawLine(graphOriginX, lineY, graphOriginX + graphRenderWidth, lineY, (j === NUM_VERT_DIVS/2) ? COLOR_GRID_LIGHT : COLOR_GRID_DARK);
    }
  }

  // Helper to draw the info bar (V/Div, Time/Div, Vpp, Freq)
  function printScopeInfo(){
    drawFillRect(0,HEADER_HEIGHT,SCREEN_WIDTH,INFO_BAR_HEIGHT,color(15,15,15)); // Clear info bar area
    setTextSize(1); setTextColor(COLOR_FOREGROUND);
    var infoY = HEADER_HEIGHT + 3; // Vertical position for text

    // Calculate Vpp
    var vppVolts = ((maxAdcValue - minAdcValue) / ADC_MAX_VALUE) * ADC_REF_VOLTAGE;
    if (vppVolts < 0.005 || maxAdcValue === 0 || minAdcValue === ADC_MAX_VALUE) vppVolts = 0; // Show 0 if no significant signal or no data yet

    // Format strings
    var vdivStr = voltsPerDiv.toFixed(1) + "V";
    // Adjust format based on value (ms or s)
    var tdivStrText = (timeBase < 1000) ? timeBase.toFixed(0)+"ms" : (timeBase/1000.0).toFixed(1)+"s";

    var vppStr = "Vpp:" + vppVolts.toFixed(1);
    // Format frequency (show --- if very low or very high/unstable)
    var hzStr = (measuredFreq > 0.1 && measuredFreq < 20000 ? measuredFreq.toFixed(0) : "---") + "Hz";

    // Draw V/Div (left aligned)
    drawString(vdivStr, 3, infoY);

    // Draw Time/Div (right aligned)
    var tdivWidth = tdivStrText.length * CHAR_WIDTH_PX;
    drawString(tdivStrText, SCREEN_WIDTH - tdivWidth - 3, infoY);


    // Draw Vpp and Freq (centered if space allows)
    var vppWidth = vppStr.length * CHAR_WIDTH_PX;
    var hzWidth = hzStr.length * CHAR_WIDTH_PX;
    var leftTaken = (vdivStr.length * CHAR_WIDTH_PX + 5);
    var rightTaken = (tdivStrText.length * CHAR_WIDTH_PX + 5) ;
    var availableMidSpace = SCREEN_WIDTH - leftTaken - rightTaken;

    // Check if both Vpp and Freq fit comfortably
    if(vppWidth + hzWidth + 10 < availableMidSpace){ // 10 is padding between Vpp and Freq
        var startX = Math.floor(leftTaken + (availableMidSpace - (vppWidth + hzWidth + 5))/2 ); // 5 is padding after Vpp
        drawString(vppStr, startX, infoY);
        drawString(hzStr, startX + vppWidth + 5, infoY);
    } else if (vppWidth < availableMidSpace) { // If not both, try Vpp alone
        drawString(vppStr, Math.floor(leftTaken + (availableMidSpace - vppWidth)/2 ), infoY);
    } else if (hzWidth < availableMidSpace) { // If not Vpp alone, try Freq alone
        drawString(hzStr, Math.floor(leftTaken + (availableMidSpace - hzWidth)/2 ), infoY);
    }
    // If none fit, mid-section is empty. This is fine.
  }

  // --- Oscilloscope Main Loop ---
  drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); // Clear screen once before starting scope
  drawHeader("Oscilloscope");
  drawScopeGrid(); // Draw grid initially
  printScopeInfo(); // Draw info bar initially
  drawFooter("", "Exit", ""); // Draw footer initially

  // Initialize plot position and previous points
  initialAdcValue = ADC_MAX_VALUE/2; // Start plot from center vertically
  prevY1 = adcToScreenY(initialAdcValue);
  prevY2 = adcToScreenY(initialAdcValue);
  currentX = graphOriginX; // Start from the left edge of the graph area

  while (true) {
    // Check Exit Button
    if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) { delay(200); return; }

    // --- Read ADC Channels ---
    var adcValCh1 = analogRead(CH1_PIN);
    // If CH2 is off, its ADC reading is not used, but we set a default for plotting purposes
    var adcValCh2 = activeChannel2 ? analogRead(CH2_PIN) : initialAdcValue;

    // Check if analogRead returned valid numbers before proceeding
    if (adcValCh1 === null || isNaN(adcValCh1) || (activeChannel2 && (adcValCh2 === null || isNaN(adcValCh2)))) {
        // Handle ADC read error - maybe display an error message or skip this frame
        // For now, just skip this frame to prevent errors
        print("ADC read failed!"); // For Bruce console debugging
        delay(timeBase); // Wait for the frame duration
        continue; // Skip the rest of the loop iteration
    }


    // Convert ADC values to screen coordinates
    var screenYCh1 = adcToScreenY(adcValCh1);
    // If CH2 is off, its plot stays at the center line
    var screenYCh2 = activeChannel2 ? adcToScreenY(adcValCh2) : adcToScreenY(initialAdcValue);

    // --- Drawing Logic ---
    // If we've reached the end of the screen, start a new sweep
    if(currentX >= graphOriginX + graphRenderWidth) {
        currentX = graphOriginX; // Reset X position
        drawScopeGrid(); // Clear the old trace by redrawing the grid
        printScopeInfo(); // Update info bar (esp. measurements)
        minAdcValue = ADC_MAX_VALUE; // Reset min/max for new sweep
        maxAdcValue = 0;
        if(!triggeredThisSweep && measuredFreq > 0) measuredFreq = 0; // If no trigger occurred, freq is invalid
        triggeredThisSweep = false; // Reset trigger flag for new sweep
        readyForNextTrigger = true; // Reset trigger ready state for new sweep
         // Initialize previous points to the center or first sample for smooth start
        prevY1 = adcToScreenY(adcValCh1); // Use actual first sample for smooth start
        prevY2 = activeChannel2 ? adcToScreenY(adcValCh2) : adcToScreenY(initialAdcValue);
    }

    // Draw the line segment from the previous point to the current point
    // Only draw if we are past the starting X position
    if(currentX > graphOriginX){
        if(activeChannel1) drawLine(currentX-1, prevY1, currentX, screenYCh1, COLOR_CH1);
        if(activeChannel2) drawLine(currentX-1, prevY2, currentX, screenYCh2, COLOR_CH2);
    } else { // At the very beginning of the sweep (currentX === graphOriginX)
        // Just update prevY to the current sample without drawing a line yet
         prevY1 = screenYCh1;
         prevY2 = screenYCh2;
    }

    // Update previous Y coordinates for the next step
    prevY1 = screenYCh1;
    prevY2 = screenYCh2;

    // --- Measurement (Vpp) ---
    // Determine the ADC value to use for Vpp/Freq measurement.
    // Prefer the selected measureChannel if it's active.
    // Fallback to the *first active channel* if the selected measureChannel is off.
    // If both are off, measure the initial center value (will result in 0 Vpp).
    var adcValueForMeasurement = initialAdcValue; // Default if both off
    if (measureChannel === 1 && activeChannel1) {
         adcValueForMeasurement = adcValCh1;
    } else if (measureChannel === 2 && activeChannel2) {
         adcValueForMeasurement = adcValCh2;
    } else if (activeChannel1) { // Selected channel is off, but CH1 is on
         adcValueForMeasurement = adcValCh1;
         measureChannel = 1; // Auto-switch measure channel? Maybe not, keep user setting. Just measure CH1.
    } else if (activeChannel2) { // Selected channel is off, but CH2 is on
         adcValueForMeasurement = adcValCh2;
         measureChannel = 2; // Auto-switch measure channel? Just measure CH2.
    }
    // Note: The setting in the menu will still show the user's choice,
    // but the measurement here uses an active channel if the chosen one is off.
    // This is a pragmatic approach. The menu setting might need a visual indicator
    // if the selected channel is off, but that's more complex UI.

    // Update min/max ADC values for Vpp calculation *only if at least one channel is active*
    if (activeChannel1 || activeChannel2) {
         if (adcValueForMeasurement > maxAdcValue) maxAdcValue = adcValueForMeasurement;
         if (adcValueForMeasurement < minAdcValue) minAdcValue = adcValueForMeasurement;
    } else {
         // If both channels are off, reset min/max to indicate no valid measurement
         minAdcValue = ADC_MAX_VALUE;
         maxAdcValue = 0;
    }


    // --- Simple Edge Triggering and Frequency Counting ---
    // Determine the ADC source for triggering.
    // Default to CH1 if active, then CH2 if CH1 is off and CH2 is active.
    // If both off, triggering is effectively disabled (always triggers or never triggers depending on level).
    var triggerSourceAdc = initialAdcValue; // Default if both channels off
    if (activeChannel1) triggerSourceAdc = adcValCh1;
    else if (activeChannel2) triggerSourceAdc = adcValCh2;

    var currentTriggerLevel = triggerLevelAdc; // Get current trigger level (fixed for now)

    // Check for trigger event if ready
    if(readyForNextTrigger){
        var triggerOccurred = false;
        // Rising edge trigger: current sample crosses *above* level and previous was *at or below*
        if(triggerEdge == 1){
            if(triggerSourceAdc > currentTriggerLevel && lastTriggerStateAdc <= currentTriggerLevel) {
                triggerOccurred = true;
            }
        }
        // Falling edge trigger: current sample crosses *below* level and previous was *at or above*
        else { // triggerEdge == 0
            if(triggerSourceAdc < currentTriggerLevel && lastTriggerStateAdc >= currentTriggerLevel) {
                triggerOccurred = true;
            }
        }

        // If trigger occurred, calculate frequency and reset counters
        // Only calculate frequency if at least one channel is active
        if(triggerOccurred && (activeChannel1 || activeChannel2)){
            // Only update frequency if we've counted more than a few samples (avoids false triggers on noise)
            if(samplesSinceTrigger > 2 && timeBase > 0){ // timeBase is in ms/px, samplesSinceTrigger is pixels
                 // Frequency (Hz) = 1000 / (samplesSinceTrigger * timeBase)
                measuredFreq = 1000.0 / (samplesSinceTrigger * timeBase);
                triggeredThisSweep = true; // Mark that a trigger happened in this sweep
            }
            samplesSinceTrigger = 0; // Reset sample counter after trigger
            readyForNextTrigger = false; // Wait for trigger source to move away from level + hysteresis before being ready again
        }
    }

    // Reset readyForNextTrigger state using hysteresis
    // Only apply hysteresis logic if at least one channel is active (i.e., triggering is meaningful)
    if(!readyForNextTrigger && (activeChannel1 || activeChannel2)){
        var hysteresisValue = ADC_MAX_VALUE * 0.02; // 2% hysteresis (adjust as needed)
        if(triggerEdge == 1){ // Rising edge trigger: need signal to drop below level - hysteresis
            if(triggerSourceAdc < currentTriggerLevel - hysteresisValue) readyForNextTrigger = true;
        } else { // Falling edge trigger: need signal to rise above level + hysteresis
            if(triggerSourceAdc > currentTriggerLevel + hysteresisValue) readyForNextTrigger = true;
        }
    } else if (!activeChannel1 && !activeChannel2) {
        // If both channels are off, always be ready for trigger (it will trigger based on initialAdcValue, which is constant)
        readyForNextTrigger = true;
        measuredFreq = 0; // No signal means no frequency
    }


    // Update last trigger state for the next sample comparison
    lastTriggerStateAdc = triggerSourceAdc;

    // Increment sample counter (pixels plotted)
    // Stop counting if it gets excessively large (prevents overflow, although unlikely here)
    if(samplesSinceTrigger < (SCREEN_WIDTH * 100)) samplesSinceTrigger++;


    // --- Advance Plot Position ---
    currentX++; // Move to the next pixel column

    // --- Wait for next sample ---
    // The delay determines the horizontal scale (time per pixel)
    delay(timeBase);
  }
}

// === Program Entry Point ===
function main() {
  // Configure button pins as inputs with pull-ups (common for buttons)
  pinMode(BTN_M5_SELECT_EXIT_PIN, INPUT_PULLUP);
  pinMode(BTN_NAV_UP_PIN, INPUT_PULLUP);
  pinMode(BTN_NAV_DOWN_PIN, INPUT_PULLUP);

  // Initial Welcome Screen
  drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND);
  setTextSize(1);
  setTextColor(COLOR_ACCENT); var welcomeMsg="M5Scope "+APP_VERSION;
  drawString(welcomeMsg, Math.floor(SCREEN_WIDTH/2-(welcomeMsg.length*CHAR_WIDTH_PX)/2), 10);
  setTextColor(COLOR_WARNING_TEXT); var warn1="MAX INPUT: "+ADC_REF_VOLTAGE.toFixed(1)+"V!";
  var warn2="EXCEEDING WILL CAUSE DAMAGE!";
  drawString(warn1, Math.floor(SCREEN_WIDTH/2-(warn1.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2-20);
  drawString(warn2, Math.floor(SCREEN_WIDTH/2-(warn2.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2-5);
  setTextColor(COLOR_FOREGROUND); var author="by YahyaSvm";
  drawString(author, Math.floor(SCREEN_WIDTH/2-(author.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT-FOOTER_HEIGHT-10);
  delay(3500); // Show welcome screen for a few seconds

  mainLoop: // Label the main application loop
  while (true) {
    // Show the main menu and get the user's selection
    var menuSelection = mainMenu();

    // Act based on menu selection
    if (menuSelection == 0) { // Oscilloscope selected
        // Perform the USB detection check before starting the scope
        if (ENABLE_USB_DETECTION && isUsbChargingDetected()) {
            showUsbWarningAndBlock(); // Show warning and wait for button press
            // After warning, the loop continues to show the main menu again
        } else {
            // If USB not detected (or detection disabled), proceed to oscilloscope
            oscilloscopeScreen();
        }
    } else if (menuSelection == 1) {
        settingsMenu(); // Enter the settings menu
    } else if (menuSelection == 2) {
        aboutScreen(); // Show the about screen
    } else if (menuSelection == 3) {
        safetyInfoScreen(); // Show safety info
    } else if (menuSelection == 4) { // Exit to Bruce was selected
      drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); // Clear screen
      drawHeader("Exiting to Bruce"); // Use consistent header
      setTextSize(1); setTextColor(COLOR_FOREGROUND);
      var msg1 = "Returning to Bruce OS...";
      drawString(msg1, Math.floor(SCREEN_WIDTH/2-(msg1.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2 - 5);
      delay(1500); // Show message briefly
      break mainLoop; // Exit the main while loop, ending the script
    }
    // After returning from a screen (oscilloscope, settings, etc.), the loop continues
    // and mainMenu() is called again, unless Exit was selected.
  }

  // Code here runs after the mainLoop is exited (i.e., Exit to Bruce was selected)
  // Clear screen one last time before the script finishes and Bruce takes over.
  drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND);
  setTextSize(1); setTextColor(COLOR_FOREGROUND);
  // Optional: Draw a final message
  // drawString("M5Scope script finished.", 10, 10);

  // Script execution ends here. Bruce OS should regain control.
  // No special exit() function is typically needed in Bruce JS.
}

// Start the application
main();