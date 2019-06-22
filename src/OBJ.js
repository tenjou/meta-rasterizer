import Mesh from "./Mesh"
import Vector3 from "./Vector3"

const parse = (text) => {
	const mesh = new Mesh()
	const lines = text.replace("\r", "").split("\n")

	for(let n = 0; n < lines.length; n++) {
		const line = lines[n].split(" ")
		switch(line[0]) {
			case "v": {
				mesh.vertices.push(new Vector3( 
					parseFloat(line[1]), 
					parseFloat(line[2]), 
					parseFloat(line[3]) 
				))
			} break

			case "f": {
				const f1 = line[1].split("/")
				const f2 = line[2].split("/")
				const f3 = line[3].split("/")
				mesh.faces.push([ 
					parseInt(f1[0] - 1, 10),
					parseInt(f2[0] - 1, 10),
					parseInt(f3[0] - 1, 10)
				])
			} break
		}
	}
	
	return mesh
}

export { parse }