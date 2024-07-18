import { Program, Mesh, Vec2, Geometry, RenderTarget } from 'ogl'
import GaussianBlur from './GaussianBlur.js'

export default class MultipassGaussianBlur
{
    constructor(renderer, texture, width, height, samples = 4)
    {
        this.renderer = renderer
        this.texture = texture
        this.samples = samples
        
        this.gl = this.renderer.gl
        this.width = width
        this.height = height
        this.count = 0

        this.renderTargets = [
            new RenderTarget(this.gl, { width: this.width, height: this.height }),
            new RenderTarget(this.gl, { width: this.width, height: this.height })
        ]
        this.output = this.renderTargets[0].texture

        this.blurs = []
        for(let i = 0; i < this.samples; i++)
        {
            const textureInput = i === 0 ? this.texture : this.renderTargets[(i + 1) % 2].texture
            this.blurs.push(new GaussianBlur(this.renderer, textureInput, this.width, this.height, this.renderTargets[i % 2], i + 1, i + 1))
        }

        this.output = this.renderTargets[this.samples % 2].texture
    }

    render()
    {
        for(let i = 0; i < this.samples; i++)
        {
            const blur = this.blurs[i]
            blur.render()
        }
    }
}