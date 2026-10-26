/**
 * Gerador de Arquivo ZIP Client-Side sem dependências externas pesadas
 * Implementa o formato padrão PKZIP (RFC 1951 / APPNOTE.TXT) com compressão Store (sem compressão ou Deflate básico)
 * para empacotar SVGs, PNGs, JPGs e TXTs diretamente no browser.
 */

export interface ZipFileEntry {
  name: string
  data: Uint8Array | string
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

// Tabela CRC32 pré-calculada
const CRC_TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  CRC_TABLE[i] = c
}

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/**
 * Cria um Blob ZIP válido no padrão ZIP standard (Store method = 0)
 */
export function createSimpleZip(entries: ZipFileEntry[]): Blob {
  const parts: Uint8Array[] = []
  const centralDirectoryHeaders: Uint8Array[] = []
  let offset = 0

  const now = new Date()
  const dosTime =
    ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff
  const dosDate =
    (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff

  for (const entry of entries) {
    const fileBytes = typeof entry.data === 'string' ? stringToUint8Array(entry.data) : entry.data
    const nameBytes = stringToUint8Array(entry.name)
    const crc = calculateCrc32(fileBytes)
    const uncompressedSize = fileBytes.length
    const compressedSize = fileBytes.length

    // Local file header (30 bytes)
    const localHeader = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(localHeader.buffer)
    lv.setUint32(0, 0x04034b50, true) // Signature
    lv.setUint16(4, 20, true) // Version needed (2.0)
    lv.setUint16(6, 0x0800, true) // Flags: UTF-8 filename
    lv.setUint16(8, 0, true) // Compression method: 0 = Store
    lv.setUint16(10, dosTime, true)
    lv.setUint16(12, dosDate, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, compressedSize, true)
    lv.setUint32(22, uncompressedSize, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true) // Extra field length
    localHeader.set(nameBytes, 30)

    parts.push(localHeader)
    parts.push(fileBytes)

    // Central directory header (46 bytes)
    const cdHeader = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cdHeader.buffer)
    cv.setUint32(0, 0x02014b50, true) // Signature
    cv.setUint16(4, 20, true) // Version made by
    cv.setUint16(6, 20, true) // Version needed
    cv.setUint16(8, 0x0800, true) // Flags UTF-8
    cv.setUint16(10, 0, true) // Compression method: Store
    cv.setUint16(12, dosTime, true)
    cv.setUint16(14, dosDate, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, compressedSize, true)
    cv.setUint32(24, uncompressedSize, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true) // Extra field length
    cv.setUint16(32, 0, true) // Comment length
    cv.setUint16(34, 0, true) // Disk number start
    cv.setUint16(36, 0, true) // Internal attrs
    cv.setUint32(38, 0, true) // External attrs
    cv.setUint32(42, offset, true) // Relative offset of local header
    cdHeader.set(nameBytes, 46)

    centralDirectoryHeaders.push(cdHeader)

    offset += localHeader.length + fileBytes.length
  }

  const cdOffset = offset
  let cdSize = 0
  for (const cdh of centralDirectoryHeaders) {
    parts.push(cdh)
    cdSize += cdh.length
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true) // Signature
  ev.setUint16(4, 0, true) // Disk number
  ev.setUint16(6, 0, true) // Disk with central directory
  ev.setUint16(8, entries.length, true) // Number of entries on this disk
  ev.setUint16(10, entries.length, true) // Total entries
  ev.setUint32(12, cdSize, true) // Size of central directory
  ev.setUint32(16, cdOffset, true) // Offset of central directory
  ev.setUint16(20, 0, true) // Comment length
  parts.push(eocd)

  // Junta todas as partes em um único Blob de tipo ZIP
  return new Blob(parts as any, { type: 'application/zip' })
}
