// Developed by YahyaSvm

// === IMPORTANT WARNINGS === 
// * HIGH VOLTAGE RISK: NEVER connect signals exceeding the M5Stack's ADC input voltage limits
//   (typically 0V to 3.3V or specified by your ADC pin). Doing so WILL PERMANENTLY DAMAGE YOUR M5STACK.
// * EXTERNAL CIRCUITRY: For measuring voltages higher than ADC limits or AC signals,
//   use appropriate voltage divider and/or clamping/protection circuits.
// * ADC PINS: Ensure CH1_PIN and CH2_PIN are ADC-capable pins on your M5Stack model.
// * BUTTON PINS: Verify BTN_M5_SELECT_EXIT_PIN, BTN_NAV_UP_PIN, BTN_NAV_DOWN_PIN.
// * BETA SOFTWARE: This is experimental software. Use at your own risk.

// === Global Constants and Settings ===
var SCREEN_WIDTH = width();
var SCREEN_HEIGHT = height();
var APP_VERSION = "v1.0"; 

var ADC_REF_VOLTAGE = 3.3;
var ADC_MAX_VALUE = 4095;
var NUM_VERT_DIVS = 6;
var NUM_HORZ_DIVS = 8;
var CHAR_WIDTH_PX = 6;

// === M5STACK BUTTON PINS 
var BTN_M5_SELECT_EXIT_PIN = 37;
var BTN_NAV_UP_PIN = 35;
var BTN_NAV_DOWN_PIN = 39;

// ADC Input Pins
var CH1_PIN = 32;
var CH2_PIN = 33;

// UI Element Dimensions & Colors (Same as before)
var HEADER_HEIGHT = 18; var FOOTER_HEIGHT = 18; var INFO_BAR_HEIGHT = 15;
var COLOR_BACKGROUND = color(0,0,0); var COLOR_FOREGROUND = color(200,200,200);
var COLOR_ACCENT = color(0,120,200); var COLOR_GRID_DARK = color(30,30,30);
var COLOR_GRID_LIGHT = color(50,50,50); var COLOR_CH1 = color(255,60,60);
var COLOR_CH2 = color(60,200,60); var COLOR_WARNING_TEXT = color(255,100,0);

// === Application Settings (Variables) === (Same as before)
var timeBaseValues = [2,5,10,20,50,100]; var timeBaseIndex = 2; var timeBase = timeBaseValues[timeBaseIndex];
var voltsPerDivValues = [0.2,0.5,1.0,1.5]; var voltsPerDivIndex = 1; var voltsPerDiv = voltsPerDivValues[voltsPerDivIndex];
var activeChannel1 = true; var activeChannel2 = false; var measureChannel = 1;
var triggerLevelAdc = ADC_MAX_VALUE/2; var triggerEdge = 1;

