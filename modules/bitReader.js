// ******************************************************************************
// * Module that contains the functions for turning file data into usable data. *
// ******************************************************************************


// use to convert data to a string format
const bitsToString = (data, index, length) => {
  
  const isolatedBytes = Array.from(isolateBytes(data, index, length));

  // console.log(isolatedBytes)
  return isolatedBytes.map((byte) => String.fromCharCode(byte)).join("");
}

// use to convert data to signed integer
const bitsToInt = (data, index, length) => {
  // isolates the data and convert to little endian
  let isolatedBytes = isolateBytes(data, index, length).reverse();

  // Combine the bytes into a 32-bit integer
  let result = 0;
  for (let i = 0; i < isolatedBytes.length; i++) {
    result = (result << 8) | isolatedBytes[i];
  }

  // If the most significant bit (MSB) is set, it's a negative number
  if (isolatedBytes[0] & 0x80) {
    // Convert it to a signed integer
    result -= 1 << (8 * isolatedBytes.length);
  }

  return result;
}

// use to convert data to float format
const bitsToFloat = (data, index, length) => {
  const signedInt = bitsToInt(data, index, length);
  
  // convert the signed integer into a float representation
  const buffer = new ArrayBuffer(4);
  const intView = new Uint32Array(buffer);
  const floatView = new Float32Array(buffer);

  intView[0] = signedInt;

  // return the final value rounded to three decimals (removes floating point quirk)
  return floatView[0].toFixed(3);
}

const readFloatArr = (data, index, length, count) => {
  const floatsLength = length / 3;
  const arr = [];

  for (let i = 0; i < count; i++) {
    const floats = isolateBytes(data, index, floatsLength);
    arr.push(bitsToFloat(floats, 0, 4));
    index += floatsLength;
  }

  return arr;
};

function isolateBytes(data, index, length) {
  // Calculate the start and end bytes
  const startByteIndex = Math.floor(index);
  const endByteIndex = Math.ceil(index + length);

  // Extract relevant bits within start and end bytes
  if (index !== Math.floor(index)) {
    const startBitOffset = index % 8;
    data[startByteIndex] &= (255 >> startBitOffset);
  }

  if ((index + length) !== Math.floor(index + length)) {
    const endBitOffset = 8 - ((index + length) % 8);
    data[endByteIndex - 1] &= (255 << endBitOffset);
  }

  // isolatedBytes now contains the relevant bits
  let isolatedBytes = data.slice(startByteIndex, endByteIndex);

  return isolatedBytes;
}

// this is stupid
// unsustainable if i want to parse something else in usercmd except for Buttons
// at least it makes parsing a lot faster lol
const ifOneExists = (data, index, length, type, bitPointer, name) => {
  // console.log(data, length, type);
  //data = [...data];

  //let isolatedBytes = isolateBytes(data, index, index + length + 1);

  // console.log("isolated: ", isolatedBytes);

  if (data[index] & (1 << bitPointer)) {

    if (!name) return [null, index + length];

    //console.log("bit found. continuing.");
    // makes every bit less significant than the pointer a 0 in the first byte
    // data[index] = data[index] >> (bitPointer + 1) << (bitPointer + 1)

    // creates a mask that will be only ones in the places to the right of the pointer in the last byte which we're "borrowing"
    const mask = (1 << bitPointer) - 1;

    // uses the mask to find only the bits that we will need to complete the field
    data[index + length] &= mask;

    // console.log("isolated new:", bitsToInt(data, index, length + 1) >> (bitPointer + 1), isolateBytes(data, index, length + 1))

    return [bitsToInt(data, index, length + 1) >> (bitPointer + 1), index + length];

    // switch (type) {
    //   case "int": 
    //   case "float":
    //   case "short":
    //   case "byte":
    //     return [null, index + length]; // i dont give a shit
    // }

  } else {
    return [null, index];
  }
}

export { bitsToString, bitsToInt, bitsToFloat, readFloatArr, ifOneExists, isolateBytes }; 