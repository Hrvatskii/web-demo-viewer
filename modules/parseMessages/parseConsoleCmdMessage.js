import { bitsToInt } from "../bitReader.js";

const parseConsoleCmdMessage = (offset, bits) => {
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

  const OverheadSize = 9 + bitsToInt(bits, offset + 5, 4);

  // console.log("consolecmd", OverheadSize)

  //const type = bitsToInt(bits, offset, 8);

  return [[], OverheadSize];
}

export {parseConsoleCmdMessage};