// === UI Helper Functions ===
function drawHeader(title) { /* ... same ... */
  drawFillRect(0,0,SCREEN_WIDTH,HEADER_HEIGHT,COLOR_ACCENT); setTextSize(1); setTextColor(color(255,255,255));
  var titleDisplayWidth = title.length * CHAR_WIDTH_PX;
  drawString(title, Math.floor(SCREEN_WIDTH/2 - titleDisplayWidth/2), 4); setTextColor(COLOR_FOREGROUND);
}
function drawFooter(hintNavUp, hintSelectExit, hintNavDown) { /* ... same ... */
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
function drawScrollableMenuItem(text, index, selectedIndex, viewTopIndex, yOffset, itemHeight, itemAreaHeight) { /* ... same ... */
  setTextSize(1); var itemPadding = 3;
  var displayY = yOffset + ((index - viewTopIndex) * itemHeight);
  if (displayY >= yOffset && displayY < yOffset + itemAreaHeight - itemHeight/2) {
    if (index === selectedIndex) {
      drawFillRect(5, displayY - itemPadding, SCREEN_WIDTH - 10, itemHeight + (itemPadding*2) -2 , color(40,50,70));
      setTextColor(COLOR_ACCENT); drawString(">" + text, 10, displayY);
    } else {
      setTextColor(COLOR_FOREGROUND); drawString(" " + text, 10, displayY);
    }
    setTextColor(COLOR_FOREGROUND);
  }
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
    { name: "Meas.Ch", getVal: function(){return "CH"+measureChannel;}, action: function(){measureChannel=(measureChannel%2)+1;}},
    { name: "TrigEdge", getVal: function(){return triggerEdge==1?"Rise":"Fall";}, action: function(){triggerEdge=1-triggerEdge;}},
    { name: "Back", getVal: function(){return "";}, action: "EXIT_MENU" } // Explicit Back item
  ];

  while (true) {
    drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("Settings");
    for (var i=0; i<menuStructure.length; i++) {
      var itemText = menuStructure[i].name; var valueText = menuStructure[i].getVal();
      if (valueText) itemText += ": " + valueText;
      if (itemText.length*CHAR_WIDTH_PX > SCREEN_WIDTH-25) itemText = itemText.substring(0, Math.floor((SCREEN_WIDTH-25)/CHAR_WIDTH_PX)-1) + "..";
      drawScrollableMenuItem(itemText, i, selectedIndex, viewTopIndex, menuDisplayAreaY, menuItemHeight, menuDisplayAreaHeight);
    }
    drawFooter("Up", "Select/Do", "Down"); // Top: Up, M5: Select/Do Action, Bottom: Down
    delay(100);

    if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) { // M5 Button: Select / Do Action (including Exit for "Back")
      var currentItem = menuStructure[selectedIndex];
      if (currentItem.action === "EXIT_MENU") {
        delay(200); return; // Exit to main menu
      } else if (typeof currentItem.action === 'function') {
        currentItem.action(); // Perform the setting change
      }
      delay(200);
    }
    if (!digitalRead(BTN_NAV_UP_PIN)) { // Top Button: Previous Item
      selectedIndex = (selectedIndex - 1 + menuStructure.length) % menuStructure.length;
      if (selectedIndex === menuStructure.length - 1) { // Wrapped to bottom from top
          viewTopIndex = Math.max(0, selectedIndex - maxVisibleItems + 1);
      } else if (selectedIndex < viewTopIndex) { // Scrolled past top visible item
          viewTopIndex = selectedIndex;
      }
      delay(180);
    }
    if (!digitalRead(BTN_NAV_DOWN_PIN)) { // Bottom Button: Next Item
      selectedIndex = (selectedIndex + 1) % menuStructure.length;
      if (selectedIndex === 0) { // Wrapped to top from bottom
          viewTopIndex = 0;
      } else if (selectedIndex >= viewTopIndex + maxVisibleItems) { // Scrolled past bottom visible item
          viewTopIndex = selectedIndex - maxVisibleItems + 1;
      }
      delay(180);
    }
  }
}

// === Main Menu ===
function mainMenu() {
  var selectedIndex = 0; var viewTopIndex = 0;
  var menuItemHeight = 20; var menuDisplayAreaY = HEADER_HEIGHT + 10;
  var menuDisplayAreaHeight = SCREEN_HEIGHT - menuDisplayAreaY - FOOTER_HEIGHT - 5;
  var maxVisibleItems = Math.floor(menuDisplayAreaHeight / menuItemHeight);
  var menuItems = [ "Oscilloscope", "Settings", "About", "Safety Info", "Exit App" ];

  while (true) {
    drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("M5Scope " + APP_VERSION);
    for (var i=0; i<menuItems.length; i++) {
        drawScrollableMenuItem(menuItems[i], i, selectedIndex, viewTopIndex, menuDisplayAreaY, menuItemHeight, menuDisplayAreaHeight);
    }
    drawFooter("Up", "Select", "Down"); // M5 is purely Select here
    delay(100);

    if (!digitalRead(BTN_NAV_UP_PIN)) { // Top Button: Previous Item
      selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
      if (selectedIndex === menuItems.length - 1) {
          viewTopIndex = Math.max(0, selectedIndex - maxVisibleItems + 1);
      } else if (selectedIndex < viewTopIndex) {
          viewTopIndex = selectedIndex;
      }
      delay(180);
    }
    if (!digitalRead(BTN_NAV_DOWN_PIN)) { // Bottom Button: Next Item
      selectedIndex = (selectedIndex + 1) % menuItems.length;
      if (selectedIndex === 0) {
          viewTopIndex = 0;
      } else if (selectedIndex >= viewTopIndex + maxVisibleItems) {
          viewTopIndex = selectedIndex - maxVisibleItems + 1;
      }
      delay(180);
    }
    if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) { // M5 Button: Select
      delay(250); return selectedIndex;
    }
  }
}

