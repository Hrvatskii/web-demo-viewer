import { bitsToString, bitsToInt, bitsToFloat } from "./modules/bitReader.js";
import { initializeDemoList, createPlayerRow } from "./modules/demoList.js";
import { initializeETABody, updateETABeforeParse, updateETAAfterParse, removeETA } from "./modules/eta.js";
import { parseConsoleCmdMessage } from "./modules/parseMessages/parseConsoleCmdMessage.js";
import { parseDataTablesMessage } from "./modules/parseMessages/parseDataTablesMessage.js";
import { parsePacketMessage } from "./modules/parseMessages/parsePacketMessage.js";
import { parseStopMessage } from "./modules/parseMessages/parseStopMessage.js";
import { parseStringTablesMessage } from "./modules/parseMessages/parseStringTablesMessage.js";
import { parseSyncTickMessage } from "./modules/parseMessages/parseSyncTickMessage.js";
import { parseUserCmdMessage } from "./modules/parseMessages/parseUserCmdMessage.js";

const mapInfo = {
  "08": {
    "otherXInGame": 72,
    "otherYInGame": -60,
    "width": 2500
  },
  "09": {
    "otherXInGame": -129,
    "otherYInGame": 640,
    "width": 3555.555
  },
  "10": {
    "otherXInGame": 639,
    "otherYInGame": -255,
    "width": 5000
  },
  "13": {
    "otherXInGame": 351,
    "otherYInGame": 255,
    "width": 2500
  },
}

// Create a document fragment to hold all the players
const fragment = document.createDocumentFragment();

document.addEventListener("click", calibrate);

let clicks = 0;
const chamberName = "08";
const otherXInGame = mapInfo[chamberName].otherXInGame;
const otherYInGame = mapInfo[chamberName].otherYInGame;
let beginningXScreen, beginningYScreen, otherXScreen, otherYScreen;
function calibrate(event) {
  clicks++;
  if (clicks === 1) {
    beginningXScreen = event.clientX;
    beginningYScreen = event.clientY;
  } else if (clicks === 2) {
    otherXScreen = event.clientX;
    otherYScreen = event.clientY;
    document.removeEventListener("click", calibrate);
    // //console.log(beginningXScreen, beginningYScreen, otherXScreen, otherYScreen)
  }
}

const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {

  // initialize the list of demos that appears at the bottom left
  const playerList = initializeDemoList();

  // initialize eta body
  initializeETABody();

  const files = event.target.files;

  for (const file of files) {
    // in charge of reading the contents of each file
    const reader = new FileReader();
    const bytesPromise = new Promise((resolve) => {
      reader.onload = function (event) {
        const arrayBuffer = event.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        // console.log(bytes);

        // fix fix fix fix fix
        // let bits = '';
        // for (let i = 0; i < bytes.length; i++) {
        //   bits += bytes[i].toString(2).padStart(8, '0');
        // }
        resolve(bytes);
      };
    });

    reader.readAsArrayBuffer(file);

    bytesPromise.then((bytes) => {

      // get the time before a demo has finished parsing
      const timeBefore = updateETABeforeParse(files.length);

      // parse the demo and gather variables that are used while displaying the list of demos
      const [demoLength, fileName, clientName, header] = parseDemo(bytes, file);

      // assign relevant data to the list of demos
      createPlayerRow(playerList, demoLength, fileName, clientName, header);

      // update the currently predicted ETA after parsing a demo
      updateETAAfterParse(timeBefore, files.length);

      // if all the demos have been parsed we start the display
      if (files.length === playerInformation.length) {
        // removes the ETA from the screen
        removeETA();

        // adds all of the players to the screen
        document.body.append(fragment);

        // start the display
        displayToScreen();
      }
    });
  }
}

const playerInformation = [];

function parseDemo(bits, file) {
  const header = parseHeader(bits);

  // offset is after the header
  let offset = 1072;

  const positionX = new Map();
  const positionY = new Map();
  const yaw = new Map();
  const buttons = new Map();

  let currentTick = 0;
  let firstTick = 0;
  let effectiveTick = 0;

  while (offset < file.size) {
    const [message, OverheadSize, type, tick] = parseMessage(offset, bits);
    // the stop message
    if (type === 7) break;
    if (type === 5) { // usercmd
      if (firstTick === 0) firstTick = tick;
      currentTick = tick;
      effectiveTick = currentTick - firstTick;
      buttons.set(effectiveTick, message.Data.Buttons);
    } else if (type === 2) { // packet
      positionX.set(effectiveTick, message.PacketInfo.CmdInfo.ViewOrigin[0]);
      positionY.set(effectiveTick, message.PacketInfo.CmdInfo.ViewOrigin[1]);
      yaw.set(effectiveTick, message.PacketInfo.CmdInfo.ViewAngles[1]);
    }
    offset += OverheadSize;
    // console.log("offset", offset)
  }

  // add adjusted time to the header. i have no clue why the error is 3 and not just 1
  header.AdjustedTicks = effectiveTick + 3;
  header.AdjustedTime = ((effectiveTick + 3) * 0.015).toFixed(3);

  //console.log(header)

  // console.log(buttons)

  //console.log(currentTick, file);

  // c_orthowidth
  const width = mapInfo[chamberName].width;
  
  // the width of the map on the screen. used for ratio calculation
  const screenWidth = document.getElementById("chamber").clientWidth;
  
  // how much bigger a pixel is compared to a unit
  const ratio = width / screenWidth;

  playerInformation.push(findViewInformation(positionX, positionY, yaw, ratio, currentTick, buttons, file.name));

  return [header.AdjustedTicks, file.name, header.ClientName, header];
}

