// ******************************************************************************
// * Module that contains the functions for turning file data into usable data. *
// ******************************************************************************

// use to convert bits to a string format
const bitsToString = (bits, index, length) => {
  // isolates the bits for the current field and removes zeroes at the end
  let truncStr = bits.substring(index, index + length).replace(/0+$/, '');

  // adds 0 to the end of truncString to make the length of it a multiple of 8, eg.
  // 0111000001101111011100100111010001100001011011   (.length = 46) to
  // 011100000110111101110010011101000110000101101100 (.length = 48)
  truncStr = truncStr.padEnd(8 * Math.ceil(truncStr.length / 8), '0');

  // splits truncStr to some amount of strings with the length 8, for instance 011100000110111101110010011101000110000101101100 => 01110000 01101111 etc
  // replaces the splits with whatever character matches up with the part eg. 01110000 => "p"
  return truncStr.replace(/[01]{8}/g, function (v) {
    return String.fromCharCode(parseInt(v, 2));
  });
}

// use to convert bits to signed integer
const bitsToInt = (bits, index, length) => {
  // isolates the bits and converts them to little endian
  let isolatedBits = bits.substring(index, index + length);
  isolatedBits = convertToLittleEndian(isolatedBits);

  // convert to unsigned integer then signed integer
  const uint32Value = parseInt(isolatedBits, 2);
  const int32Value = uint32Value | 0;
  
  // return signed integer (supports negative numbers!)
  return int32Value;
}

// use to convert bits to float format
const bitsToFloat = (bits, index, length) => {
  // isolates the bits and converts them to little endian
  let isolatedBits = bits.substring(index, index + length);
  isolatedBits = convertToLittleEndian(isolatedBits);
  
  // convert the bits into a hexadecimal string
  const hex = parseInt(isolatedBits, 2).toString(16);

  // convert the hexadecimal string into a float representation
  const buffer = new ArrayBuffer(4);
  const intView = new Uint32Array(buffer);
  const floatView = new Float32Array(buffer);

  intView[0] = parseInt(hex, 16);

  // return the final value rounded to three decimals (removes floating point quirk)
  return floatView[0].toFixed(3);
}

const readFloatArr = (data, index, len, count) => {
  let arr = [];
  for (let i = 0; i < count; i++) {
    let floats = data.substring(index, index + (len / 3));
    arr.push(bitsToFloat(floats, 0, 32));
    index += (len / 3); 
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

// optimize this in the future pretty please
const ifOneExists = (data, length, type) => {
  // see https://imgur.com/a/LRoI4r2

  // find pointer index using *math*
  const pointer = (data.length - 1) % 8;
  //console.log("pointer", pointer);
  if (data[pointer] === "1") {
    //console.log("one exists, parse next ", length, " looking at ", type);
    // declare array for little endian bits
    let bitsLittleEndian = [];

    // first bits, these are the remaining ones to the left of the pointer
    bitsLittleEndian.unshift(data.substr(0, pointer));

    // the next whole bytes
    for (let i = 0; i < 8 * (Math.floor((length - pointer) / 8)); i += 8) {
      bitsLittleEndian.unshift(data.substr(pointer + 1 + i, 8));
    }

    // remove everything before the next "full" byte
    data = data.substr(8 * (Math.floor((length - pointer) / 8)) + pointer + 1, data.length);

    // add the extra bits we need to compensate the first byte being shorter
    bitsLittleEndian.unshift(data.substr(pointer, 8 - pointer));

    //... and then remove those from the main data
    data = data.substr(0, pointer) + data.substr(8, data.length);

    // make the little endian bits into a string so we can process them
    bitsLittleEndian = bitsLittleEndian.join("");

    if (type === "int") {
      // convert to unsigned integer then signed integer
      const uint32Value = parseInt(bitsLittleEndian, 2);
      const int32Value = uint32Value | 0;

      return [int32Value, data];
    } else if (type === "float") {
      // convert the bits into a hexadecimal string
      const hex = parseInt(bitsLittleEndian, 2).toString(16);

      // convert the hexadecimal string into a float representation
      const buffer = new ArrayBuffer(4);
      const intView = new Uint32Array(buffer);
      const floatView = new Float32Array(buffer);

      intView[0] = parseInt(hex, 16);

      return [floatView[0].toFixed(2), data];
    } else if (type === "byte") {
      // i think only Impulse has this data type so it's safe assuming it's only gonna be one byte
      const byte = parseInt(bitsLittleEndian, 2) // turn into base 10
                  .toString(16)                  // turn into base 16
                  .padStart(2, "0");             // pad with 0 to make it two letters long

      return [byte, data];
    } else if (type === "short") {
      const short = parseInt(bitsLittleEndian, 2) << 16 >> 16;
      return [short, data];
    }
  } else {
    //console.log("one doesnt exist, skip to next");
    data = data.substr(0, pointer) + data.substr(pointer + 1, data.length);
    return [null, data];
  }
}

export { bitsToString, bitsToInt, bitsToFloat, readFloatArr, ifOneExists };