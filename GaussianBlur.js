import { Program, Mesh, Vec2, Geometry, RenderTarget } from 'ogl'

export default class GaussianBlur
{
    constructor(renderer, texture, width, height, target, kernelExtent = 1, texelSpread = 1)
    {
        this.renderer = renderer
        this.texture = texture
        this.target = target
        this.kernelExtent = kernelExtent
        this.texelSpread = texelSpread
        
        this.gl = this.renderer.gl
        this.width = width
        this.height = height
        this.kernel = this.getKernel()

        const texelX = 1 / width
        const texelY = 1 / height

        let kernelShader = /* glsl */'vec3 blurredColor = vec3(0.0);\n'

        for(let x = 0; x < this.kernel.length; x++)
        {
            const offsetX = (x - this.kernelExtent) * texelX * this.texelSpread

            for(let y = 0; y < this.kernel.length; y++)
            {
                const offsetY = (y - this.kernelExtent) * texelY * this.texelSpread
                kernelShader += /* glsl */`blurredColor += texture2D(texture, vUv + vec2(${offsetX}, ${offsetY})).rgb * ${this.kernel[x][y]};\n`
            }
        }

        this.program = new Program(this.gl, {
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
                uniform vec2 resolution;

                varying vec2 vUv;

                void main()
                {
                    ${kernelShader}

                    gl_FragColor = vec4(blurredColor, 1.0);
                }
            `,
            uniforms:
            {
                texture: { value: this.texture },
                resolution: { value: new Vec2(this.width, this.height) }
            }
        })

        this.geometry = new Geometry(this.gl, {
            position: { size: 2, data: new Float32Array([ 1, 1, -1, 1, -1, -1, /* */ -1, -1, 1, -1, 1, 1 ]) },
            uv: { size: 2, data: new Float32Array([ 1, 1, 0, 1, 0, 0, /* */ 0, 0, 1, 0, 1, 1 ]) },
        })

        this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program })
        
        // this.output = this.target.texture
    }

    getKernel()
    {
        const size = 1 + this.kernelExtent * 2
        const mean = this.kernelExtent
        let sum = 0
        
        const kernel = []

        for(let x = 0; x < size; x++)
        {
            kernel.push([])

            for(let y = 0; y < size; y++)
            {
                const value = Math.exp(- 0.5 * (Math.pow(x - mean, 2.0) + Math.pow(y - mean, 2.0))) / (2 * Math.PI)

                sum += value;
                
                kernel[x][y] = value
            }
        }

        for(let x = 0; x < size; x++)
            for(let y = 0; y < size; y++)
                kernel[x][y] /= sum

        return kernel
    }

    render()
    {
        this.program.uniforms.texture.value = this.texture
        this.renderer.render({ scene: this.mesh, target: this.target })
    }
}