// === About Screen ===
function aboutScreen() { /* M5 button for Exit */
    drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("About M5Scope");
    setTextSize(1); setTextColor(COLOR_FOREGROUND);
    var textLines = [ "M5Scope "+APP_VERSION, "By YahyaSvm", "JS Oscilloscope", "github.com/", "YahyaSvm/", "M5Oscilloscope" ];
    var yPos = HEADER_HEIGHT + 10; var lineHeight = 12;
    for(var i=0; i<textLines.length; i++) {
        var line = textLines[i];
        if (line.length*CHAR_WIDTH_PX > SCREEN_WIDTH-10) line = line.substring(0, Math.floor((SCREEN_WIDTH-10)/CHAR_WIDTH_PX)-1) + "..";
        var lineWidth = line.length * CHAR_WIDTH_PX;
        drawString(line, Math.floor(SCREEN_WIDTH/2 - lineWidth/2), yPos + i*lineHeight);
    }
    drawFooter("", "Back", ""); // M5 for Back
    while(digitalRead(BTN_M5_SELECT_EXIT_PIN)) { delay(50); }
    delay(200);
}

// === Safety Information Screen (with scrolling) ===
function safetyInfoScreen() { /* M5 button for Exit, Up/Down for scroll */
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

    while(true) {
        drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("SAFETY WARNINGS");
        setTextSize(1); setTextColor(COLOR_WARNING_TEXT);
        for(var i = 0; i < warnings.length; i++) {
            var displayY = textDisplayAreaY + ((i - viewTopLine) * lineHeight);
            if (displayY >= textDisplayAreaY && displayY < textDisplayAreaY + textDisplayAreaHeight - lineHeight/2) {
                var line = warnings[i]; var lineWidth = line.length * CHAR_WIDTH_PX;
                drawString(line, Math.floor(SCREEN_WIDTH/2 - lineWidth/2), displayY);
            }
        }
        setTextColor(COLOR_FOREGROUND); drawFooter("Up", "Back", "Down");
        delay(100);

        if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) { delay(200); return; }
        if (!digitalRead(BTN_NAV_UP_PIN)) {
            if (viewTopLine > 0) viewTopLine--;
            delay(150);
        }
        if (!digitalRead(BTN_NAV_DOWN_PIN)) {
            if (viewTopLine < warnings.length - maxVisibleLines) viewTopLine++;
            delay(150);
        }
    }
}

