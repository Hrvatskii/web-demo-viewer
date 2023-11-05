import { bitsToInt, ifOneExists, isolateBytes } from "../bitReader.js";

const parseUserCmdMessage = (offset, data) => {
  let UserCmdMsg = {
    "Type": 0,
    "Tick": 0,
    "Cmd": 0,
    "Size": 0,
    "Data": {
      // "CommandNumber": 0,
      // "TickCount": 0,
      // "ViewAnglesX": 0,
      // "ViewAnglesY": 0,
      // "ViewAnglesZ": 0,
      // "ForwardMove": 0,
      // "SideMove": 0,
      // "UpMove": 0,
      "Buttons": 0,
      // "Impulse": 0,
      // "WeaponSelect": 0,
      // "WeaponSubtype": 0,
      // "MouseDx": 0,
      // "MouseDy": 0
    },
    "OverheadSize": (13*8)
  }

  UserCmdMsg.Type = bitsToInt(data, offset, 1);
  UserCmdMsg.Tick = bitsToInt(data, offset + 1, 4);
  UserCmdMsg.Cmd = bitsToInt(data, offset + 5, 4);
  UserCmdMsg.Size = bitsToInt(data, offset + 9, 4);
  let UserCmdData = isolateBytes(data, offset + 13, UserCmdMsg.Size);
  // UserCmdData = UserCmdData.padEnd(UserCmdData.length + 8 * Math.ceil(UserCmdMsg.Size / 8), "0"); // make it the correct length sometimes
  // UserCmdData = UserCmdData.padEnd(UserCmdData.length + (8 - UserCmdData.length % 8), "0"); // pad with 0s so its length is divisible by 8

  let CommandNumber, TickCount, ViewAnglesX, ViewAnglesY, ViewAnglesZ, ForwardMove, SideMove, UpMove, Buttons, Impulse, WeaponSelect, WeaponSubtype, MouseDx, MouseDy;
  let index = 0;

  // pain
  [CommandNumber, index] = ifOneExists(UserCmdData, index, 4, "int", 0);
  [TickCount, index] = ifOneExists(UserCmdData, index, 4, "int", 1);
  [ViewAnglesX, index] = ifOneExists(UserCmdData, index, 4, "float", 2);
  [ViewAnglesY, index] = ifOneExists(UserCmdData, index, 4, "float", 3);
  [ViewAnglesZ, index] = ifOneExists(UserCmdData, index, 4, "float", 4);
  [ForwardMove, index] = ifOneExists(UserCmdData, index, 4, "float", 5);
  [SideMove, index] = ifOneExists(UserCmdData, index, 4, "float", 6);
  [UpMove, index] = ifOneExists(UserCmdData, index, 4, "float", 7);
  [Buttons, index] = ifOneExists(UserCmdData, index + 1, 4, "int", 0);
  Buttons = findButtons(Buttons);
  [Impulse, index] = ifOneExists(UserCmdData, index + 1, 1, "byte", 1);
  [WeaponSelect, index] = ifOneExists(UserCmdData, index + 1, 11 / 8, "int", 2);
  WeaponSubtype = null; // i dont give a shit. i declare that weaponselect is always null
  [MouseDx, index] = ifOneExists(UserCmdData, index + 1, 2, "short", 3);
  [MouseDy, index] = ifOneExists(UserCmdData, index + 1, 2, "short", 4);

  // UserCmdMsg.Data.CommandNumber = CommandNumber;
  // UserCmdMsg.Data.TickCount = TickCount;
  // UserCmdMsg.Data.ViewAnglesX = ViewAnglesX;
  // UserCmdMsg.Data.ViewAnglesY = ViewAnglesY;
  // UserCmdMsg.Data.ViewAnglesZ = ViewAnglesZ;
  // UserCmdMsg.Data.ForwardMove = ForwardMove;
  // UserCmdMsg.Data.SideMove = SideMove;
  // UserCmdMsg.Data.UpMove = UpMove;
  UserCmdMsg.Data.Buttons = Buttons;
  // UserCmdMsg.Data.Impulse = Impulse;
  // UserCmdMsg.Data.WeaponSelect = WeaponSelect;
  // UserCmdMsg.Data.WeaponSubtype = WeaponSubtype;
  // UserCmdMsg.Data.MouseDx = MouseDx;
  // UserCmdMsg.Data.MouseDy = MouseDy;

  UserCmdMsg.OverheadSize = 13 + bitsToInt(data, offset + 9, 4);

  // console.log("usercmd", UserCmdMsg.OverheadSize)


  return [UserCmdMsg, UserCmdMsg.OverheadSize, UserCmdMsg.Type, UserCmdMsg.Tick];
}

// please optimize this is slowing each demo down by like 4ms
function findButtons(buttons) {
  const buttonMap = new Map(
    [
      [0, "IN_ATTACK"],
      [1, "IN_JUMP"],
      [2, "IN_DUCK"],
      [3, "IN_FORWARD"],
      [4, "IN_BACK"],
      [5, "IN_USE"],
      [6, "IN_CANCEL"],
      [7, "IN_LEFT"],
      [8, "IN_RIGHT"],
      [9, "IN_MOVELEFT"],
      [10, "IN_MOVERIGHT"],
      [11, "IN_ATTACK2"]
    ]
  )
  const heldButtons = [];
  for (let i = 0; i < buttonMap.size; i++) {
    // check if the bit at mask is set to 1 in buttons
    const mask = 1 << i;
    const check = buttons & mask;
    if (check) heldButtons.push(buttonMap.get(i));
  }

  return heldButtons.length ? heldButtons : null;
}

export {parseUserCmdMessage};