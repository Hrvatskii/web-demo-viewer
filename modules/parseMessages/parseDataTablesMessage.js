import { bitsToInt } from "../bitReader.js";

const parseDataTablesMessage = (offset, bits) => {
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

  const OverheadSize = 9 + bitsToInt(bits, offset + 5, 4);

  // console.log("fuck", OverheadSize, offset)

  return [[], OverheadSize];
}

export {parseDataTablesMessage};