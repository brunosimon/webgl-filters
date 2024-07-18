import { Geometry } from 'ogl'

export default function(gl)
{
    return new Geometry(gl, {
        position: { size: 2, data: new Float32Array([ 1, 1, -1, 1, -1, -1, /* */ -1, -1, 1, -1, 1, 1 ]) },
        uv: { size: 2, data: new Float32Array([ 1, 1, 0, 1, 0, 0, /* */ 0, 0, 1, 0, 1, 1 ]) },
    })
}