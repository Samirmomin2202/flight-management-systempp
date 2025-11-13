import React from 'react';

// Attempts sequential sources; falls back to default.svg or generated initials badge.
const AirlineLogo = ({ name, dbUrl }) => {
  const raw = (name||'').toLowerCase();
  const slug = raw.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const noSpace = raw.replace(/\s+/g,'');
  const sources = [
    slug && `/airlines/${slug}/logo.png`,
    slug && `/airlines/${slug}/logo.jpg`,
    slug && `/airlines/${slug}/logo.jpeg`,
    slug && `/airlines/${slug}.png`,
    slug && `/airlines/${slug}.jpg`,
    slug && `/airlines/${slug}.jpeg`,
    noSpace && `/airlines/${noSpace}.png`,
    noSpace && `/airlines/${noSpace}.jpg`,
    noSpace && `/airlines/${noSpace}.jpeg`,
    dbUrl || null,
    '/airlines/default.svg'
  ].filter(Boolean);
  const [idx, setIdx] = React.useState(0);
  const current = sources[idx];
  const handleError = () => {
    if (idx < sources.length - 1) setIdx(i => i + 1);
  };
  if (!current) return <GeneratedLogo name={name} />;
  const handleLoad = (e) => {
    if (!/(^emirates$|^air india$|^akasa air$)/i.test(name)) return;
    try {
      const img = e.currentTarget;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      const { width, height } = canvas;
      const imgData = ctx.getImageData(0,0,width,height);
      const d = imgData.data;
      // Sample corners to estimate background color
      const samples = [];
      const pushSample = (x,y)=>{ const i=(y*width+x)*4; samples.push([d[i],d[i+1],d[i+2]]); };
      pushSample(0,0); pushSample(width-1,0); pushSample(0,height-1); pushSample(width-1,height-1); pushSample(Math.floor(width/2),0); pushSample(Math.floor(width/2),height-1);
      const avg = samples.reduce((a,[r,g,b])=>[a[0]+r,a[1]+g,a[2]+b],[0,0,0]).map(v=>v/samples.length);
      const [br,bg,bb] = avg;
      const brightness = (br+bg+bb)/3;
      for (let i=0;i<d.length;i+=4){
        const r=d[i], g=d[i+1], b=d[i+2];
        const pixelBrightness=(r+g+b)/3;
        const max=Math.max(r,g,b), min=Math.min(r,g,b);
        const saturation = max===0?0: (max-min)/max;
        // Conditions: near background brightness & low saturation & fairly light
        if (pixelBrightness > 180 && Math.abs(pixelBrightness-brightness) < 40 && saturation < 0.15){
          d[i+3]=0;
        }
      }
      ctx.putImageData(imgData,0,0);
      // Crop transparent edges
      let top=0,bottom=height-1,left=0,right=width-1;
      const isRowTransparent = (y)=>{ for(let x=0;x<width;x++){ const ii=(y*width+x)*4; if(d[ii+3]>10) return false; } return true; };
      const isColTransparent = (x)=>{ for(let y=0;y<height;y++){ const ii=(y*width+x)*4; if(d[ii+3]>10) return false; } return true; };
      while(top<bottom && isRowTransparent(top)) top++;
      while(bottom>top && isRowTransparent(bottom)) bottom--;
      while(left<right && isColTransparent(left)) left++;
      while(right>left && isColTransparent(right)) right--;
      const cropW = right-left+1; const cropH = bottom-top+1;
      const cropped = ctx.getImageData(left,top,cropW,cropH);
      canvas.width=cropW; canvas.height=cropH; ctx.putImageData(cropped,0,0);
      img.src = canvas.toDataURL('image/png');
    } catch {}
  };
  return (
    <img
      src={current}
      alt={name}
      className='max-h-16 object-contain p-1'
      loading='lazy'
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

const AirlineStrip = ({ airlines }) => {
  if (!airlines?.length) return null;
  // Remove Air India Express, ensure Emirates present
  const filtered = airlines.filter(a => !/^Air India Express$/i.test(a.name));
  if (!filtered.some(a=>/^Emirates$/i.test(a.name))) {
    filtered.push({ _id:'emirates-temp', name:'Emirates', logoUrl:'/airlines/emirates.png' });
  }
  return (
    <div className='mb-8'>
      <h3 className='text-lg font-semibold mb-3'>Popular Domestic Airlines</h3>
      <div className='border rounded-3xl px-4 py-6 flex flex-wrap md:flex-nowrap gap-8 justify-center bg-white shadow-sm'>
        {filtered.map(a => (
          <div key={a._id || a.name} className='flex flex-col items-center w-28'>
            <div className='h-16 w-20 flex items-center justify-center rounded-lg overflow-hidden'>
              <AirlineLogo name={a.name} dbUrl={a.tailLogoUrl || a.logoUrl} />
            </div>
            <div className='mt-2 text-xs text-blue-700 font-semibold text-center line-clamp-2'>{a.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GeneratedLogo = ({name}) => {
  const initials = (name||'AL')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0,2)
    .map(w=>w[0].toUpperCase())
    .join('');
  let hash=0; for (let i=0;i<name.length;i++){ hash = name.charCodeAt(i) + ((hash<<5)-hash); }
  const palette=[["#1e3a8a","#2563eb"],["#7c2d12","#ea580c"],["#064e3b","#10b981"],["#581c87","#7e22ce"],["#0f172a","#334155"],["#78350f","#d97706"]];
  const colors = palette[Math.abs(hash)%palette.length];
  return (
    <div
      className='w-full h-full flex items-center justify-center font-bold text-white text-xs'
      style={{background:`linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`}}
      title={name}
    >{initials||'AL'}</div>
  );
};

export default AirlineStrip;