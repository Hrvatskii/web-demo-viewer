import { bitsToInt, ifOneExists } from "../bitReader.js";

const parseUserCmdMessage = (offset, bits) => {
  let UserCmdMsg = {
    "Type": 0,
    "Tick": 0,
    "Cmd": 0,
    "Size": 0,
    "Data": {
      "CommandNumber": 0,
      "TickCount": 0,
      "ViewAnglesX": 0,
      "ViewAnglesY": 0,
      "ViewAnglesZ": 0,
      "ForwardMove": 0,
      "SideMove": 0,
      "UpMove": 0,
      "Buttons": 0,
      "Impulse": 0,
      "WeaponSelect": 0,
      "WeaponSubtype": 0,
      "MouseDx": 0,
      "MouseDy": 0
    },
    "OverheadSize": (13*8)
  }

  UserCmdMsg.Type = bitsToInt(bits, offset, 8);
  UserCmdMsg.Tick = bitsToInt(bits, offset + 8, 32);
  UserCmdMsg.Cmd = bitsToInt(bits, offset + 40, 32);
  UserCmdMsg.Size = bitsToInt(bits, offset + 72, 32);
  let data = bits.substring(offset + 104, offset + 104 + UserCmdMsg.Size * 8).replace(/0+$/, ''); // isolate bits
  data = data.padEnd(data.length + 8 * Math.ceil(UserCmdMsg.Size / 8), "0"); // make it the correct length sometimes
  data = data.padEnd(data.length + (8 - data.length % 8), "0"); // pad with 0s so its length is divisible by 8

  let CommandNumber, TickCount, ViewAnglesX, ViewAnglesY, ViewAnglesZ, ForwardMove, SideMove, UpMove, Buttons, Impulse, WeaponSelect, WeaponSubtype, MouseDx, MouseDy;

  // pain
  [CommandNumber, data] = ifOneExists(data, 32, "int");
  [TickCount, data] = ifOneExists(data, 32, "int");
  [ViewAnglesX, data] = ifOneExists(data, 32, "float");
  [ViewAnglesY, data] = ifOneExists(data, 32, "float");
  [ViewAnglesZ, data] = ifOneExists(data, 32, "float");
  [ForwardMove, data] = ifOneExists(data, 32, "float");
  [SideMove, data] = ifOneExists(data, 32, "float");
  [UpMove, data] = ifOneExists(data, 32, "float");
  [Buttons, data] = ifOneExists(data, 32, "int");
  Buttons = findButtons(Buttons);
  [Impulse, data] = ifOneExists(data, 1, "byte");
  [WeaponSelect, data] = ifOneExists(data, 11, "int");
  if (WeaponSelect !== null) [WeaponSubtype, data] = ifOneExists(data, 6, "int");
  else WeaponSubtype = null;
  [MouseDx, data] = ifOneExists(data, 16, "short");
  [MouseDy, data] = ifOneExists(data, 16, "short");

  UserCmdMsg.Data.CommandNumber = CommandNumber;
  UserCmdMsg.Data.TickCount = TickCount;
  UserCmdMsg.Data.ViewAnglesX = ViewAnglesX;
  UserCmdMsg.Data.ViewAnglesY = ViewAnglesY;
  UserCmdMsg.Data.ViewAnglesZ = ViewAnglesZ;
  UserCmdMsg.Data.ForwardMove = ForwardMove;
  UserCmdMsg.Data.SideMove = SideMove;
  UserCmdMsg.Data.UpMove = UpMove;
  UserCmdMsg.Data.Buttons = Buttons;
  UserCmdMsg.Data.Impulse = Impulse;
  UserCmdMsg.Data.WeaponSelect = WeaponSelect;
  UserCmdMsg.Data.WeaponSubtype = WeaponSubtype;
  UserCmdMsg.Data.MouseDx = MouseDx;
  UserCmdMsg.Data.MouseDy = MouseDy;

  UserCmdMsg.OverheadSize = (13*8) + bitsToInt(bits, offset + 72, 32) * 8;


  return [UserCmdMsg, UserCmdMsg.OverheadSize, UserCmdMsg.Type, UserCmdMsg.Tick];
}

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