function displayToScreen() {
  let currentTick = 0;
  
  let timer = setInterval(() => {
    playerInformation.forEach((player) => {
      if (currentTick >= player.userCmdsLength) return;
      const translateX = player.translateX.get(currentTick);
      const translateY = player.translateY.get(currentTick);
      player.playerCircle.style.transform = `translate(${translateX}, ${translateY})`;
      player.playerCircle.children[0].style.transform = player.rotation.get(currentTick);
      if (document.querySelector(`.box-content[data-value="${player.fileName}"]`)) {
        for (const button of document.querySelector(`.box-content[data-value="${player.fileName}"]`).children) {
          button.dataset.status = "inactive";
        }
      }
      if (document.querySelector(`.box-content[data-value="${player.fileName}"]`) && player.buttons.get(currentTick)) {
        player.buttons.get(currentTick).forEach((action) => {
          document.querySelector(`.box-content[data-value="${player.fileName}"] .key[data-value="${action}"]`).dataset.status = "active";
        })
      }
    })
    currentTick++;
  }, 15);
}

function findViewInformation(positionX, positionY, yaw, ratio, length, buttons, fileName) {
  // console.log(length)
  let playerCircle = document.createElement("div");
  
  const red = Math.floor(Math.random() * 255);
  const green = Math.floor(Math.random() * 255);
  const blue = Math.floor(Math.random() * 255);
  const color = `rgb(${red}, ${green}, ${blue})`;
  
  playerCircle.innerHTML = `
  <div class="arrow-container">
  <div class="arrow" style="background-color: ${color}">
  <div class="left-right-container">
  <div class="left" style="background-color: ${color}"></div>
  <div class="right" style="background-color: ${color}"></div>
  </div>
  </div>
  </div>
  `;
  playerCircle.className = "player";
  playerCircle.style.backgroundColor = color;
  fragment.append(playerCircle)
  
  // loads of variables that vary based on what chamber and orientation we're looking at
  let offsetX, offsetY, angleOffset, multiplierX, multiplierY, rotationMultiplier;
  
  // the start position for the player in coordinates on the map itself
  const beginningXInGame = Number(positionX.get(0));
  const beginningYInGame = Number(positionY.get(0));

  // checking for every possible case and applying the appropriate offsets etc
  // x axis
  if (beginningXScreen > otherXScreen && beginningXInGame > otherXInGame) {
    offsetX = beginningXScreen - (beginningXInGame / ratio);
    multiplierX = 1;
    rotationMultiplier = 1;
    angleOffset = 180;
    // console.log("x1");
  } else if (beginningXScreen < otherXScreen && beginningXInGame < otherXInGame) {
    offsetX = beginningXScreen - (beginningXInGame / ratio);
    multiplierX = 1;
    rotationMultiplier = 1;
    angleOffset = 180;
    // console.log("x2");
  } else if (beginningXScreen > otherXScreen && beginningXInGame < otherXInGame) {
    offsetX = beginningXScreen + (beginningXInGame / ratio);
    multiplierX = -1;
    rotationMultiplier = -1;
    angleOffset = 0;
    // console.log("x3");
  } else {
    offsetX = beginningXScreen + (beginningXInGame / ratio);
    multiplierX = -1;
    rotationMultiplier = -1;
    angleOffset = 0;
    // console.log("x4");
  }
  
  // y axis
  if (beginningYScreen > otherYScreen && beginningYInGame > otherYInGame) {
    offsetY = beginningYScreen - (beginningYInGame / ratio);
    multiplierY = 1;
    // console.log("y1");
  } else if (beginningYScreen < otherYScreen && beginningYInGame < otherYInGame) {
    offsetY = beginningYScreen - (beginningYInGame / ratio);
    multiplierY = 1;
    // console.log("y2");
  } else if (beginningYScreen > otherYScreen && beginningYInGame < otherYInGame) {
    offsetY = beginningYScreen + (beginningYInGame / ratio);
    multiplierY = -1;
    // console.log("y3");
  } else {
    offsetY = beginningYScreen + (beginningYInGame / ratio);
    multiplierY = -1;
    // console.log("y4");
  }
  
  const translateX = new Map();
  const translateY = new Map();
  const rotation = new Map();
  
  // create the css transform values for the player for each frame
  for (let frame = 0; frame < length; frame++) {
    translateX.set(frame, `calc((${multiplierX} * ${positionX.get(frame)}px / ${ratio}) - 50% + ${offsetX}px)`)
    translateY.set(frame, `calc((${multiplierY} * ${positionY.get(frame)}px / ${ratio}) - 50% + ${offsetY}px)`)
    rotation.set(frame, `rotateZ(${yaw.get(frame) * rotationMultiplier + angleOffset}deg)`)
  }

  return {
    "userCmdsLength": length,
    "playerCircle": playerCircle,
    "translateX": translateX,
    "translateY": translateY,
    "rotation": rotation,
    "buttons": buttons,
    "fileName": fileName
  }
}

