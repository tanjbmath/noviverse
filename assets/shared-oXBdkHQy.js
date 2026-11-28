import{b as V}from"./math-D7P4-h3g.js";import{G as C,f as A,g as R,s as F,u as L,e as H,B as j,J as d,K as I,j as W,U as D}from"./three-CJqfZSyd.js";function b({count:a,seed:i,minRadius:t,maxRadius:l,minSize:s,maxSize:r,minAlpha:c,maxAlpha:f,twinkleSpeed:m=1.6,flare:p=0,palette:w="mixed"}){const e=V(i),n=new Float32Array(a*3),h=new Float32Array(a*3),T=new Float32Array(a),z=new Float32Array(a),y=new Float32Array(a*2),u=new H;for(let o=0;o<a;o++){const P=e()*Math.PI*2,g=e()*2-1,k=Math.sqrt(Math.max(0,1-g*g)),M=t+e()*(l-t);n[o*3]=k*Math.cos(P)*M,n[o*3+1]=g*M,n[o*3+2]=k*Math.sin(P)*M;const S=e();w==="dust"?u.setHSL(.56+S*.1,.35,.62+e()*.28):S<.22?u.setHSL(.09+e()*.05,.55,.78+e()*.16):S<.58?u.setHSL(.57+e()*.06,.38,.8+e()*.18):u.setHSL(.61+e()*.07,.52,.64+e()*.26),h[o*3]=u.r,h[o*3+1]=u.g,h[o*3+2]=u.b;const G=e()**2.1;T[o]=s+G*(r-s),z[o]=c+e()*(f-c),y[o*2]=e()*Math.PI*2,y[o*2+1]=m*(.55+e()*.95)}const v=new j;v.setAttribute("position",new d(n,3)),v.setAttribute("aColor",new d(h,3)),v.setAttribute("aSize",new d(T,1)),v.setAttribute("aAlpha",new d(z,1)),v.setAttribute("aTwinkle",new d(y,2));const _=typeof devicePixelRatio=="number"?Math.min(devicePixelRatio,2):1,B=new F({uniforms:{uTime:{value:0},uPixelRatio:{value:_},uFlare:{value:p}},vertexShader:`
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      attribute vec2 aTwinkle;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vTwinkle;

      void main() {
        float pulse = 0.7 + 0.3 * sin(uTime * aTwinkle.y + aTwinkle.x);
        vColor = aColor;
        vAlpha = aAlpha;
        vTwinkle = pulse;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float distScale = 230.0 / max(24.0, -mvPosition.z);
        gl_PointSize = clamp(aSize * uPixelRatio * distScale * (0.88 + 0.16 * pulse), 1.2, 24.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,fragmentShader:`
      uniform float uFlare;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vTwinkle;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float core = exp(-d * d * 28.0);
        float halo = pow(max(0.0, 1.0 - d * 2.0), 2.6) * 0.52;
        float glow = core + halo;
        if (uFlare > 0.5) {
          float rayH = exp(-abs(uv.y) * 28.0) * exp(-abs(uv.x) * 7.0);
          float rayV = exp(-abs(uv.x) * 28.0) * exp(-abs(uv.y) * 7.0);
          glow += (rayH + rayV) * 0.38 * vTwinkle;
        }
        float alpha = clamp(glow * vAlpha * (0.72 + 0.34 * vTwinkle), 0.0, 1.0);
        gl_FragColor = vec4(vColor * (0.85 + 0.25 * vTwinkle), alpha);
      }
    `,transparent:!0,depthWrite:!1,blending:L,fog:!1}),x=new I(v,B);return x.frustumCulled=!1,x.raycast=()=>{},x}function K(a=1100){const i=new C;i.name="Dynamic starfield";const t=Math.max(200,Math.round(a*.7)),l=Math.max(45,Math.round(a*.14)),s=Math.max(90,a-t-l),r=b({count:t,seed:840,minRadius:190,maxRadius:430,minSize:1.5,maxSize:4.1,minAlpha:.42,maxAlpha:.92,twinkleSpeed:1.5,flare:0}),c=b({count:l,seed:1291,minRadius:155,maxRadius:310,minSize:4.2,maxSize:8.6,minAlpha:.58,maxAlpha:.98,twinkleSpeed:2.1,flare:1}),f=b({count:s,seed:2049,minRadius:56,maxRadius:140,minSize:.9,maxSize:2.3,minAlpha:.2,maxAlpha:.52,twinkleSpeed:1.1,flare:0,palette:"dust"});i.add(r,c,f),i.raycast=()=>{};let m=0;return i.update=(p,w=!1,e=1/60)=>{if(!w){const n=Math.min(Math.max(e,0),.05);m=typeof p=="number"?p:m+n,r.material.uniforms.uTime.value=m,c.material.uniforms.uTime.value=m,f.material.uniforms.uTime.value=m,r.rotation.y+=n*.0042,c.rotation.y+=n*.0055,f.rotation.y-=n*.0085,f.rotation.x+=n*.0022}},i}function U(a,i="#3b9cf5",t=.8){return new A(new R(a,64,40),new F({uniforms:{color:{value:new H(i)},opacity:{value:t}},vertexShader:"varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",fragmentShader:"uniform vec3 color; uniform float opacity; varying vec3 n; varying vec3 v; void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(color,f*opacity);}",transparent:!0,depthWrite:!1,blending:L}))}function E(a,i="#86f5d9"){const t=new C;t.position.copy(a);const l=new W({color:i,transparent:!0,opacity:.65,depthWrite:!1}),s=new A(new D(.4,.018,6,32),l);s.rotation.x=-Math.PI/2,t.add(s);const r=new A(new R(.07,12,8),l);return r.position.y=.4,t.add(r),t}export{U as a,E as b,K as s};
