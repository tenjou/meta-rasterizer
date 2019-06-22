
class DepthBuffer {
	constructor(width, height) {
		this.width = width
		this.height = height
		this.buffer = new Uint16Array(width * height)
	}

	clear() {
		this.buffer.fill(65535)
	}

	get(x, y) {
		return this.buffer[x + (y * this.width)] / 65535
	}

	set(x, y, value) {
		this.buffer[x + (y * this.width)] = (value * 65535) | 0
	}

	test(x, y, value) {
		const valueNew = (value * 65535) | 0
		if(valueNew < 0 || value > 65535) {
			return false
		}
		const index = x + (y * this.width)
		if(valueNew < this.buffer[index]) {
			this.buffer[index] = valueNew
			return true
		}
		return false
	}
}

export default DepthBuffer