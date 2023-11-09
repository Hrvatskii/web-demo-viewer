// *****************************************************************************************
// * Module that handles everything regarding the list of demos as well as its components. *
// *****************************************************************************************

import { showBox } from "./showBox.js";

// initialize the list of demos
const initializeDemoList = () => {
  const playerList = document.createElement("div");
  playerList.id = "player-list";
  document.body.append(playerList);

  const playerListTopBorder = document.createElement("div");
  playerListTopBorder.id = "player-list-top-border";
  playerList.append(playerListTopBorder);

  demoListResizeEventListener(playerList, playerListTopBorder);

  return playerList;
}

// add an event listener to the top of the demo list in order to resize it
const demoListResizeEventListener = (playerList, playerListTopBorder) => {
  playerListTopBorder.addEventListener("mousedown", () => {
    document.body.addEventListener("mousemove", resizePlayerList);
  });
  document.body.addEventListener("mouseup", () => {
    document.body.removeEventListener("mousemove", resizePlayerList);
  });
}

// resizes the demo list
const resizePlayerList = (event) => {
  const yPos = event.clientY;
  const screenHeight = document.documentElement.clientHeight;
  const newHeight = screenHeight - yPos;
  document.getElementById("player-list").style.maxHeight = "100vh";
  document.getElementById("player-list").style.height = newHeight+"px";
}

// initializes individual rows for players
const createPlayerRow = (playerList, demoLength, fileName, clientName, header) => {
  const playerRow = document.createElement("div");
  playerRow.className = "player-row";

  fillPlayerRow(playerList, playerRow, demoLength, fileName, clientName, header)
}

// fills each row with information
const fillPlayerRow = (playerList, playerRow, demoLength, fileName, clientName, header) => {
  const demoLengthContainer = document.createElement("p");
  demoLengthContainer.className = "demo-length-container";
  demoLengthContainer.innerText = demoLength;
  
  const fileNameContainer = document.createElement("p");
  fileNameContainer.className = "file-name-container";
  fileNameContainer.innerText = fileName;
  
  const clientNameContainer = document.createElement("p");
  clientNameContainer.className = "client-name-container";
  clientNameContainer.innerText = clientName;
  
  const openKeyboardButton = document.createElement("button");
  openKeyboardButton.className = "normal-button open-keyboard";
  openKeyboardButton.innerHTML = "&#9856;";
  openKeyboardButton.title = "open keyboard inputs";
  openKeyboardButton.onclick = () => showBox(createKeyboard(), "keyboard-grid", fileName);
  
  const openHeaderButton = document.createElement("button");
  openHeaderButton.className = "normal-button open-header";
  openHeaderButton.innerHTML = "&#10138;";
  openHeaderButton.title = "open demo header";
  // bruh
  openHeaderButton.onclick = () => showBox(`
Filestamp \t : ${header.Filestamp}
DemoProtocol \t : ${header.DemoProtocol}
NetProtocol \t : ${header.NetProtocol}
ServerName \t : ${header.ServerName}
ClientName \t : ${header.ClientName}
MapName \t : ${header.MapName}
GameDir \t : ${header.GameDir}
PlaybackTime \t : ${header.PlaybackTime}
PlaybackTicks \t : ${header.PlaybackTicks}
PlaybackFrames \t : ${header.PlaybackFrames}
SignOnLength \t : ${header.SignOnLength}

Adjusted Time \t : ${header.AdjustedTime}
Adjusted Ticks \t : ${header.AdjustedTicks}
  `);
  
  playerRow.append(demoLengthContainer);
  playerRow.append(fileNameContainer);
  playerRow.append(clientNameContainer);
  playerRow.append(openKeyboardButton);
  playerRow.append(openHeaderButton);
  
  playerList.append(playerRow);
}

// initializes a keyboard used for the input display
const createKeyboard = () => {
  let innerHtml = "";
  function createKey(key, inputName, specialAttribute) {
    innerHtml += `<div class="key ${specialAttribute ? specialAttribute : ""}" data-value="${inputName}" data-status="inactive">${key}</div>`
  }

  // why do i create such attrocities
  createKey("");
  createKey("");
  createKey("W", "8");
  createKey("E", "32");
  createKey("");
  createKey("");

  createKey("");
  createKey("A", "512");
  createKey("S", "16");
  createKey("D", "1024");
  createKey("");
  createKey("");

  createKey("C", "4");
  createKey("S", "2", "long"); // takes up 3 normal squares
  createKey("L", "1");
  createKey("R", "2048");

  return innerHtml;
}

export {initializeDemoList, createPlayerRow}