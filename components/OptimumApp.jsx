'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─────────────────────────────────────────────
//  THEME
// ─────────────────────────────────────────────
const T = {
  bg: '#03030a', s1: '#09091a', s2: '#0e0e1f',
  br: 'rgba(255,255,255,0.07)', br2: 'rgba(255,255,255,0.13)',
  g: '#00e8a0', p: '#a78bfa', b: '#38bdf8',
  r: '#f87171', y: '#fbbf24',
  tx: '#dfe0f0', mt: '#4a4a65',
  sans: "'Outfit', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};
const card = (ex = {}) => ({ background: T.s1, border: `1px solid ${T.br}`, borderRadius: 12, ...ex });
const lbl  = (ex = {}) => ({ fontSize: 10, color: T.mt, textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: T.mono, ...ex });

// ─────────────────────────────────────────────
//  REAL-TIME DATA HOOK
// ─────────────────────────────────────────────
function useRealtimeData() {
  const DEFAULTS = { ethPrice: 3200, ethChange24h: 0, stakingApr: 3.5, totalValidators: 1_050_000, mump2pVersion: null };
  const [market,  setMarket]  = useState({ ethPrice: DEFAULTS.ethPrice, ethChange24h: 0, stakingApr: DEFAULTS.stakingApr, loading: true });
  const [network, setNetwork] = useState({ totalValidators: DEFAULTS.totalValidators, mump2pVersion: null, mump2pDownloadUrl: null, loading: true });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const [mRes, nRes] = await Promise.allSettled([
      fetch('/api/market').then(r => r.json()),
      fetch('/api/network').then(r => r.json()),
    ]);
    if (mRes.status === 'fulfilled') {
      setMarket(p => ({
        ...p,
        ethPrice:     mRes.value.ethPrice     ?? p.ethPrice,
        ethChange24h: mRes.value.ethChange24h ?? 0,
        stakingApr:   mRes.value.stakingApr   ?? p.stakingApr,
        clApr:        mRes.value.clApr,
        elApr:        mRes.value.elApr,
        loading: false,
      }));
    }
    if (nRes.status === 'fulfilled') {
      setNetwork(p => ({
        ...p,
        totalValidators:  nRes.value.totalValidators  ?? p.totalValidators,
        totalStakedEth:   nRes.value.totalStakedEth   ?? null,
        mump2pVersion:    nRes.value.mump2pVersion     ?? p.mump2pVersion,
        mump2pDownloadUrl: nRes.value.mump2pDownloadUrl ?? null,
        mump2pPublishedAt: nRes.value.mump2pPublishedAt ?? null,
        loading: false,
      }));
    }
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  return { market, network, lastUpdated, refreshing, refetch: fetchAll };
}

// ─────────────────────────────────────────────
//  SHARED UI
// ─────────────────────────────────────────────
function PBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '10px 22px', background: disabled ? '#2a2a3a' : T.g,
      color: disabled ? T.mt : '#000', border: 'none', borderRadius: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: T.sans, fontWeight: 700, fontSize: 13,
      transition: 'all 0.2s', opacity: disabled ? 0.7 : 1,
    }}>{children}</button>
  );
}
function SBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 22px', background: 'transparent', color: T.mt,
      border: `1px solid ${T.br}`, borderRadius: 8, cursor: 'pointer',
      fontFamily: T.mono, fontSize: 12, transition: 'all 0.2s',
    }}>{children}</button>
  );
}
function NumInput({ label, value, onChange, unit, min = 0, step = 1, liveTag }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={lbl()}>{label}</span>
        {liveTag && (
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${T.g}18`,
            color: T.g, border: `1px solid ${T.g}30`, fontFamily: T.mono, letterSpacing: 0.5 }}>LIVE</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="number" value={value} min={min} step={step}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, background: T.s2, border: `1px solid ${liveTag ? T.g + '40' : T.br}`,
            borderRadius: 8, padding: '10px 14px', color: T.tx, fontFamily: T.mono, fontSize: 14, outline: 'none' }}
        />
        {unit && <span style={{ color: T.mt, fontSize: 12, fontFamily: T.mono, whiteSpace: 'nowrap' }}>{unit}</span>}
      </div>
    </div>
  );
}
function LiveBar({ lastUpdated, refreshing, onRefresh }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setSecs(lastUpdated ? Math.round((Date.now() - lastUpdated) / 1000) : 0), 1000);
    return () => clearInterval(iv);
  }, [lastUpdated]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: T.mono,
        color: refreshing ? T.y : T.g, padding: '3px 10px', borderRadius: 20,
        background: refreshing ? `${T.y}15` : `${T.g}15`,
        border: `1px solid ${(refreshing ? T.y : T.g)}30` }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: refreshing ? T.y : T.g,
          display: 'inline-block',
          animation: refreshing ? 'pulse-dot 0.8s infinite' : 'none' }} />
        {refreshing ? 'UPDATING…' : lastUpdated ? `LIVE · ${secs}s ago` : 'LIVE'}
      </span>
      <button onClick={onRefresh} disabled={refreshing} style={{ background: 'none', color: T.mt, cursor: 'pointer',
        fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6, border: `1px solid ${T.br}` }}>
        ⟳ Refresh
      </button>
    </div>
  );
}
function StatPill({ label, value, color = T.g, sub }) {
  return (
    <div style={card({ padding: 18 })}>
      <div style={lbl({ marginBottom: 8 })}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, fontFamily: T.sans, color, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ color: T.mt, fontSize: 10, marginTop: 4, fontFamily: T.mono }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB 1 — NETWORK SIMULATOR
// ─────────────────────────────────────────────
function SimTab() {
  const COLS = 6, ROWS = 5, N = COLS * ROWS, SRC = 14;
  const GD = 340, RD = 58;
  const bfs = () => {
    const ls = [], vis = new Set([SRC]); let cur = [SRC];
    while (cur.length) {
      ls.push([...cur]); const nxt = [];
      for (const n of cur) {
        const r = Math.floor(n / COLS), c = n % COLS;
        [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc]) => {
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            const ni = nr * COLS + nc;
            if (!vis.has(ni)) { vis.add(ni); nxt.push(ni); }
          }
        });
      }
      cur = nxt;
    }
    return ls;
  };
  const LAYERS = bfs();
  const [gN, setGN] = useState(Array(N).fill(0));
  const [rN, setRN] = useState(Array(N).fill(0));
  const [gT, setGT] = useState(0); const [rT, setRT] = useState(0);
  const [gD, setGD] = useState(false); const [rD, setRD] = useState(false);
  const [running, setRunning] = useState(false);
  const tms = useRef([]);
  const reset = () => {
    tms.current.forEach(clearTimeout); tms.current = [];
    setGN(Array(N).fill(0)); setRN(Array(N).fill(0));
    setGT(0); setRT(0); setGD(false); setRD(false); setRunning(false);
  };
  const run = () => {
    reset();
    setTimeout(() => {
      setRunning(true);
      LAYERS.forEach((layer, li) => {
        const t1 = setTimeout(() => {
          setGN(p => { const n=[...p]; layer.forEach(i=>n[i]=1); return n; });
          setGT(GD*(li+1));
          if (li === LAYERS.length-1) setGD(true);
        }, GD*(li+1));
        const t2 = setTimeout(() => {
          setRN(p => { const n=[...p]; layer.forEach(i=>n[i]=1); return n; });
          setRT(RD*(li+1));
          if (li === LAYERS.length-1) { setRD(true); setRunning(false); }
        }, RD*(li+1));
        tms.current.push(t1, t2);
      });
    }, 80);
  };
  const Grid = ({ nodes, col }) => {
    const W=320, cw=W/COLS, rh=(W*ROWS/COLS)/ROWS;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${W*ROWS/COLS}`} style={{display:'block'}}>
        {Array.from({length:N},(_,i)=>{
          const r=Math.floor(i/COLS),c=i%COLS;
          return [c<COLS-1?i+1:null,r<ROWS-1?i+COLS:null].filter(Boolean).map(j=>(
            <line key={`e${i}-${j}`} x1={c*cw+cw/2} y1={r*rh+rh/2}
              x2={(j%COLS)*cw+cw/2} y2={Math.floor(j/COLS)*rh+rh/2}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
          ));
        })}
        {Array.from({length:N},(_,i)=>{
          const r=Math.floor(i/COLS),c=i%COLS;
          const cx=c*cw+cw/2,cy=r*rh+rh/2;
          const src=i===SRC,lit=nodes[i]===1;
          return (
            <g key={`n${i}`}>
              {lit&&!src&&<circle cx={cx} cy={cy} r={12} fill={col} opacity={0.14}/>}
              <circle cx={cx} cy={cy} r={src?9:6}
                fill={src?T.b:lit?col:'rgba(255,255,255,0.07)'}
                style={{transition:'fill 0.12s'}}/>
              {src&&<circle cx={cx} cy={cy} r={14} fill="none" stroke={T.b} strokeWidth={1} opacity={0.5}/>}
            </g>
          );
        })}
      </svg>
    );
  };
  const mx = gT>0&&rT>0 ? (gT/rT).toFixed(1) : '6–20';
  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:24,alignItems:'center'}}>
        <PBtn onClick={run} disabled={running}>{running?'⟳ Simulating…':'▶  Run Simulation'}</PBtn>
        <SBtn onClick={reset}>Reset</SBtn>
        <span style={{color:T.mt,fontSize:11,fontFamily:T.mono}}>Gossip: {GD}ms/hop · RLNC: {RD}ms/hop · ETH slot: 12s</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:20}}>
        {[
          {title:'Gossipsub',badge:'LEGACY PROTOCOL',col:T.r,nodes:gN,time:gT,done:gD,def:'~2,040ms'},
          {title:'RLNC · mump2p',badge:'OPTIMUM',col:T.g,nodes:rN,time:rT,done:rD,def:'~348ms'},
        ].map(({title,badge,col,nodes,time,def})=>(
          <div key={title} style={card({overflow:'hidden'})}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 16px',borderBottom:`1px solid ${T.br}`}}>
              <span style={{fontFamily:T.sans,fontWeight:700,fontSize:13}}>{title}</span>
              <span style={{fontSize:9,padding:'3px 9px',borderRadius:20,fontFamily:T.mono,letterSpacing:1,
                background:`${col}15`,color:col,border:`1px solid ${col}30`}}>{badge}</span>
            </div>
            <div style={{padding:14}}><Grid nodes={nodes} col={col}/></div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 16px',borderTop:`1px solid ${T.br}`}}>
              <span style={lbl()}>Propagation Time</span>
              <span style={{color:col,fontSize:22,fontFamily:T.mono,fontWeight:500}}>
                {time>0?`${time} ms`:def}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:20}}>
        <StatPill label="Speed Improvement" value={`${mx}×`} color={T.g} sub="vs Gossipsub baseline"/>
        <StatPill label="Bandwidth Saved"    value="~93%"     color={T.p} sub="encoded vs raw gossip"/>
        <StatPill label="Block Latency (Hoodi)" value="150ms" color={T.b} sub="Ethereum testnet avg · mump2p"/>
      </div>
      {gD&&rD&&(
        <div style={card({padding:20})}>
          <div style={lbl({marginBottom:12})}>Propagation comparison</div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={[{n:'Gossipsub',ms:gT},{n:'RLNC (Optimum)',ms:rT}]} layout="vertical" margin={{left:10,right:60}}>
              <XAxis type="number" tick={{fill:T.mt,fontSize:10,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="n" tick={{fill:T.tx,fontSize:11,fontFamily:T.mono}} axisLine={false} tickLine={false} width={110}/>
              <Bar dataKey="ms" radius={4} label={{position:'right',fill:T.mt,fontSize:10,fontFamily:T.mono,formatter:v=>`${v}ms`}}>
                <Cell fill={T.r}/><Cell fill={T.g}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB 2 — ROI CALCULATOR (real-time price + APR)
// ─────────────────────────────────────────────
function ROITab({ market }) {
  const [count, setCount] = useState(10);
  const [ethPrice, setEthPrice] = useState(3200);
  const [apr, setApr]     = useState(3.5);
  const [bw, setBw]       = useState(500);
  const [priceSet, setPriceSet] = useState(false);
  const [aprSet, setAprSet]     = useState(false);

  // Auto-fill with live data (only if user hasn't manually changed)
  useEffect(() => {
    if (!priceSet && market.ethPrice) { setEthPrice(Math.round(market.ethPrice)); }
  }, [market.ethPrice, priceSet]);
  useEffect(() => {
    if (!aprSet && market.stakingApr) { setApr(parseFloat(market.stakingApr.toFixed(2))); }
  }, [market.stakingApr, aprSet]);

  const staked   = count * 32;
  const bApr     = apr / 100;
  const iApr     = bApr + 0.0085;  // +0.85% from attestation + MEV improvements
  const baseAnn  = staked * ethPrice * bApr;
  const optAnn   = staked * ethPrice * iApr;
  const delta    = optAnn - baseAnn;
  const bwSave   = bw * count * 0.9 * 0.09 * 12;
  const total    = delta + bwSave;

  const chartData = Array.from({length:12},(_,i) => ({
    m:`M${i+1}`,
    Without: Math.round(baseAnn/12*(i+1)),
    With:    Math.round((optAnn+bwSave)/12*(i+1)),
  }));
  const fmt = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;
  const chg = market.ethChange24h;

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:24}}>
      <div style={card({padding:24})}>
        <div style={{fontFamily:T.sans,fontWeight:700,fontSize:16,marginBottom:20}}>Validator Setup</div>

        {/* Live ETH price banner */}
        {market.ethPrice && (
          <div style={{padding:'10px 14px',background:T.s2,borderRadius:10,border:`1px solid ${T.br}`,marginBottom:20,
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={lbl({marginBottom:3})}>ETH / USD · Live</div>
              <div style={{fontFamily:T.mono,fontWeight:500,fontSize:18,color:T.g}}>${market.ethPrice?.toLocaleString()}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={lbl({marginBottom:3})}>24h Change</div>
              <div style={{fontFamily:T.mono,fontSize:14,color:chg>0?T.g:T.r}}>
                {chg>0?'+':''}{chg?.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        <NumInput label="Number of Validators" value={count} onChange={setCount} min={1}/>
        <NumInput label="ETH Price (USD)" value={ethPrice}
          onChange={v=>{setEthPrice(v);setPriceSet(true);}} unit="USD" min={100}
          liveTag={!priceSet&&!!market.ethPrice}/>
        <NumInput label="Current Base APR" value={apr}
          onChange={v=>{setApr(v);setAprSet(true);}} unit="%" min={0.1} step={0.1}
          liveTag={!aprSet&&!!market.stakingApr}/>
        <NumInput label="Monthly Bandwidth / Node" value={bw} onChange={setBw} unit="GB" min={1}/>

        <div style={{padding:14,background:T.s2,borderRadius:10,border:`1px solid ${T.br}`}}>
          <div style={lbl({marginBottom:6})}>Total ETH Staked</div>
          <div style={{fontFamily:T.sans,fontWeight:800,fontSize:26,color:T.b}}>{staked.toLocaleString()} ETH</div>
          <div style={{color:T.mt,fontSize:11,fontFamily:T.mono,marginTop:2}}>≈ ${(staked*ethPrice).toLocaleString()} USD</div>
        </div>
        {(market.clApr||market.elApr) && (
          <div style={{marginTop:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{l:'CL APR (consensus)',v:market.clApr},{l:'EL APR (execution)',v:market.elApr}].map(({l,v})=>v&&(
              <div key={l} style={{padding:'10px 12px',background:T.s2,borderRadius:8,border:`1px solid ${T.br}`}}>
                <div style={lbl({marginBottom:4})}>{l}</div>
                <div style={{fontFamily:T.mono,color:T.p,fontSize:13}}>{v.toFixed(2)}%</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[
            {l:'Annual (Without Optimum)',val:fmt(baseAnn),c:T.mt,s:`${apr}% APR`},
            {l:'Annual (With Optimum)',   val:fmt(optAnn), c:T.g, s:`${(apr+0.85).toFixed(2)}% APR`},
          ].map(({l,val,c,s})=>(
            <div key={l} style={card({padding:18})}>
              <div style={lbl({marginBottom:8})}>{l}</div>
              <div style={{fontFamily:T.sans,fontWeight:900,fontSize:26,color:c,letterSpacing:-1}}>{val}</div>
              <div style={{color:T.mt,fontSize:10,marginTop:4,fontFamily:T.mono}}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[
            {l:'Extra Validator Earnings',val:fmt(delta),   c:T.g,s:'attestation + MEV gains'},
            {l:'Annual Bandwidth Savings',val:fmt(bwSave),  c:T.p,s:'90% egress cost reduction'},
          ].map(({l,val,c,s})=>(
            <div key={l} style={card({padding:18,border:`1px solid ${c}25`,background:`${c}06`})}>
              <div style={lbl({marginBottom:8})}>{l}</div>
              <div style={{fontFamily:T.sans,fontWeight:900,fontSize:26,color:c,letterSpacing:-1}}>{val}</div>
              <div style={{color:T.mt,fontSize:10,marginTop:4,fontFamily:T.mono}}>{s}</div>
            </div>
          ))}
        </div>
        <div style={card({padding:18,border:`1px solid ${T.g}40`,background:`${T.g}08`})}>
          <div style={lbl({marginBottom:6})}>Total Annual Gain with Optimum</div>
          <div style={{fontFamily:T.sans,fontWeight:900,fontSize:44,color:T.g,letterSpacing:-2}}>{fmt(total)}</div>
          <div style={{color:T.mt,fontSize:11,fontFamily:T.mono,marginTop:4}}>validator earnings + bandwidth savings combined</div>
        </div>
        <div style={card({padding:18})}>
          <div style={lbl({marginBottom:12})}>Cumulative earnings over 12 months</div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData} margin={{top:5,right:10,left:10,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.g} stopOpacity={0.2}/><stop offset="95%" stopColor={T.g} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.mt} stopOpacity={0.2}/><stop offset="95%" stopColor={T.mt} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{fill:T.mt,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.mt,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}
                tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip contentStyle={{background:T.s2,border:`1px solid ${T.br}`,borderRadius:8,fontFamily:T.mono,fontSize:11}}
                formatter={v=>`$${v.toLocaleString()}`}/>
              <Area type="monotone" dataKey="Without" stroke={T.mt} fill="url(#g2)" strokeWidth={1.5} dot={false}/>
              <Area type="monotone" dataKey="With"    stroke={T.g}  fill="url(#g1)" strokeWidth={2}   dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:16,marginTop:8,justifyContent:'center'}}>
            {[{c:T.g,l:'With Optimum'},{c:T.mt,l:'Without Optimum'}].map(({c,l})=>(
              <span key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:T.mt,fontFamily:T.mono}}>
                <span style={{width:16,height:2,background:c,display:'inline-block',borderRadius:2}}/>{l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB 3 — BANDWIDTH DASHBOARD
// ─────────────────────────────────────────────
const CLOUD_PROVIDERS = [
  { id:'aws',     label:'AWS',          rate:0.09  },
  { id:'gcp',     label:'GCP',          rate:0.08  },
  { id:'azure',   label:'Azure',        rate:0.087 },
  { id:'hetzner', label:'Hetzner',      rate:0.012 },
  { id:'custom',  label:'Custom',       rate:null  },
];
function BWTab() {
  const [nodes, setNodes]       = useState(5);
  const [bw, setBw]             = useState(1000);
  const [provider, setProvider] = useState('aws');
  const [customRate, setCustomRate] = useState(0.09);
  const rate = provider === 'custom' ? customRate : (CLOUD_PROVIDERS.find(p=>p.id===provider)?.rate ?? 0.09);
  const monthly    = nodes * bw * rate;
  const saved      = monthly * 0.93;
  const withOpt    = monthly * 0.07;
  const months     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data       = months.map((m,i) => ({
    m, Current: Math.round(monthly*(1+i*0.02)), Optimum: Math.round(withOpt*(1+i*0.02))
  }));
  const annualSaved = data.reduce((a,d)=>a+(d.Current-d.Optimum),0);
  return (
    <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:24}}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={card({padding:20})}>
          <div style={{fontFamily:T.sans,fontWeight:700,fontSize:15,marginBottom:16}}>Configuration</div>
          <NumInput label="Number of Nodes" value={nodes} onChange={setNodes} min={1}/>
          <NumInput label="Bandwidth / Node" value={bw} onChange={setBw} unit="GB/month" min={1}/>

          <div style={{marginBottom:18}}>
            <div style={lbl({marginBottom:8})}>Cloud Provider</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {CLOUD_PROVIDERS.map(p=>(
                <button key={p.id} onClick={()=>setProvider(p.id)} style={{
                  padding:'8px 10px', borderRadius:8, cursor:'pointer',
                  fontFamily:T.mono, fontSize:11, textAlign:'left',
                  background:provider===p.id?`${T.g}18`:T.s2,
                  border:`1px solid ${provider===p.id?T.g+40:T.br}`,
                  color:provider===p.id?T.g:T.mt,
                }}>
                  <div style={{fontWeight:600}}>{p.label}</div>
                  <div style={{fontSize:10,marginTop:2}}>{p.rate?`$${p.rate}/GB`:'Custom'}</div>
                </button>
              ))}
            </div>
            {provider==='custom'&&(
              <div style={{marginTop:10}}>
                <NumInput label="Custom Rate ($/GB)" value={customRate} onChange={setCustomRate} unit="$/GB" min={0.001} step={0.001}/>
              </div>
            )}
          </div>
        </div>
        {[
          {l:'Monthly Cost (Now)',       val:`$${Math.round(monthly).toLocaleString()}`, c:T.r, s:'without Optimum'},
          {l:'Monthly With Optimum',    val:`$${Math.round(withOpt).toLocaleString()}`, c:T.g, s:'93% bandwidth reduction'},
          {l:'Monthly Savings',          val:`$${Math.round(saved).toLocaleString()}`,  c:T.p, s:`${((saved/monthly)*100).toFixed(0)}% cost cut`},
        ].map(({l,val,c,s})=>(
          <div key={l} style={card({padding:16})}>
            <div style={lbl({marginBottom:6})}>{l}</div>
            <div style={{fontFamily:T.sans,fontWeight:800,fontSize:22,color:c,letterSpacing:-0.5}}>{val}</div>
            <div style={{color:T.mt,fontSize:10,marginTop:3,fontFamily:T.mono}}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={card({padding:'32px 24px',border:`1px solid ${T.g}40`,background:`${T.g}07`,textAlign:'center'})}>
          <div style={lbl({marginBottom:8})}>Annual Bandwidth Savings</div>
          <div style={{fontFamily:T.sans,fontWeight:900,fontSize:54,color:T.g,letterSpacing:-3}}>${annualSaved.toLocaleString()}</div>
          <div style={{color:T.mt,fontSize:12,fontFamily:T.mono,marginTop:6}}>
            {nodes} node{nodes>1?'s':''} · {(nodes*bw*12*0.93/1000).toFixed(0)} TB/yr eliminated · {CLOUD_PROVIDERS.find(p=>p.id===provider)?.label} pricing
          </div>
        </div>
        <div style={card({padding:20,flex:1})}>
          <div style={lbl({marginBottom:14})}>Monthly cost: Current vs Optimum</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data} margin={{top:0,right:10,left:0,bottom:0}} barGap={4}>
              <XAxis dataKey="m" tick={{fill:T.mt,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.mt,fontSize:9,fontFamily:T.mono}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`}/>
              <Tooltip contentStyle={{background:T.s2,border:`1px solid ${T.br}`,borderRadius:8,fontFamily:T.mono,fontSize:11}}
                formatter={v=>`$${v.toLocaleString()}`}/>
              <Bar dataKey="Current" fill={T.r} fillOpacity={0.75} radius={[4,4,0,0]}/>
              <Bar dataKey="Optimum" fill={T.g} fillOpacity={0.85} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:16,marginTop:10,justifyContent:'center'}}>
            {[{c:T.r,l:'Current'},{c:T.g,l:'With Optimum'}].map(({c,l})=>(
              <span key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:T.mt,fontFamily:T.mono}}>
                <span style={{width:10,height:10,background:c,display:'inline-block',borderRadius:2}}/>{l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB 4 — VALIDATOR MAP (real network stats)
// ─────────────────────────────────────────────
function MapTab({ network }) {
  const [hov, setHov]     = useState(null);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p+1)%60), 100);
    return () => clearInterval(iv);
  }, []);
  const W=760, H=380;
  const toXY = (lat,lon) => ({ x:((lon+180)/360)*W, y:((90-lat)/180)*H });
  const partners = [
    {name:'Everstake',   loc:'Kyiv, Ukraine',      lat:50.45, lon:30.52,  stake:'2.1M ETH', c:T.g},
    {name:'P2P.org',     loc:'Global',              lat:55.75, lon:37.61,  stake:'3.4M ETH', c:T.g},
    {name:'Blockdaemon', loc:'New York, USA',       lat:40.71, lon:-74.0,  stake:'1.8M ETH', c:T.b},
    {name:'Infstones',   loc:'Singapore',           lat:1.35,  lon:103.82, stake:'0.9M ETH', c:T.g},
    {name:'Luganodes',   loc:'Zug, Switzerland',    lat:47.17, lon:8.51,   stake:'1.2M ETH', c:T.p},
    {name:'Ebunker',     loc:'Shanghai, China',     lat:31.23, lon:121.47, stake:'0.7M ETH', c:T.g},
    {name:'Kiln',        loc:'Paris, France',       lat:48.86, lon:2.35,   stake:'0.8M ETH', c:T.y},
    {name:'Stakefish',   loc:'Seoul, South Korea',  lat:37.57, lon:126.98, stake:'0.5M ETH', c:T.b},
  ].map(p=>({...p,...toXY(p.lat,p.lon)}));
  const lands = [
    'M120,60 L180,50 L230,70 L250,100 L240,155 L210,185 L180,205 L158,225 L148,205 L118,182 L98,142 L88,100 Z',
    'M178,212 L210,207 L232,232 L226,282 L200,324 L178,345 L162,322 L158,280 L163,240 Z',
    'M360,54 L424,49 L442,76 L430,102 L398,112 L366,100 L348,78 Z',
    'M368,122 L422,116 L447,142 L441,202 L420,253 L390,272 L362,252 L353,200 L358,152 Z',
    'M442,40 L582,34 L662,62 L702,82 L682,132 L622,152 L560,142 L498,122 L458,100 L440,68 Z',
    'M598,232 L662,222 L692,242 L682,282 L640,302 L598,282 L582,257 Z',
  ];
  const totalVal  = network.totalValidators;
  const totalEth  = network.totalStakedEth;
  const hovP = hov!==null ? partners[hov] : null;
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <StatPill label="Testnet Partners"      value="40+"    color={T.g}/>
        <StatPill label="Active ETH Validators" value={totalVal ? (totalVal/1_000).toFixed(0)+'k' : '—'} color={T.b}
          sub={totalVal?'live · beaconcha.in':null}/>
        <StatPill label="Total ETH Staked"      value={totalEth ? `${(totalEth/1_000_000).toFixed(1)}M` : '—'} color={T.p}
          sub={totalEth?`≈ ${(totalEth*3200/1e9).toFixed(0)}B USD`:null}/>
        <StatPill label="Avg Block Latency"     value="150ms"  color={T.y} sub="Hoodi testnet · RLNC"/>
      </div>
      <div style={card({overflow:'hidden',marginBottom:16})}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 18px',borderBottom:`1px solid ${T.br}`}}>
          <span style={{fontFamily:T.sans,fontWeight:700,fontSize:13}}>Global Validator Network</span>
          <span style={{...lbl(),color:T.g}}>● TESTNET LIVE — Hover for details</span>
        </div>
        <div style={{position:'relative'}}>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block'}}>
            {Array.from({length:7},(_,i)=>(
              <line key={`h${i}`} x1={0} y1={i*H/6} x2={W} y2={i*H/6} stroke="rgba(255,255,255,0.03)" strokeWidth={1}/>
            ))}
            {Array.from({length:13},(_,i)=>(
              <line key={`v${i}`} x1={i*W/12} y1={0} x2={i*W/12} y2={H} stroke="rgba(255,255,255,0.03)" strokeWidth={1}/>
            ))}
            {lands.map((d,i)=>(
              <path key={i} d={d} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.09)" strokeWidth={0.5}/>
            ))}
            {partners.map((p,i)=>
              partners.slice(i+1).map((q,j)=>(
                <line key={`c${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
                  stroke={T.g} strokeWidth={0.5} opacity={hov===i||hov===i+j+1?0.25:0.08}/>
              ))
            )}
            {partners.map((p,i)=>{
              const ph=(pulse+i*9)%60;
              return (
                <g key={i} style={{cursor:'pointer'}} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
                  <circle cx={p.x} cy={p.y} r={8+ph*0.35} fill={p.c} opacity={Math.max(0,0.4-ph*0.014)}/>
                  <circle cx={p.x} cy={p.y} r={hov===i?9:7} fill={p.c} opacity={0.9}/>
                  <circle cx={p.x} cy={p.y} r={11} fill="none" stroke={p.c} strokeWidth={1} opacity={0.35}/>
                  {hov===i&&(
                    <text x={p.x+15} y={p.y+4} fill={T.tx} fontSize={11} fontFamily={T.mono}>{p.name}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {hovP&&(
            <div style={{position:'absolute',bottom:14,left:14,pointerEvents:'none',...card({padding:'14px 18px',minWidth:190})}}>
              <div style={{fontFamily:T.sans,fontWeight:700,fontSize:14,marginBottom:2}}>{hovP.name}</div>
              <div style={{color:T.mt,fontSize:11,fontFamily:T.mono}}>{hovP.loc}</div>
              <div style={{color:hovP.c,fontSize:13,fontFamily:T.mono,marginTop:6}}>{hovP.stake} staked</div>
            </div>
          )}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {partners.map((p,i)=>(
          <div key={p.name} style={card({padding:13,display:'flex',gap:10,alignItems:'center',
            border:`1px solid ${hov===i?p.c+'40':T.br}`,
            background:hov===i?`${p.c}08`:T.s1,transition:'all 0.2s',cursor:'default'})}
            onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}>
            <div style={{width:8,height:8,borderRadius:'50%',background:p.c,flexShrink:0}}/>
            <div>
              <div style={{fontFamily:T.sans,fontWeight:600,fontSize:12}}>{p.name}</div>
              <div style={{color:T.mt,fontSize:10,fontFamily:T.mono}}>{p.loc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  TAB 5 — SETUP WIZARD (real version + download URL)
// ─────────────────────────────────────────────
function WizardTab({ network }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(new Set());
  const ver = network.mump2pVersion ?? 'latest';
  const dlUrl = network.mump2pDownloadUrl ?? 'https://github.com/getoptimum/mump2p/releases/latest';
  const steps = [
    {
      title:'Prerequisites Check', icon:'◈',
      desc:'Ensure your system meets the minimum requirements before installing mump2p.',
      checks:[
        'Linux (Ubuntu 20.04+ / Debian 11+) or macOS 12+',
        'Ethereum CL client — Prysm, Lighthouse, Teku, or Nimbus',
        'Go 1.21+ or Docker installed on the machine',
        'Min 4 CPU cores, 8 GB RAM recommended',
        'Inbound/Outbound network access on UDP port 9001',
      ],
      action:'Confirm Prerequisites',
    },
    {
      title:'Install mump2p Sidecar', icon:'◉',
      desc:`Download and install the Optimum mump2p sidecar binary (${ver}).`,
      code:`# Download ${ver}
curl -LO ${dlUrl}

# Make executable
chmod +x mump2p-linux-amd64

# Move to system path
sudo mv mump2p-linux-amd64 /usr/local/bin/mump2p

# Verify install
mump2p --version`,
      action:'Mark as Installed',
    },
    {
      title:'Configure Ethereum Client', icon:'◎',
      desc:'Enable the REST API on your CL client so mump2p can read block data.',
      code:`# Lighthouse
--http --http-address 127.0.0.1 --http-port 5052

# Prysm
--grpc-gateway-host=127.0.0.1 --grpc-gateway-port=3500

# Teku
--rest-api-enabled=true --rest-api-interface=localhost

# Nimbus
--rest --rest-address=127.0.0.1 --rest-port=5052`,
      note:'Port varies by client. See Optimum docs for full per-client config.',
      action:'Mark as Configured',
    },
    {
      title:'Connect to Optimum Network', icon:'◍',
      desc:'Start the mump2p sidecar and join the Optimum propagation network.',
      code:`# Start mump2p (Lighthouse example)
mump2p start \\
  --beacon-api http://localhost:5052 \\
  --network hoodi \\
  --log-level info

# Run as a background systemd service
sudo systemctl enable --now mump2p`,
      action:'Mark as Connected',
    },
    {
      title:'Verify & Monitor', icon:'◌',
      desc:'Confirm your node is propagating blocks through the Optimum network.',
      code:`# Check sidecar status
mump2p status

# Watch live propagation logs
mump2p logs --follow

# ✅ Confirmation message in logs:
# [INFO] block received via RLNC in 148ms`,
      note:'First RLNC block typically appears within 30 seconds of start.',
      action:'Setup Complete 🎉',
    },
  ];
  const toggle = i => setDone(p => { const n=new Set(p); n.has(i)?n.delete(i):n.add(i); return n; });
  const progress = (done.size / steps.length) * 100;
  const s = steps[step], isDone = done.has(step);
  return (
    <div style={{display:'grid',gridTemplateColumns:'250px 1fr',gap:24}}>
      <div>
        <div style={card({padding:18,marginBottom:14})}>
          <div style={lbl({marginBottom:8})}>Setup Progress</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
            <span style={{fontFamily:T.sans,fontWeight:900,fontSize:32,color:progress===100?T.g:T.tx,letterSpacing:-1}}>
              {Math.round(progress)}%
            </span>
            <span style={{color:T.mt,fontSize:11,fontFamily:T.mono}}>{done.size}/{steps.length} done</span>
          </div>
          <div style={{height:4,background:T.s2,borderRadius:2}}>
            <div style={{height:'100%',width:`${progress}%`,background:T.g,borderRadius:2,transition:'width 0.4s'}}/>
          </div>
          {network.mump2pVersion&&(
            <div style={{marginTop:12,padding:'8px 12px',background:T.s2,borderRadius:8,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={lbl()}>Latest Version</span>
              <span style={{color:T.g,fontFamily:T.mono,fontSize:12}}>{network.mump2pVersion}</span>
            </div>
          )}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {steps.map((st,i)=>(
            <div key={i} onClick={()=>setStep(i)} style={card({
              padding:'12px 14px', cursor:'pointer',
              border:`1px solid ${step===i?T.g+'45':done.has(i)?T.g+'20':T.br}`,
              background:step===i?`${T.g}09`:done.has(i)?`${T.g}04`:T.s1,
              transition:'all 0.2s',
            })}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,
                  background:done.has(i)?T.g:step===i?`${T.g}30`:T.s2,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:10,color:done.has(i)?'#000':step===i?T.g:T.mt}}>
                  {done.has(i)?'✓':(i+1)}
                </div>
                <span style={{fontFamily:T.sans,fontWeight:600,fontSize:12,color:step===i?T.tx:T.mt}}>{st.title}</span>
              </div>
            </div>
          ))}
        </div>
        {progress===100&&(
          <div style={{marginTop:14,padding:16,background:`${T.g}10`,border:`1px solid ${T.g}40`,borderRadius:12,textAlign:'center'}}>
            <div style={{fontSize:24,marginBottom:6}}>🎉</div>
            <div style={{fontFamily:T.sans,fontWeight:700,fontSize:13,color:T.g}}>Validator Online!</div>
            <div style={{color:T.mt,fontSize:10,fontFamily:T.mono,marginTop:4}}>mump2p is live on your node</div>
          </div>
        )}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={card({padding:24})}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
            <span style={{fontSize:22,color:T.g}}>{s.icon}</span>
            <div>
              <div style={{fontFamily:T.sans,fontWeight:800,fontSize:20}}>{s.title}</div>
              <div style={{color:T.mt,fontSize:11,fontFamily:T.mono,marginTop:2}}>Step {step+1} of {steps.length}</div>
            </div>
          </div>
          <div style={{color:T.mt,fontSize:13,fontFamily:T.mono,lineHeight:1.7,marginBottom:18}}>{s.desc}</div>
          {s.checks&&(
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:18}}>
              {s.checks.map((c,i)=>(
                <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'10px 14px',background:T.s2,borderRadius:8}}>
                  <span style={{color:T.g,fontSize:12,marginTop:1,flexShrink:0}}>✓</span>
                  <span style={{color:T.tx,fontSize:12,fontFamily:T.mono}}>{c}</span>
                </div>
              ))}
            </div>
          )}
          {s.code&&(
            <div style={{background:'#020208',border:`1px solid ${T.br}`,borderRadius:10,
              padding:18,marginBottom:14,fontFamily:T.mono,fontSize:12,
              color:'#8effd0',lineHeight:1.9,whiteSpace:'pre-wrap',overflowX:'auto'}}>{s.code}</div>
          )}
          {s.note&&(
            <div style={{padding:'10px 14px',background:`${T.y}10`,border:`1px solid ${T.y}30`,
              borderRadius:8,color:T.y,fontSize:11,fontFamily:T.mono,marginBottom:14}}>⚠  {s.note}</div>
          )}
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <PBtn onClick={()=>{toggle(step);if(!isDone&&step<steps.length-1)setStep(step+1);}}>
              {isDone?'✓ Completed':s.action}
            </PBtn>
            {step>0&&<SBtn onClick={()=>setStep(step-1)}>← Back</SBtn>}
            {step<steps.length-1&&<SBtn onClick={()=>setStep(step+1)}>Next →</SBtn>}
          </div>
        </div>
        {isDone&&(
          <div style={{...card({padding:16,border:`1px solid ${T.g}40`,background:`${T.g}08`}),display:'flex',gap:12,alignItems:'center'}}>
            <span style={{fontSize:20}}>✓</span>
            <div>
              <div style={{fontFamily:T.sans,fontWeight:700,fontSize:13,color:T.g}}>Step Complete!</div>
              <div style={{color:T.mt,fontSize:11,fontFamily:T.mono,marginTop:2}}>
                {step<steps.length-1?`Next: ${steps[step+1].title}`:'🎉 Your validator is fully configured with Optimum!'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
const TABS = [
  {id:'sim', label:'Network Simulator', icon:'◎'},
  {id:'roi', label:'ROI Calculator',    icon:'◈'},
  {id:'bw',  label:'Bandwidth',         icon:'◉'},
  {id:'map', label:'Validator Map',     icon:'◍'},
  {id:'wiz', label:'Setup Wizard',      icon:'◌'},
];
const DESC = {
  sim:'Visual simulation of block propagation — Gossipsub vs RLNC-powered mump2p',
  roi:'Real-time validator earnings calculator powered by live ETH price & staking APR',
  bw: 'Bandwidth and cost savings calculator with real cloud provider pricing',
  map:'Global validator network — live stats from beaconcha.in',
  wiz:'Step-by-step mump2p integration guide with latest release version',
};

export default function OptimumApp() {
  const [active, setActive] = useState('sim');
  const { market, network, lastUpdated, refreshing, refetch } = useRealtimeData();

  return (
    <div style={{background:T.bg,minHeight:'100vh',color:T.tx,fontFamily:T.sans}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'16px 32px',borderBottom:`1px solid ${T.br}`}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontFamily:T.sans,fontWeight:900,fontSize:18,color:T.g,letterSpacing:-0.5}}>◈ OPTIMUM</span>
          <span style={{...lbl(),padding:'3px 10px',border:`1px solid ${T.br}`,borderRadius:20}}>DEVELOPER TOOLS</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          {market.ethPrice&&(
            <span style={{fontFamily:T.mono,fontSize:12}}>
              <span style={{color:T.mt}}>ETH </span>
              <span style={{color:T.g}}>${market.ethPrice?.toLocaleString()}</span>
              <span style={{color:market.ethChange24h>0?T.g:T.r,marginLeft:6,fontSize:10}}>
                {market.ethChange24h>0?'+':''}{market.ethChange24h?.toFixed(2)}%
              </span>
            </span>
          )}
          <LiveBar lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={refetch}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:`1px solid ${T.br}`,padding:'0 32px',overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActive(t.id)} style={{
            padding:'13px 18px',background:'none',border:'none',whiteSpace:'nowrap',
            borderBottom:`2px solid ${active===t.id?T.g:'transparent'}`,
            color:active===t.id?T.g:T.mt,cursor:'pointer',
            fontFamily:T.mono,fontSize:11,letterSpacing:'0.5px',
            display:'flex',alignItems:'center',gap:7,transition:'all 0.2s',
          }}>
            <span style={{fontSize:14}}>{t.icon}</span>
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Description */}
      <div style={{padding:'12px 32px',borderBottom:`1px solid ${T.br}`,background:`${T.s1}88`}}>
        <span style={{color:T.mt,fontSize:12,fontFamily:T.mono}}>{DESC[active]}</span>
      </div>

      {/* Content */}
      <div style={{padding:'28px 32px 48px'}}>
        {active==='sim'&&<SimTab/>}
        {active==='roi'&&<ROITab market={market}/>}
        {active==='bw' &&<BWTab/>}
        {active==='map'&&<MapTab network={network}/>}
        {active==='wiz'&&<WizardTab network={network}/>}
      </div>

      {/* Footer */}
      <div style={{borderTop:`1px solid ${T.br}`,padding:'14px 32px',
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:T.mt,fontSize:11,fontFamily:T.mono}}>
          Built for Optimum · getoptimum.xyz
        </span>
        <span style={{color:T.mt,fontSize:11,fontFamily:T.mono}}>
          Data: CoinGecko · beaconcha.in · GitHub · Refreshes every 30s
        </span>
      </div>
    </div>
  );
}
