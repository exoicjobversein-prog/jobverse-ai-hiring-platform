const css = `
@keyframes floatA{0%,100%{transform:translateY(0)translateX(0)rotateX(0)rotateY(0)}33%{transform:translateY(-28px)translateX(14px)rotateX(14deg)rotateY(10deg)}66%{transform:translateY(-14px)translateX(-10px)rotateX(-8deg)rotateY(-12deg)}}
@keyframes floatB{0%,100%{transform:translateY(0)translateX(0)rotateX(0)rotateY(0)}50%{transform:translateY(-40px)translateX(-18px)rotateX(-14deg)rotateY(8deg)}}
@keyframes gridScroll{from{transform:perspective(600px)rotateX(58deg)translateY(0)}to{transform:perspective(600px)rotateX(58deg)translateY(80px)}}
@keyframes orb1{0%,100%{transform:scale(1)translate(0,0)}50%{transform:scale(1.2)translate(-30px,-25px)}}
@keyframes orb2{0%,100%{transform:scale(1)translate(0,0)}50%{transform:scale(0.85)translate(25px,35px)}}
@keyframes shimmer{0%,100%{opacity:0.2}50%{opacity:0.7}}
@keyframes spinLoader{to{transform:rotate(360deg)}}
`;

const dots = Array.from({ length: 18 }, (_, i) => ({
    w: Math.random() * 2.5 + 1,
    top: Math.random() * 100,
    left: Math.random() * 100,
    col: Math.random() > 0.5 ? '99,102,241' : '139,92,246',
    dur: 3 + Math.random() * 3,
    del: Math.random() * 3,
}));

const shapes = [
    { size: 78,  top: '10%', left: '7%',  color: 'rgba(99,102,241,0.22)',  anim: 'floatA 7s ease-in-out infinite', rot: 'rotateX(24deg) rotateY(20deg)' },
    { size: 48,  top: '62%', left: '4%',  color: 'rgba(139,92,246,0.28)',  anim: 'floatB 9s ease-in-out infinite 1s', rot: 'rotateX(-14deg) rotateY(28deg)' },
    { size: 90,  top: '22%', left: '40%', color: 'rgba(99,102,241,0.13)',  anim: 'floatA 11s ease-in-out infinite 2s', rot: 'rotateX(38deg) rotateY(-14deg)' },
    { size: 55,  top: '78%', left: '37%', color: 'rgba(59,130,246,0.18)',  anim: 'floatB 8s ease-in-out infinite 0.5s', rot: 'rotateX(20deg) rotateY(44deg)' },
    { size: 32,  top: '5%',  left: '56%', color: 'rgba(167,139,250,0.28)', anim: 'floatA 6s ease-in-out infinite 1.5s', rot: 'rotateX(-28deg) rotateY(10deg)' },
];

export default function AuthBg() {
    return (
        <>
            <style>{css}</style>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 90% at 50% 50%,#080812,#000)' }} />

            {/* Perspective grid */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div style={{
                    position: 'absolute', bottom: '-20%', left: '-20%', right: '-20%', height: '75%',
                    backgroundImage: 'linear-gradient(rgba(99,102,241,0.14)1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.14)1px,transparent 1px)',
                    backgroundSize: '75px 75px',
                    animation: 'gridScroll 4s linear infinite',
                    maskImage: 'linear-gradient(to top,rgba(0,0,0,0.85)0%,transparent 80%)',
                    WebkitMaskImage: 'linear-gradient(to top,rgba(0,0,0,0.85)0%,transparent 80%)',
                }} />
            </div>

            {/* Orbs */}
            {[
                { w: 580, h: 580, t: '-12%', l: '-8%',  bg: 'rgba(99,102,241,0.16)',  anim: 'orb1 9s ease-in-out infinite' },
                { w: 480, h: 480, t: 'auto', l: 'auto', b: '-8%', r: '-8%', bg: 'rgba(139,92,246,0.16)', anim: 'orb2 11s ease-in-out infinite' },
            ].map((o, i) => (
                <div key={i} className="absolute pointer-events-none rounded-full" style={{
                    width: o.w, height: o.h, top: o.t, left: o.l, bottom: o.b, right: o.r,
                    background: `radial-gradient(circle,${o.bg} 0%,transparent 70%)`,
                    animation: o.anim, filter: 'blur(50px)',
                }} />
            ))}

            {/* 3D Floating shapes */}
            {shapes.map((s, i) => (
                <div key={i} className="absolute pointer-events-none" style={{ perspective: 400, width: s.size, height: s.size, top: s.top, left: s.left }}>
                    <div style={{
                        width: '100%', height: '100%', borderRadius: 10,
                        border: `1.5px solid ${s.color}`,
                        background: `linear-gradient(135deg,${s.color},transparent)`,
                        transform: s.rot, animation: s.anim,
                        boxShadow: `0 0 18px ${s.color},inset 0 0 18px ${s.color}`,
                    }} />
                </div>
            ))}

            {/* Dots */}
            {dots.map((d, i) => (
                <div key={i} className="absolute rounded-full pointer-events-none" style={{
                    width: d.w, height: d.w, top: `${d.top}%`, left: `${d.left}%`,
                    background: `rgba(${d.col},0.65)`,
                    animation: `shimmer ${d.dur}s ease-in-out infinite ${d.del}s`,
                }} />
            ))}
        </>
    );
}
