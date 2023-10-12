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
  // initialize eta body
  const eta = document.createElement("p");
  eta.id = "eta";
  document.body.append(eta)
  
  // variables used for eta things
  let currentFile = 0;
  let totalTime = 0;
  let averageTime = 1;
  let timeLeft = 0;

  const files = event.target.files;

  for (const file of files) {
    const reader = new FileReader();
    const bitsPromise = new Promise((resolve) => {
      reader.onload = function (event) {
        const arrayBuffer = event.target.result;
        const bytes = new Uint8Array(arrayBuffer);

        let bits = '';
        for (let i = 0; i < bytes.length; i++) {
          bits += bytes[i].toString(2).padStart(8, '0');
        }
        resolve(bits);
      };
    });

    reader.readAsArrayBuffer(file);

    bitsPromise.then((bits) => {
      const timeBefore = Date.now();
      currentFile++;
      // console.time("parse");
      eta.innerText = `Parsing ${currentFile}/${files.length}\nETA: ${timeLeft} ms\nTime elapsed: ${totalTime} ms\nAverage: ${averageTime.toFixed(0)} ms`
      parseDemo(bits, file, files.length);
      // console.timeEnd("parse");
      const timeAfter = Date.now();
      totalTime += (timeAfter - timeBefore);
      averageTime = totalTime / currentFile;
      timeLeft = (averageTime * (files.length - currentFile)).toFixed(0);
    });
  }
}

const playerInformation = [];

function parseDemo(bits, file, demosAmount) {
  parseHeader(bits);

  // offset is after the header
  let offset = 1072 * 8;

  const positionX = new Map();
  const positionY = new Map();
  const yaw = new Map();

  let currentTick = 0;

  while (offset < (file.size * 8)) {
    const [message, OverheadSize, type] = parseMessage(offset, bits)
    // the stop message
    if (type === 7) break;
    if (type === 5) { // usercmd
      currentTick++;
    } else if (type === 2) { // packet
      positionX.set(currentTick, message.PacketInfo.CmdInfo.ViewOrigin[0]);
      positionY.set(currentTick, message.PacketInfo.CmdInfo.ViewOrigin[1]);
      yaw.set(currentTick, message.PacketInfo.CmdInfo.ViewAngles[1]);
    }  
    offset += OverheadSize;
  }

  // c_orthowidth
  const width = mapInfo[chamberName].width;
  
  // the width of the map on the screen. used for ratio calculation
  const screenWidth = document.getElementById("chamber").clientWidth;
  
  // how much bigger a pixel is compared to a unit
  const ratio = width / screenWidth;

  playerInformation.push(findViewInformation(positionX, positionY, yaw, ratio, currentTick));

  if (demosAmount === playerInformation.length) {
    document.getElementById("eta").innerText = "Done.";
    setTimeout(() => {
      document.getElementById("eta").remove();
    }, 2000);
    document.body.append(fragment);
    displayToScreen();
  }
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
    })
    currentTick++;
  }, 15);
}

function findViewInformation(positionX, positionY, yaw, ratio, length) {
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
  beginningXInGame = Number(positionX.get(0));
  beginningYInGame = Number(positionY.get(0));

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
    "rotation": rotation
  }
}

