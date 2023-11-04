const parseStopMessage = (offset, bits) => {
  let StopMsg = [
    {
      "Type": 7
    }
  ]
  
  return [StopMsg[0], 0, 7];
}

export {parseStopMessage};