import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Hls from 'hls.js';
import { Search, Star, Upload, Link as LinkIcon, Tv, Film, Clapperboard, Radio, Settings, User, Play, Heart, MonitorUp, Shield, Grid3X3, Trash2 } from 'lucide-react';
import './styles.css';

const demo = [
  { id:'live-1', type:'live', title:'World News 24', category:'News', meta:'Live • Global', url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', poster:'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop' },
  { id:'live-2', type:'live', title:'Sport Arena', category:'Sports', meta:'Live • Sports', url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', poster:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop' },
  { id:'movie-1', type:'movie', title:'Night Runner', category:'Action', meta:'Movie • 2026 • 1h 48m', url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', poster:'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=900&auto=format&fit=crop' },
  { id:'movie-2', type:'movie', title:'Ocean Signal', category:'Adventure', meta:'Movie • 2025 • 2h 04m', url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', poster:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&auto=format&fit=crop' },
  { id:'series-1', type:'series', title:'The Signal', category:'Drama', meta:'Series • 3 Seasons • 24 Episodes', url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', poster:'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=900&auto=format&fit=crop' },
  { id:'series-2', type:'series', title:'Code Streets', category:'Crime', meta:'Series • 2 Seasons • 16 Episodes', url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', poster:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&auto=format&fit=crop' }
];

function classify(title, group){
  const t = `${title} ${group}`.toLowerCase();
  if (t.includes('series') || t.includes('season') || /s\d{1,2}e\d{1,2}/.test(t)) return 'series';
  if (t.includes('movie') || t.includes('vod') || t.includes('film')) return 'movie';
  return 'live';
}

function parseM3U(text){
  const lines = text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const out = [];
  for(let i=0;i<lines.length;i++){
    if(lines[i].startsWith('#EXTINF')){
      const info = lines[i];
      const url = lines[i+1] && !lines[i+1].startsWith('#') ? lines[i+1] : '';
      const name = (info.match(/,(.*)$/)||[])[1] || `Item ${out.length+1}`;
      const group = (info.match(/group-title="([^"]*)"/)||[])[1] || 'Imported';
      const logo = (info.match(/tvg-logo="([^"]*)"/)||[])[1] || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=900&auto=format&fit=crop';
      if(url) out.push({ id:`imp-${Date.now()}-${out.length}`, type:classify(name, group), title:name, category:group, meta:`${classify(name,group).toUpperCase()} • Playlist`, url, poster:logo });
    }
  }
  return out;
}

function Player({ item }){
  const video = useRef(null);
  useEffect(()=>{
    if(!item || !video.current) return;
    let hls;
    if(item.url.endsWith('.m3u8') && Hls.isSupported()){
      hls = new Hls();
      hls.loadSource(item.url);
      hls.attachMedia(video.current);
    } else {
      video.current.src = item.url;
    }
    return ()=> hls?.destroy();
  },[item]);
  return <video ref={video} controls playsInline poster={item?.poster} className="player" />;
}

function App(){
  const [items,setItems] = useState(()=> JSON.parse(localStorage.getItem('streamdock_items')||'null') || demo);
  const [selected,setSelected] = useState(items[0]);
  const [tab,setTab] = useState('home');
  const [query,setQuery] = useState('');
  const [favs,setFavs] = useState(()=> JSON.parse(localStorage.getItem('streamdock_favs')||'[]'));
  const [msg,setMsg] = useState('Gati për testim. Upload playlist M3U ose përdor demo.');
  const [link,setLink] = useState('');

  useEffect(()=>localStorage.setItem('streamdock_items', JSON.stringify(items)),[items]);
  useEffect(()=>localStorage.setItem('streamdock_favs', JSON.stringify(favs)),[favs]);

  const filtered = useMemo(()=> items.filter(item => {
    const byTab = tab==='home' || item.type===tab || (tab==='favorites' && favs.includes(item.id));
    const byQ = item.title.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase());
    return byTab && byQ;
  }),[items,tab,query,favs]);

  const stats = {
    live: items.filter(i=>i.type==='live').length,
    movie: items.filter(i=>i.type==='movie').length,
    series: items.filter(i=>i.type==='series').length
  };

  async function upload(e){
    const file=e.target.files?.[0]; if(!file) return;
    const text=await file.text();
    const parsed=parseM3U(text);
    if(!parsed.length) return setMsg('Nuk u gjetën kanale/filma/seriale. Kontrollo formatin M3U.');
    setItems(parsed); setSelected(parsed[0]); setMsg(`${parsed.length} items u importuan me sukses.`);
  }

  async function loadLink(){
    if(!link.trim()) return setMsg('Vendos link M3U.');
    try{
      const res=await fetch(link.trim());
      const text=await res.text();
      const parsed=parseM3U(text);
      if(!parsed.length) return setMsg('Linku u hap, por nuk u lexua playlist.');
      setItems(parsed); setSelected(parsed[0]); setMsg(`${parsed.length} items u importuan nga linku.`);
    }catch{ setMsg('Browser-i mund ta bllokojë linkun nga CORS. Përdor upload file ose backend proxy.'); }
  }

  const tabs=[['home','Home',Grid3X3],['live','Live TV',Radio],['movie','Movies',Film],['series','Series',Clapperboard],['favorites','Favorites',Star]];

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo"><Tv size={22}/></div><b>StreamDock <span>TV</span></b></div>
      <nav>{tabs.map(([id,label,Icon])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}><Icon size={21}/>{label}</button>)}</nav>
      <div className="sideBottom"><button><Settings size={20}/>Settings</button><button><User size={20}/>Profile</button></div>
    </aside>
    <main>
      <header><div className="search"><Search size={22}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Live, Movies, Series..."/></div><div className="time">StreamDock TV</div></header>
      <section className="hero">
        <div><span className="pill">{selected?.type?.toUpperCase()}</span><h1>{selected?.title}</h1><p>{selected?.meta}</p><div className="actions"><button className="primary" onClick={()=>document.querySelector('video')?.play()}><Play size={20}/>Watch Now</button><button onClick={()=>setFavs(favs.includes(selected.id)?favs.filter(x=>x!==selected.id):[...favs,selected.id])}><Heart size={20}/>Favorite</button></div></div>
        <Player item={selected}/>
      </section>
      <section className="quick">
        <button onClick={()=>setTab('live')}><Radio/> <b>{stats.live}</b><span>Live Channels</span></button>
        <button onClick={()=>setTab('movie')}><Film/> <b>{stats.movie}</b><span>Movies</span></button>
        <button onClick={()=>setTab('series')}><Clapperboard/> <b>{stats.series}</b><span>Series</span></button>
        <button><MonitorUp/> <b>TV</b><span>Remote Ready</span></button>
        <button><Shield/> <b>Safe</b><span>User Playlist</span></button>
      </section>
      <section className="importBox">
        <label><Upload size={20}/> Upload M3U<input type="file" accept=".m3u,.m3u8,text/plain" onChange={upload}/></label>
        <input value={link} onChange={e=>setLink(e.target.value)} placeholder="Paste M3U link"/>
        <button onClick={loadLink}><LinkIcon size={20}/>Load</button>
        <button onClick={()=>{setItems(demo);setSelected(demo[0]);setMsg('Demo u rikthye.')}}><Trash2 size={20}/>Reset</button>
      </section>
      <p className="msg">{msg}</p>
      <h2>{tabs.find(x=>x[0]===tab)?.[1] || 'Home'}</h2>
      <section className="grid">
        {filtered.map(item=><button key={item.id} className="card" onClick={()=>setSelected(item)}>
          <img src={item.poster}/><span>{item.type}</span><h3>{item.title}</h3><p>{item.meta}</p>
        </button>)}
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
