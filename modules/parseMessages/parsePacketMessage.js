import { bitsToInt, readFloatArr } from "../bitReader.js";

const parsePacketMessage = (offset, bits) => {
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

export {parsePacketMessage};