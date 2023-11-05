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
  let arr = [];
  for (let i = 0; i < count; i++) {
    let floats = isolateBytes(data, index, length / 3);
    // console.log("floats", floats, length / 3)
    arr.push(bitsToFloat(floats, 0, 4));
    index += (length / 3); 
  }
  return arr;
}

// this converts a series of bits to little endian which means that we seperate the bytes and reverse their order eg.
// 00000001 10000000 11111111 10101010 (00000001100000001111111110101010) to
// 10101010 11111111 10000000 00000001 (10101010111111111000000000000001)
function convertToLittleEndian(bits) {
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.substr(i, 8);
    bytes.push(byte);
  }

  bytes.reverse();
  return bytes.join('');
}

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

// // optimize this in the future pretty please
// const ifOneExists = (data, length, type) => {
//   // see https://imgur.com/a/LRoI4r2

//   // find pointer index using *math*
//   const pointer = (data.length - 1) % 8;
//   //console.log("pointer", pointer);
//   if (data[pointer] === "1") {
//     //console.log("one exists, parse next ", length, " looking at ", type);
//     // declare array for little endian bits
//     let bitsLittleEndian = [];

//     // first bits, these are the remaining ones to the left of the pointer
//     bitsLittleEndian.unshift(data.substr(0, pointer));

//     // the next whole bytes
//     for (let i = 0; i < 8 * (Math.floor((length - pointer) / 8)); i += 8) {
//       bitsLittleEndian.unshift(data.substr(pointer + 1 + i, 8));
//     }

//     // remove everything before the next "full" byte
//     data = data.substr(8 * (Math.floor((length - pointer) / 8)) + pointer + 1, data.length);

//     // add the extra bits we need to compensate the first byte being shorter
//     bitsLittleEndian.unshift(data.substr(pointer, 8 - pointer));

//     //... and then remove those from the main data
//     data = data.substr(0, pointer) + data.substr(8, data.length);

//     // make the little endian bits into a string so we can process them
//     bitsLittleEndian = bitsLittleEndian.join("");

//     if (type === "int") {
//       // convert to unsigned integer then signed integer
//       const uint32Value = parseInt(bitsLittleEndian, 2);
//       const int32Value = uint32Value | 0;

//       return [int32Value, data];
//     } else if (type === "float") {
//       // convert the bits into a hexadecimal string
//       const hex = parseInt(bitsLittleEndian, 2).toString(16);

//       // convert the hexadecimal string into a float representation
//       const buffer = new ArrayBuffer(4);
//       const intView = new Uint32Array(buffer);
//       const floatView = new Float32Array(buffer);

//       intView[0] = parseInt(hex, 16);

//       return [floatView[0].toFixed(2), data];
//     } else if (type === "byte") {
//       // i think only Impulse has this data type so it's safe assuming it's only gonna be one byte
//       const byte = parseInt(bitsLittleEndian, 2) // turn into base 10
//                   .toString(16)                  // turn into base 16
//                   .padStart(2, "0");             // pad with 0 to make it two letters long

//       return [byte, data];
//     } else if (type === "short") {
//       const short = parseInt(bitsLittleEndian, 2) << 16 >> 16;
//       return [short, data];
//     }
//   } else {
//     //console.log("one doesnt exist, skip to next");
//     data = data.substr(0, pointer) + data.substr(pointer + 1, data.length);
//     return [null, data];
//   }
// }

const ifOneExists = (data, index, length, type, bitPointer) => {
  // console.log(data, length, type);
  data = [...data];

  //let isolatedBytes = isolateBytes(data, index, index + length + 1);

  // console.log("isolated: ", isolatedBytes);

  if (data[index] & (1 << bitPointer)) {
    //console.log("bit found. continuing.");
    // makes every bit less significant than the pointer a 0 in the first byte
    // data[index] = data[index] >> (bitPointer + 1) << (bitPointer + 1)

    // creates a mask that will be only ones in the places to the right of the pointer in the last byte which we're "borrowing"
    const mask = (1 << bitPointer) - 1;

    // uses the mask to find only the bits that we will need to complete the field
    data[index + length] &= mask;

    // console.log("isolated new:", bitsToInt(data, index, length + 1) >> (bitPointer + 1), isolateBytes(data, index, length + 1))

    switch (type) {
      case "int": return [bitsToInt(data, index, length + 1) >> (bitPointer + 1), index + length];
      case "float":
      case "short":
      case "byte":
        return [null, index + length]; // i dont give a shit
    }

  } else {
    return [null, index];
  }
}

export { bitsToString, bitsToInt, bitsToFloat, readFloatArr, ifOneExists, isolateBytes }; 