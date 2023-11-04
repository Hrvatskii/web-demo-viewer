
const parseSyncTickMessage = (offset, bits) => {
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

export {parseSyncTickMessage};