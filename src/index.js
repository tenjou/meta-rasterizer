import OBJ from "./OBJ"
import Vector2 from "./Vector2"
import Vector3 from "./Vector3"
import DepthBuffer from "./DepthBuffer"

const width = 1024
const height = 768
const centerX = width * 0.5
const centerY = height * 0.5
const scale = 350
const zFar = -2.5
const zNear = 2.5

let canvas = null
let ctx = null
let imgData = null
let data = null
let mesh = null
let tPrev = Date.now()
let fps = 0
let elementFps = null
let elementMs = null

const transformedA = new Vector3(0, 0, 0)
const transformedB = new Vector3(0, 0, 0)
const transformedC = new Vector3(0, 0, 0)
const depthBuffer = new DepthBuffer(width, height)

const init = () => {
	canvas = document.createElement("canvas")
	canvas.width = width
	canvas.height = height
	document.body.appendChild(canvas)

	const container = document.createElement("div")
	elementFps = document.createElement("fps")
	elementMs = document.createElement("ms")
	container.appendChild(elementFps)
	container.appendChild(elementMs)
	document.body.appendChild(container)

	ctx = canvas.getContext("2d")
	imgData = ctx.getImageData(0, 0, width, height)
	data = imgData.data

	requestAnimationFrame(renderFunc)
}

const load = () => {
	fetch("assets/head.obj")
	.then(response => response.text())
	.then(text => {
		mesh = OBJ.parse(text)
	})
}

const renderFunc = () => {
	const tFrameStart = Date.now()

	if(mesh) {
		render()
	}

	let tNow = Date.now()
	fps++
	if(tNow - tPrev >= 1000) {
		elementFps.innerHTML = fps
		elementMs.innerHTML = `${tNow - tFrameStart} ms`
		fps = 0
		tPrev = tNow
	}	

	requestAnimationFrame(renderFunc)
}

const render = () => {
	for(let n = 0; n < data.length; n += 4) {
		data[n + 0] = 0
		data[n + 1] = 0
		data[n + 2] = 0
		data[n + 3] = 255
	}

	depthBuffer.clear()

	const faces = mesh.faces
	for(let n = 0; n < faces.length; n++) {
		const face = faces[n]
		const a = mesh.vertices[face[0]]
		const b = mesh.vertices[face[1]]
		const c = mesh.vertices[face[2]]

		if(isCounterClockwise(a, b, c)) {
			transformedA.x = centerX + a.x * scale
			transformedA.y = centerY - a.y * scale
			transformedA.z = (a.z - zNear) / (zFar - zNear)

			transformedB.x = centerX + b.x * scale
			transformedB.y = centerY - b.y * scale
			transformedB.z = (b.z - zNear) / (zFar - zNear)

			transformedC.x = centerX + c.x * scale
			transformedC.y = centerY - c.y * scale
			transformedC.z = (c.z - zNear) / (zFar - zNear)		

			drawTriangle(transformedA, transformedB, transformedC)
		}			
	}

	ctx.putImageData(imgData, 0, 0)
}

const isCounterClockwise = (a, b, c) => {
	return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) >= 0
}

const cross = (a, b, cx, cy) => {
	return (b.x - a.x) * -(cy - a.y) - -(b.y - a.y) * (cx - a.x)
}

const drawTriangle = (a, b, c) => {
	const minX = Math.floor(Math.min(a.x, b.x, c.x))
	const minY = Math.floor(Math.min(a.y, b.y, c.y))
	const maxX = Math.ceil(Math.max(a.x, b.x, c.x))
	const maxY = Math.ceil(Math.max(a.y, b.y, c.y))

	const area = cross(a, b, c.x, c.y)

	for(let y = minY; y < maxY; y++) {
		for(let x = minX; x < maxX; x++) {
			const px = x + 0.5
			const py = y + 0.5
			
			const w0 = cross(b, c, px, py)
			if(w0 < 0) continue

			const w1 = cross(c, a, px, py)
			if(w1 < 0) continue

			const w2 = cross(a, b, px, py)
			if(w2 < 0) continue

			const z = (w0 * a.z + w1 * b.z + w2 * c.z) / area
			if(depthBuffer.test(x, y, z)) {
				const depth = 1.0 - depthBuffer.get(x, y)
				const index = (x + (y * width)) * 4
				data[index + 0] = depth * 255 | 0
				data[index + 1] = depth * 255 | 0
				data[index + 2] = depth * 255 | 0				
			}
		}
	}
}

const drawLine = (x0, y0, x1, y1, r = 5, g = 5, b = 5) => {
	x0 |= 0
	y0 |= 0
	x1 |= 0
	y1 |= 0

	let yLonger = false
	let shortLen = y1 - y0
	let longLen = x1 - x0
	if(Math.abs(shortLen) > Math.abs(longLen)) {
		const swap = shortLen
		shortLen = longLen
		longLen = swap
		yLonger = true
	}

	let decInc
	if(longLen == 0) {
		decInc = 0
	}
	else {
		decInc = (shortLen << 16) / longLen
	}

	if(yLonger) {
		if(longLen > 0) {
			longLen += y0
			for(let x = 0x8000 + (x0 << 16); y0 <= longLen; y0++) {
				const index = ((x >> 16) + (y0 * width)) * 4
				data[index + 0] += r
				data[index + 1] += g
				data[index + 2] += b
				x += decInc
			}
			return
		}
		longLen += y0
		for(let x = 0x8000 + (x0 << 16); y0 >= longLen; y0--) {
			const index = ((x >> 16) + (y0 * width)) * 4
			data[index + 0] += r
			data[index + 1] += g
			data[index + 2] += b	
			x -= decInc
		}
		return
	}

	if(longLen > 0) {
		longLen += x0
		for(let y = 0x8000 + (y0 << 16); x0 <= longLen; x0++) {
			const index = (x0 + ((y >> 16) * width)) * 4
			data[index + 0] += r
			data[index + 1] += g
			data[index + 2] += b
			y += decInc
		}
		return
	}
	longLen += x0
	for(let y = 0x8000 + (y0 << 16); x0 >= longLen; x0--) {
		const index = (x0 + ((y >> 16) * width)) * 4
		data[index + 0] += r
		data[index + 1] += g
		data[index + 2] += b		
		y -= decInc
	}
}

export default function main() {
	init()
	load()
}

