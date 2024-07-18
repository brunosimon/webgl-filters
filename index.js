import { Renderer, Program, Mesh, Geometry, Texture, RenderTarget } from 'ogl'
import GaussianBlur from './GaussianBlur.js'
import Sobel from './Sobel.js'
import MultipassGaussianBlur from './MultipassGaussianBlur.js'

/**
 * Base image
 */
const image = await new Promise((resolve) =>
{
    const image = new Image()

    image.onload = () => {
        resolve(image)
    }
    image.src = 'image-1.png'
    document.body.append(image)
})

/**
 * Setup
 */
const renderer = new Renderer()
renderer.setSize(image.width, image.height)
const gl = renderer.gl
document.body.append(gl.canvas)

const geometry = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([ 1, 1, -1, 1, -1, -1, /* */ -1, -1, 1, -1, 1, 1 ]) },
    uv: { size: 2, data: new Float32Array([ 1, 1, 0, 1, 0, 0, /* */ 0, 0, 1, 0, 1, 1 ]) },
})

/**
 * Result
 */
const texture = new Texture(gl)
texture.image = image

const multipassGaussianBlur = new MultipassGaussianBlur(renderer, texture, texture.image.width, texture.image.height, 3)
multipassGaussianBlur.render()

const sobel = new Sobel(renderer, multipassGaussianBlur.output, texture.image.width, texture.image.height)
sobel.render()

const program = new Program(gl, {
    vertex: /* glsl */`
        attribute vec2 position;
        attribute vec2 uv;

        varying vec2 vUv;

        void main() {
            gl_Position = vec4(position, 0.0, 1.0);

            vUv = uv;
        }
    `,
    fragment: /* glsl */`
        precision highp float;

        uniform sampler2D texture;

        varying vec2 vUv;

        void main()
        {
            gl_FragColor = texture2D(texture, vUv);
        }
    `,
    uniforms:
    {
        texture: { value: multipassGaussianBlur.output }
    }
})
const mesh = new Mesh(gl, { geometry, program })
renderer.render({ scene: mesh })
