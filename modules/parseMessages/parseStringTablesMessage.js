import { bitsToInt } from "../bitReader.js";

const parseStringTablesMessage = (offset, bits) => {
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

  const OverheadSize = 9 + bitsToInt(bits, offset + 5, 4);

  return [[], OverheadSize];
}

export {parseStringTablesMessage};