// === Oscilloscope Function ===
function oscilloscopeScreen() { /* M5 button for Exit */
  var graphOriginX = 1; var graphAreaY = HEADER_HEIGHT + INFO_BAR_HEIGHT;
  var graphRenderHeight = SCREEN_HEIGHT - graphAreaY - FOOTER_HEIGHT;
  var graphRenderWidth = SCREEN_WIDTH - (2*graphOriginX);
  var currentX = graphOriginX; var prevY1 = graphAreaY + graphRenderHeight/2; var prevY2 = graphAreaY + graphRenderHeight/2;
  var minAdcValue = ADC_MAX_VALUE, maxAdcValue = 0; var measuredFreq = 0;
  var samplesSinceTrigger = 0; var lastTriggerStateAdc = triggerLevelAdc;
  var readyForNextTrigger = true; var triggeredThisSweep = false;

  function adcToScreenY(adcValue){var voltage=(adcValue/ADC_MAX_VALUE)*ADC_REF_VOLTAGE; var voltageRelativeToCenter=voltage-(ADC_REF_VOLTAGE/2); var totalVoltsOnScreen=voltsPerDiv*NUM_VERT_DIVS; var pixelsPerVolt=graphRenderHeight/totalVoltsOnScreen; var yOnGraph=(graphRenderHeight/2)-(voltageRelativeToCenter*pixelsPerVolt); var finalScreenY=graphAreaY+yOnGraph; if(finalScreenY<graphAreaY)finalScreenY=graphAreaY; if(finalScreenY>=graphAreaY+graphRenderHeight-1)finalScreenY=graphAreaY+graphRenderHeight-1; return Math.floor(finalScreenY);}
  function drawScopeGrid(){drawFillRect(graphOriginX,graphAreaY,graphRenderWidth,graphRenderHeight,COLOR_BACKGROUND); var horzDivPixelWidth=graphRenderWidth/NUM_HORZ_DIVS; var vertDivPixelHeight=graphRenderHeight/NUM_VERT_DIVS; for(var i=0;i<=NUM_HORZ_DIVS;i++){var lineX=graphOriginX+Math.floor(i*horzDivPixelWidth); drawLine(lineX,graphAreaY,lineX,graphAreaY+graphRenderHeight,(i===NUM_HORZ_DIVS/2)?COLOR_GRID_LIGHT:COLOR_GRID_DARK);} for(var j=0;j<=NUM_VERT_DIVS;j++){var lineY=graphAreaY+Math.floor(j*vertDivPixelHeight); drawLine(graphOriginX,lineY,graphOriginX+graphRenderWidth,lineY,(j===NUM_VERT_DIVS/2)?COLOR_GRID_LIGHT:COLOR_GRID_DARK);}}
  function printScopeInfo(){drawFillRect(0,HEADER_HEIGHT,SCREEN_WIDTH,INFO_BAR_HEIGHT,color(15,15,15)); setTextSize(1); setTextColor(COLOR_FOREGROUND); var vppVolts=((maxAdcValue-minAdcValue)/ADC_MAX_VALUE)*ADC_REF_VOLTAGE; if(vppVolts<0.005||maxAdcValue===0||minAdcValue===ADC_MAX_VALUE)vppVolts=0; var infoY=HEADER_HEIGHT+3; var vdivStr=voltsPerDiv.toFixed(1)+"V"; var tdivStr=((graphRenderWidth/NUM_HORZ_DIVS)*timeBase).toFixed(0)+"ms"; drawString(vdivStr,3,infoY); var tdivWidth=tdivStr.length*CHAR_WIDTH_PX; drawString(tdivStr,SCREEN_WIDTH-tdivWidth-3,infoY); var vppStr="Vpp:"+vppVolts.toFixed(1); var hzStr=(measuredFreq>0.1&&measuredFreq<20000?measuredFreq.toFixed(0):"---")+"Hz"; var vppWidth=vppStr.length*CHAR_WIDTH_PX; var spaceForMidInfo=SCREEN_WIDTH-(vdivStr.length*CHAR_WIDTH_PX+5)-(tdivWidth+5); if(vppWidth+(hzStr.length*CHAR_WIDTH_PX)+10<spaceForMidInfo){drawString(vppStr,Math.floor(SCREEN_WIDTH/2-(vppWidth+(hzStr.length*CHAR_WIDTH_PX)+5)/2),infoY); drawString(hzStr,Math.floor(SCREEN_WIDTH/2-(vppWidth+(hzStr.length*CHAR_WIDTH_PX)+5)/2)+vppWidth+5,infoY);}else if(vppWidth<spaceForMidInfo){drawString(vppStr,Math.floor(SCREEN_WIDTH/2-vppWidth/2),infoY);}}

  drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("Oscilloscope");
  drawScopeGrid(); printScopeInfo(); drawFooter("", "Exit", "");

  var initialAdcValue = ADC_MAX_VALUE/2; prevY1=adcToScreenY(initialAdcValue); prevY2=adcToScreenY(initialAdcValue); currentX=graphOriginX;

  while (true) {
    if (!digitalRead(BTN_M5_SELECT_EXIT_PIN)) { delay(200); return; }
    var adcValCh1=analogRead(CH1_PIN); var adcValCh2=activeChannel2?analogRead(CH2_PIN):0; var screenYCh1=adcToScreenY(adcValCh1); var screenYCh2=activeChannel2?adcToScreenY(adcValCh2):graphAreaY+graphRenderHeight/2;
    if(currentX===graphOriginX){drawScopeGrid();printScopeInfo();minAdcValue=ADC_MAX_VALUE;maxAdcValue=0; if(!triggeredThisSweep&&measuredFreq>0)measuredFreq=0; triggeredThisSweep=false;}
    if(currentX>graphOriginX){if(activeChannel1)drawLine(currentX-1,prevY1,currentX,screenYCh1,COLOR_CH1); if(activeChannel2)drawLine(currentX-1,prevY2,currentX,screenYCh2,COLOR_CH2);}
    prevY1=screenYCh1;prevY2=screenYCh2; var adcValueForMeasurement=(measureChannel==1||!activeChannel2)?adcValCh1:adcValCh2; if((measureChannel==2&&!activeChannel2)&&activeChannel1)adcValueForMeasurement=adcValCh1; else if((measureChannel==1&&!activeChannel1)&&activeChannel2)adcValueForMeasurement=adcValCh2;
    if((measureChannel==1&&activeChannel1)||(measureChannel==2&&activeChannel2)){if(adcValueForMeasurement>maxAdcValue)maxAdcValue=adcValueForMeasurement; if(adcValueForMeasurement<minAdcValue)minAdcValue=adcValueForMeasurement;}
    var currentTriggerLevel=triggerLevelAdc;
    if(readyForNextTrigger){var triggerOccurred=false; var triggerSourceAdc=(activeChannel1)?adcValCh1:((activeChannel2)?adcValCh2:currentTriggerLevel); if(triggerEdge==1){if(triggerSourceAdc>currentTriggerLevel&&lastTriggerStateAdc<=currentTriggerLevel)triggerOccurred=true;}else{if(triggerSourceAdc<currentTriggerLevel&&lastTriggerStateAdc>=currentTriggerLevel)triggerOccurred=true;} if(triggerOccurred){if(samplesSinceTrigger>2&&timeBase>0){measuredFreq=1000.0/(samplesSinceTrigger*timeBase);triggeredThisSweep=true;} samplesSinceTrigger=0;readyForNextTrigger=false;}}
    var hysteresisValue=ADC_MAX_VALUE*0.05;
    if(!readyForNextTrigger){var triggerSourceAdc=(activeChannel1)?adcValCh1:((activeChannel2)?adcValCh2:currentTriggerLevel); if(triggerEdge==1){if(triggerSourceAdc<currentTriggerLevel-hysteresisValue)readyForNextTrigger=true;}else{if(triggerSourceAdc>currentTriggerLevel+hysteresisValue)readyForNextTrigger=true;}}
    lastTriggerStateAdc=(activeChannel1)?adcValCh1:((activeChannel2)?adcValCh2:currentTriggerLevel);
    if(samplesSinceTrigger<(SCREEN_WIDTH*5))samplesSinceTrigger++;
    currentX++; if(currentX>=graphOriginX+graphRenderWidth)currentX=graphOriginX;
    delay(timeBase);
  }
}