function parseMessage(offset, bits) {
  // find what type of message it is
  const messageTypeID = bitsToInt(bits, offset, 1);
  const messageType = messageTable[messageTypeID];
  
  // console.log("HiAAAAA", messageTypeID, messageType)
  switch (messageType) {
    case "SignOn":
    case "Packet":
      return parsePacketMessage(offset, bits);
    case "ConsoleCmd":
      return parseConsoleCmdMessage(offset, bits);
    case "SyncTick":
      return parseSyncTickMessage(offset, bits);
    case "UserCmd":
      return parseUserCmdMessage(offset, bits);
    case "DataTables":
      return parseDataTablesMessage(offset, bits);
    case "Stop":
      return parseStopMessage(offset, bits);
    case "StringTables":
      return parseStringTablesMessage(offset, bits);
  }
}

// contains the values for messages that appear in the demo
const messageTable = {
  1: "SignOn",
  2: "Packet",
  3: "SyncTick",
  4: "ConsoleCmd",
  5: "UserCmd",
  6: "DataTables",
  7: "Stop",
  8: "StringTables"
}

// predetermined values for information stored in the header of a demo
const headerFields = {
  "Filestamp": {
    "index": 0,
    "type": "str",
    "sizeBytes": 8
  },
  "DemoProtocol": {
    "index": 8,
    "type": "int",
    "sizeBytes": 4
  },
  "NetProtocol": {
    "index": 12,
    "type": "int",
    "sizeBytes": 4
  },
  "ServerName": {
    "index": 16,
    "type": "str",
    "sizeBytes": 260
  },
  "ClientName": {
    "index": 276,
    "type": "str",
    "sizeBytes": 260
  },
  "MapName": {
    "index": 536,
    "type": "str",
    "sizeBytes": 260
  },
  "GameDir": {
    "index": 796,
    "type": "str",
    "sizeBytes": 260
  },
  "PlaybackTime": {
    "index": 1056,
    "type": "float",
    "sizeBytes": 4
  },
  "PlaybackTicks": {
    "index": 1060,
    "type": "int",
    "sizeBytes": 4
  },
  "PlaybackFrames": {
    "index": 1064,
    "type": "int",
    "sizeBytes": 4
  },
  "SignOnLength": {
    "index": 1068,
    "type": "int",
    "sizeBytes": 4
  }
};

function parseHeader(data) {
  const headerValues = {
    "Filestamp": null,
    "DemoProtocol": null,
    "NetProtocol": null,
    "ServerName": null,
    "ClientName": null,
    "MapName": null,
    "GameDir": null,
    "PlaybackTime": null,
    "PlaybackTicks": null,
    "PlaybackFrames": null,
    "SignOnLength": null
  }

  for (const fieldName in headerFields) {
    let value; // contains whatever the header thing has in store
    const field = headerFields[fieldName];
    /*
    index: ...
    type: ...
    sizeBits: ...
    */

    switch (field.type) {
      // those values in the header that are strings for instance the player name or test chamber name (testchmb_a_02 and not 04)
      case "str":
        value = bitsToString(data, field.index, field.sizeBytes);
        break;
        
      // for example the amount of ticks a demo is
      case "int":
        value = bitsToInt(data, field.index, field.sizeBytes);
        break;

      // literally only PlaybackTime uses float (the time of the demo, like 53.01)
      case "float":
        value = bitsToFloat(data, field.index, field.sizeBytes);
        break;
    }
    headerValues[fieldName] = value;
  }
  
  return headerValues;
}

