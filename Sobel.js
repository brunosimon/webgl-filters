import { Program, Mesh, Vec2, Geometry, RenderTarget } from 'ogl'
import FullQuadGeometry from './FullQuadGeometry'

export default class Sobel
{
    constructor(renderer, texture, width, height)
    {
        this.renderer = renderer
        this.texture = texture
        
        this.gl = this.renderer.gl
        this.width = width
        this.height = height

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

                const float PI = 3.14159265359;

                uniform sampler2D texture;
                uniform vec2 texel;

                varying vec2 vUv;

                /**
                * Convert RGB color to grayscale while preserving luminance
                */
                float luminance(vec3 color)
                {
                    return dot(color, vec3(0.2126, 0.7152, 0.0722));
                }

                /**
                * Detect edge using sobel
                */
                vec2 sobel(sampler2D texture, vec2 uv, vec2 texel)
                {
                    //     index                 x                   y
                    // -------------    // -------------    // -------------
                    //   0 | 1 | 2      //  -1 | 0 | 1      //  -1 |-2 |-1
                    // -------------    // -------------    // -------------
                    //   3 | 4 | 5      //  -2 | 0 | 2      //   0 | 0 | 0
                    // -------------    // -------------    // -------------
                    //   6 | 7 | 8      //  -1 | 0 | 1      //   1 | 2 | 1
                    // -------------    // -------------    // -------------

                    float c0 = luminance(texture2D(texture, uv + vec2(-texel.x, texel.y)).rgb);
                    float c1 = luminance(texture2D(texture, uv + vec2(0, texel.y)).rgb);
                    float c2 = luminance(texture2D(texture, uv + vec2(texel.x, texel.y)).rgb);
                    
                    float c3 = luminance(texture2D(texture, uv + vec2(-texel.x, 0)).rgb);
                    // float c4 = luminance(texture2D(texture, uv + vec2(0, 0)).rgb);
                    float c5 = luminance(texture2D(texture, uv + vec2(texel.x, 0)).rgb);
                    
                    float c6 = luminance(texture2D(texture, uv + vec2(-texel.x, -texel.y)).rgb);
                    float c7 = luminance(texture2D(texture, uv + vec2(0, -texel.y)).rgb);
                    float c8 = luminance(texture2D(texture, uv + vec2(texel.x, - texel.y)).rgb);

                    float edgeX = - (c0 + c3 * 2.0 + c6) + (c2 + c5 * 2.0 + c8);
                    float edgeY = - (c0 + c1 * 2.0 + c2) + (c6 + c7 * 2.0 + c8);
                    float edge = sqrt(pow(edgeX, 2.0) + pow(edgeY, 2.0));
                    float angle = atan(edgeY, edgeX);

                    return vec2(edge, angle);
                }

                /**
                * Convert HSV to RGB
                */
                vec3 hsv2rgb(vec3 c)
                {
                    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
                }

                void main()
                {

                    vec2 edge = sobel(texture, vUv, texel);
                    vec3 color = hsv2rgb(vec3(edge.y / (PI * 2.0), 1.0, 1.0));
                    color *= edge.x;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            uniforms:
            {
                texture: { value: this.texture },
                texel: { value: new Vec2(1 / this.width, 1 / this.height) }
            }
        })

        this.geometry = new FullQuadGeometry(this.gl)

        this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program })

        this.renderTarget = new RenderTarget(this.gl, { width: this.width, height: this.height })
        this.output = this.renderTarget.texture

        this.render()
    }

    render()
    {
        this.renderer.render({ scene: this.mesh, target: this.renderTarget })
    }
}