function parseMessage(offset, bits) {
  // find what type of message it is
  const messageTypeID = bitsToInt(bits, offset, 8);
  const messageType = messageTable[messageTypeID];

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

function parsePacketMessage(offset, bits) {
  const packetMsg =
    {
      //"Type": 0,
      // "Tick": 0,
      "PacketInfo": {
        "CmdInfo": {
          // "Flags": 0,
          "ViewOrigin": [],
          "ViewAngles": [],
          // "LocalViewAngles": [],
          // "ViewOrigin2": [],
          // "ViewAngles2": [],
          // "LocalViewAngles2": []
        }
      },
      // "InSequence": 0,
      // "OutSequence": 0,
      // "Size": 0,
      // "Data": [],
      //"OverheadSize": (93*8)
    }

  //packetMsg.Type = bitsToInt(bits, offset, 8);
  // packetMsg.Tick = bitsToInt(bits, offset + 8, 32);

  // packetMsg.PacketInfo.CmdInfo.Flags = bitsToInt(bits, offset + 40, 32);

  packetMsg.PacketInfo.CmdInfo.ViewOrigin       = readFloatArr(bits, offset + 72, 96, 3);
  packetMsg.PacketInfo.CmdInfo.ViewAngles       = readFloatArr(bits, offset + 168, 96, 3);
  // packetMsg.PacketInfo.CmdInfo.LocalViewAngles  = readFloatArr(bits, offset + 264, 96, 3);
  // packetMsg.PacketInfo.CmdInfo.ViewOrigin2      = readFloatArr(bits, offset + 360, 96, 3);
  // packetMsg.PacketInfo.CmdInfo.ViewAngles2      = readFloatArr(bits, offset + 456, 96, 3);
  // packetMsg.PacketInfo.CmdInfo.LocalViewAngles2 = readFloatArr(bits, offset + 552, 96, 3);

  // packetMsg.InSequence = bitsToInt(bits, offset + 648, 32);
  // packetMsg.OutSequence = bitsToInt(bits, offset + 680, 32);
  // packetMsg.Size = bitsToInt(bits, offset + 712, 32);

  // packetMsg.OverheadSize = packetMsg.OverheadSize + packetMsg.Size * 8;

  const OverheadSize = (93 * 8) + (bitsToInt(bits, offset + 712, 32) * 8);

  const type = bitsToInt(bits, offset, 8);


  return [packetMsg, OverheadSize, type];
}

function parseConsoleCmdMessage(offset, bits) {
  // const ConsoleCmdMsg =
  //   {
  //     // "Type": 0,
  //     // "Tick": 0,
  //     // "Size": 0,
  //     // "Data": "",
  //     "OverheadSize": (9*8)
  //   }

  // ConsoleCmdMsg.Type = bitsToInt(bits, offset, 8);
  // ConsoleCmdMsg.Tick = bitsToInt(bits, offset + 8, 32);
  // ConsoleCmdMsg.Size = bitsToInt(bits, offset + 40, 32);
  // ConsoleCmdMsg.Data = bitsToString(bits, offset + 72, ConsoleCmdMsg.Size * 8);

  // ConsoleCmdMsg.OverheadSize = ConsoleCmdMsg.OverheadSize + ConsoleCmdMsg.Size * 8;

  const OverheadSize = (9*8) + bitsToInt(bits, offset + 40, 32) * 8;

  //const type = bitsToInt(bits, offset, 8);

  return [[], OverheadSize];
}

function parseSyncTickMessage(offset, bits) {
  // let SyncTickMsg = [
  //   {
  //     "Type": 0,
  //     "Tick": 0,
  //     "OverheadSize": (5*8)
  //   }
  // ]

  // SyncTickMsg[0].Type = bitsToInt(bits, offset, 8);
  // SyncTickMsg[0].Tick = bitsToInt(bits, offset + 8, 32);

  const OverheadSize = (5*8);
  
  return [[], OverheadSize];
}

function parseUserCmdMessage(offset, bits) {
  // let UserCmdMsg = [
  //   {
  //     "Type": 0,
  //     "Tick": 0,
  //     "Cmd": 0,
  //     "Size": 0,
  //     "Data": "",
  //     "OverheadSize": (13*8)
  //   }
  // ]

  // UserCmdMsg[0].Type = bitsToInt(bits, offset, 8);
  // UserCmdMsg[0].Tick = bitsToInt(bits, offset + 8, 32);
  // UserCmdMsg[0].Cmd = bitsToInt(bits, offset + 40, 32);
  // UserCmdMsg[0].Size = bitsToInt(bits, offset + 72, 32);
  // UserCmdMsg[0].Data = bitsToString(bits, offset + 104, UserCmdMsg[0].Size * 8);

  // UserCmdMsg[0].OverheadSize = UserCmdMsg[0].OverheadSize + UserCmdMsg[0].Size * 8;

  const OverheadSize = (13*8) + bitsToInt(bits, offset + 72, 32) * 8;

  const type = bitsToInt(bits, offset, 8);

  return [[], OverheadSize, type];
}

function parseDataTablesMessage(offset, bits) {
  // let DataTablesMsg = [
  //   {
  //     "Type": 0,
  //     "Tick": 0,
  //     "Size": 0,
  //     "Data": "",
  //     "OverheadSize": (9*8)
  //   }
  // ]

  // DataTablesMsg[0].Type = bitsToInt(bits, offset, 8);
  // DataTablesMsg[0].Tick = bitsToInt(bits, offset + 8, 32);
  // DataTablesMsg[0].Size = bitsToInt(bits, offset + 40, 32);

  // DataTablesMsg[0].OverheadSize = DataTablesMsg[0].OverheadSize + DataTablesMsg[0].Size * 8;

  const OverheadSize = (9*8) + bitsToInt(bits, offset + 40, 32) * 8;

  return [[], OverheadSize];
}

function parseStopMessage(offset, bits) {
  let StopMsg = [
    {
      "Type": 7
    }
  ]
  
  return [StopMsg[0], 0, 7];
}

function parseStringTablesMessage(offset, bits) {
  // let StringTablesMsg = [
  //   {
  //     "Type": 0,
  //     "Tick": 0,
  //     "Size": 0,
  //     "Data": "",
  //     "OverheadSize": (9*8)
  //   }
  // ]

  // StringTablesMsg[0].Type = bitsToInt(bits, offset, 8);
  // StringTablesMsg[0].Tick = bitsToInt(bits, offset + 8, 32);
  // StringTablesMsg[0].Size = bitsToInt(bits, offset + 40, 32);
  // StringTablesMsg[0].OverheadSize = StringTablesMsg[0].OverheadSize + StringTablesMsg[0].Size * 8;

  const OverheadSize = (9*8) + bitsToInt(bits, offset + 40, 32) * 8;

  return [[], OverheadSize];
}

// contains the values for messages that appear in the demo
messageTable = {
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
      "sizeBits": 64
  },
  "DemoProtocol": {
      "index": 64,
      "type": "int",
      "sizeBits": 32
  },
  "NetProtocol": {
      "index": 96,
      "type": "int",
      "sizeBits": 32
  },
  "ServerName": {
      "index": 128,
      "type": "str",
      "sizeBits": 2080
  },
  "ClientName": {
      "index": 2208,
      "type": "str",
      "sizeBits": 2080
  },
  "MapName": {
      "index": 4288,
      "type": "str",
      "sizeBits": 2080
  },
  "GameDir": {
      "index": 6368,
      "type": "str",
      "sizeBits": 2080
  },
  "PlaybackTime": {
      "index": 8448,
      "type": "float",
      "sizeBits": 32
  },
  "PlaybackTicks": {
      "index": 8480,
      "type": "int",
      "sizeBits": 32
  },
  "PlaybackFrames": {
      "index": 8512,
      "type": "int",
      "sizeBits": 32
  },
  "SignOnLength": {
      "index": 8544,
      "type": "int",
      "sizeBits": 32
  }
};

