function rotateLeft(value, shift) {
  return (value << shift) | (value >>> (32 - shift))
}

function toBytes(input) {
  const text = unescape(encodeURIComponent(String(input)))
  const bytes = []
  for (let index = 0; index < text.length; index += 1) bytes.push(text.charCodeAt(index))
  return bytes
}

function md5(input) {
  const bytes = toBytes(input)
  const bitLength = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  for (let index = 0; index < 8; index += 1) bytes.push(index < 4 ? (bitLength >>> (index * 8)) & 0xff : 0)

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ]
  const constants = shifts.map((_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) | 0)
  let a0 = 0x67452301
  let b0 = 0xefcdab89 | 0
  let c0 = 0x98badcfe | 0
  let d0 = 0x10325476

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words = []
    for (let index = 0; index < 16; index += 1) {
      const start = offset + index * 4
      words[index] = bytes[start] | (bytes[start + 1] << 8) | (bytes[start + 2] << 16) | (bytes[start + 3] << 24)
    }
    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let index = 0; index < 64; index += 1) {
      let value
      let wordIndex
      if (index < 16) {
        value = (b & c) | (~b & d)
        wordIndex = index
      } else if (index < 32) {
        value = (d & b) | (~d & c)
        wordIndex = (5 * index + 1) % 16
      } else if (index < 48) {
        value = b ^ c ^ d
        wordIndex = (3 * index + 5) % 16
      } else {
        value = c ^ (b | ~d)
        wordIndex = (7 * index) % 16
      }
      const previousD = d
      d = c
      c = b
      b = (b + rotateLeft((a + value + constants[index] + words[wordIndex]) | 0, shifts[index])) | 0
      a = previousD
    }
    a0 = (a0 + a) | 0
    b0 = (b0 + b) | 0
    c0 = (c0 + c) | 0
    d0 = (d0 + d) | 0
  }

  return [a0, b0, c0, d0].map((word) => {
    let output = ''
    for (let index = 0; index < 4; index += 1) output += (`0${(word >>> (index * 8) & 0xff).toString(16)}`).slice(-2)
    return output
  }).join('')
}

module.exports = md5
