import { crc32, deflateRawSync } from "node:zlib"

export interface ZipEntry {
	name: string
	bytes: Uint8Array
}

const LOCAL_HEADER = 0x04034b50
const DIRECTORY_ENTRY = 0x02014b50
const END_OF_DIRECTORY = 0x06054b50
const VERSION = 20
const UTF8_NAMES = 0x0800
const DEFLATED = 8
const JANUARY_1ST_1980 = (1 << 5) | 1

export function zip(entries: ZipEntry[]) {
	const encoder = new TextEncoder()
	const parts: Uint8Array[] = []
	const directory: Uint8Array[] = []
	let offset = 0

	for (const { name, bytes } of entries) {
		const path = encoder.encode(name)
		const data = deflateRawSync(bytes)
		const crc = crc32(bytes)

		const local = new Uint8Array(30 + path.length)
		const head = new DataView(local.buffer)
		head.setUint32(0, LOCAL_HEADER, true)
		head.setUint16(4, VERSION, true)
		head.setUint16(6, UTF8_NAMES, true)
		head.setUint16(8, DEFLATED, true)
		head.setUint16(12, JANUARY_1ST_1980, true)
		head.setUint32(14, crc, true)
		head.setUint32(18, data.length, true)
		head.setUint32(22, bytes.length, true)
		head.setUint16(26, path.length, true)
		local.set(path, 30)

		const entry = new Uint8Array(46 + path.length)
		const row = new DataView(entry.buffer)
		row.setUint32(0, DIRECTORY_ENTRY, true)
		row.setUint16(4, VERSION, true)
		row.setUint16(6, VERSION, true)
		row.setUint16(8, UTF8_NAMES, true)
		row.setUint16(10, DEFLATED, true)
		row.setUint16(14, JANUARY_1ST_1980, true)
		row.setUint32(16, crc, true)
		row.setUint32(20, data.length, true)
		row.setUint32(24, bytes.length, true)
		row.setUint16(28, path.length, true)
		row.setUint32(42, offset, true)
		entry.set(path, 46)

		parts.push(local, data)
		directory.push(entry)
		offset += local.length + data.length
	}

	const directorySize = directory.reduce((total, entry) => total + entry.length, 0)
	const end = new Uint8Array(22)
	const tail = new DataView(end.buffer)
	tail.setUint32(0, END_OF_DIRECTORY, true)
	tail.setUint16(8, entries.length, true)
	tail.setUint16(10, entries.length, true)
	tail.setUint32(12, directorySize, true)
	tail.setUint32(16, offset, true)

	return Buffer.concat([...parts, ...directory, end])
}