function parseHeader(bits) {
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
        value = bitsToString(bits, field.index, field.sizeBits);
        break;
        
      // for example the amount of ticks a demo is
      case "int":
        value = bitsToInt(bits, field.index, field.sizeBits);
        break;

      // literally only PlaybackTime uses float (the time of the demo, like 53.01)
      case "float":
        value = bitsToFloat(bits, field.index, field.sizeBits);
        break;
    }
    headerValues[fieldName] = value;
  }
  const header = `
  Filestamp \t\t : ${headerValues.Filestamp}
  DemoProtocol \t\t : ${headerValues.DemoProtocol}
  NetProtocol \t\t : ${headerValues.NetProtocol}
  ServerName \t\t : ${headerValues.ServerName}
  ClientName \t\t : ${headerValues.ClientName}
  MapName \t\t : ${headerValues.MapName}
  GameDir \t\t : ${headerValues.GameDir}
  PlaybackTime \t\t : ${headerValues.PlaybackTime}
  PlaybackTicks \t : ${headerValues.PlaybackTicks}
  PlaybackFrames \t : ${headerValues.PlaybackFrames}
  SignOnLength \t\t : ${headerValues.SignOnLength}

  Measured Time \t : ${Math.floor(headerValues.PlaybackTime / 60) === 0 ? "" : Math.floor(headerValues.PlaybackTime / 60) + ":"}${(headerValues.PlaybackTime - 60 * Math.floor(headerValues.PlaybackTime / 60)).toFixed(3)}
  Measured Ticks \t : ${headerValues.PlaybackTicks}
  `
  // console.log(header);
}

