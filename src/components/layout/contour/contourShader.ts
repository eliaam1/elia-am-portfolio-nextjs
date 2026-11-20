/**
 * The contour background's shaders (WebGL 1 + OES_standard_derivatives).
 *
 * Slow topographic lines from 3D simplex noise, iso-lines at `uBands` steps.
 * The cursor bulges the field (more the faster it moves: `uPace`) and lines
 * near it turn lime (`uGlowAmt`). After landonorris.com's data-gl="background".
 */

export const CONTOUR_VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';

export const CONTOUR_FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uPace;
uniform vec3 uBg; uniform vec3 uLine; uniform vec3 uGlow;
uniform float uBands; uniform float uWarp; uniform float uGlowR; uniform float uGlowAmt; uniform float uThick;
// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT)
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
 vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
 vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
 i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
 float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
 vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
 vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
 return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float d = distance(uv, uMouse);
  float cursor = clamp((1. - d * 3.) * uPace, -.75, 1.);
  float drift = .5 + .5 * snoise(vec3(uv, uTime * .01));
  float n = .5 + .5 * snoise(vec3(uv + cursor * uWarp + drift * .5, uTime * .1));
  float k = n * uBands;
  float f = fract(k);
  float edge = min(f, 1. - f) / max(fwidth(k), 1e-4);
  float line = 1. - smoothstep(0., uThick, edge);
  float glow = smoothstep(uGlowR, 0., d) * uGlowAmt;
  gl_FragColor = vec4(mix(uBg, mix(uLine, uGlow, glow), line), 1.);
}`;

export const CONTOUR_UNIFORMS = [
  'uRes', 'uTime', 'uMouse', 'uPace', 'uBg', 'uLine', 'uGlow', 'uBands', 'uWarp', 'uGlowR', 'uGlowAmt', 'uThick',
] as const;
export type ContourUniform = (typeof CONTOUR_UNIFORMS)[number];