// === Program Entry Point ===
function main() {
  pinMode(BTN_M5_SELECT_EXIT_PIN,1); pinMode(BTN_NAV_UP_PIN,1); pinMode(BTN_NAV_DOWN_PIN,1);
  drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); setTextSize(1);
  setTextColor(COLOR_ACCENT); var welcomeMsg="M5Scope "+APP_VERSION;
  drawString(welcomeMsg, Math.floor(SCREEN_WIDTH/2-(welcomeMsg.length*CHAR_WIDTH_PX)/2), 10);
  setTextColor(COLOR_WARNING_TEXT); var warn1="MAX INPUT: "+ADC_REF_VOLTAGE.toFixed(1)+"V!";
  var warn2="EXCEEDING WILL CAUSE DAMAGE!";
  drawString(warn1, Math.floor(SCREEN_WIDTH/2-(warn1.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2-20);
  drawString(warn2, Math.floor(SCREEN_WIDTH/2-(warn2.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2-5);
  setTextColor(COLOR_FOREGROUND); var author="by YahyaSvm";
  drawString(author, Math.floor(SCREEN_WIDTH/2-(author.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT-FOOTER_HEIGHT-10);
  delay(3500);

  while (true) {
    var menuSelection = mainMenu();
    if (menuSelection == 0) oscilloscopeScreen();
    else if (menuSelection == 1) settingsMenu();
    else if (menuSelection == 2) aboutScreen();
    else if (menuSelection == 3) safetyInfoScreen();
    else if (menuSelection == 4) {
      drawFillRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_BACKGROUND); drawHeader("Exiting M5Scope");
      setTextSize(1); setTextColor(COLOR_FOREGROUND);
      var msg1="Press M5 Btn"; var msg2="to return to menu.";
      drawString(msg1, Math.floor(SCREEN_WIDTH/2-(msg1.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2-10);
      drawString(msg2, Math.floor(SCREEN_WIDTH/2-(msg2.length*CHAR_WIDTH_PX)/2), SCREEN_HEIGHT/2+5);
      drawFooter("", "Back", "");
      while(digitalRead(BTN_M5_SELECT_EXIT_PIN)) { delay(50); }
      delay(200);
    }
  }
}
main();
// --- END OF FILE M5Oscilloscope_v1.0.js---