// use to convert bits to a string format
function bitsToString(bits, index, length) {
  // isolates the bits for the current field and removes zeroes at the end
  let truncStr = bits.substring(index, index + length).replace(/0+$/, '');

  // adds 0 to the end of truncString to make the length of it a multiple of 8, eg.
  // 0111000001101111011100100111010001100001011011   (.length = 46) to
  // 011100000110111101110010011101000110000101101100 (.length = 48)
  truncStr = truncStr.padEnd(8 * Math.ceil(truncStr.length / 8), '0');

  // splits truncStr to some amount of strings with the length 8, for instance 011100000110111101110010011101000110000101101100 => 01110000 01101111 etc
  // replaces the splits with whatever character matches up with the part eg. 01110000 => "p"
  return truncStr.replace(/[01]{8}/g, function (v) {
    return String.fromCharCode(parseInt(v, 2));
  });
}

// use to convert bits to signed integer
function bitsToInt(bits, index, length) {
  // isolates the bits and converts them to little endian
  let isolatedBits = bits.substring(index, index + length);
  isolatedBits = convertToLittleEndian(isolatedBits);

  // convert to unsigned integer then signed integer
  const uint32Value = parseInt(isolatedBits, 2);
  const int32Value = uint32Value | 0;
  
  // return signed integer (supports negative numbers!)
  return int32Value;
}


// use to convert bits to float format
function bitsToFloat(bits, index, length) {
  // isolates the bits and converts them to little endian
  let isolatedBits = bits.substring(index, index + length);
  isolatedBits = convertToLittleEndian(isolatedBits);

  // convert the bits into a hexadecimal string
  const hex = parseInt(isolatedBits, 2).toString(16);

  // convert the hexadecimal string into a float representation
  const buffer = new ArrayBuffer(4);
  const intView = new Uint32Array(buffer);
  const floatView = new Float32Array(buffer);

  intView[0] = parseInt(hex, 16);

  // return the final value rounded to three decimals (removes floating point quirk)
  return floatView[0].toFixed(3);
}

function readFloatArr(data, index, len, count) {
  let arr = [];
  for (let i = 0; i < count; i++) {
    let floats = data.substring(index, index + (len / 3));
    arr.push(bitsToFloat(floats, 0, 32));
    index += (len / 3); 
  }
  return arr;
}

// this converts a series of bits to little endian which means that we seperate the bytes and reverse their order eg.
// 00000001 10000000 11111111 10101010 (00000001100000001111111110101010) to
// 10101010 11111111 10000000 00000001 (10101010111111111000000000000001)
function convertToLittleEndian(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.substr(i, 8);
    bytes.push(byte);
  }

  bytes.reverse();
  return bytes.join('');
}
