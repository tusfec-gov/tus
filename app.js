(()=>{
const S=window.SITE,app=document.getElementById("app"),T="gh_token";let O=S.repo;
let D=null,FL="";
const api=()=>`https://api.github.com/repos/${O.owner}/${O.name}/contents/`;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ss=(k,v)=>{try{if(v===undefined)return sessionStorage.getItem(k);v===null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){return null}};
const $=i=>document.getElementById(i);
{const q=ss("repo");if(q){const a=q.split("|");O={owner:a[0],name:a[1],branch:a[2]||"main"}}}
const sha=t=>crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)).then(b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""));
const b64=s=>btoa(unescape(encodeURIComponent(s)));
const party=id=>D.parties.find(p=>p.id===id);
const cand=id=>D.president.candidates.find(c=>c.id===id);
const fmt=d=>{const x=new Date(d);return isNaN(x)?"":x.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})};
const go=h=>{location.hash===h?route():location.hash=h};
const STAT={called:"Called",pending:"Awaiting results",recount:"Recount"};
const stat=x=>`<span class="st st-${esc(x.status)}">${esc(STAT[x.status]||x.status)}</span>`;
const chip=id=>{const q=party(id);return q?`<span class="chip" style="background:${esc(q.color)}">${esc(q.name)}</span>`:""};
const paras=b=>String(b||"").split(/\n\s*\n/).filter(p=>p.trim()).map(p=>`<p>${esc(p)}</p>`).join("");
const ev=s=>+s.ev||0;
/* GitHub saving */
const gh=(p,o={})=>fetch(api()+p,{...o,headers:{Authorization:"Bearer "+ss(T),Accept:"application/vnd.github+json"}});
async function saveData(fn,msg){
  const r=await gh("data.json?ref="+O.branch);
  if(!r.ok)throw new Error(`Could not read data.json (${r.status}). Check the token and the repo in config.js.`);
  const f=await r.json(),cur=JSON.parse(decodeURIComponent(escape(atob(f.content.replace(/\n/g,""))))),nx=fn(cur);
  nx.updated=new Date().toISOString();
  const w=await gh("data.json",{method:"PUT",body:JSON.stringify({message:msg,branch:O.branch,sha:f.sha,content:b64(JSON.stringify(nx,null,1))})});
  if(!w.ok)throw new Error(`Save failed (${w.status}). The token needs Contents read and write access.`);
  D=nx;
}
/* layout */
function shell(html,r){
  const nav=[["","Home"],["president","President"],["senate","Senate"],["house","House"],["news","Announcements"]].map(n=>`<a href="#/${n[0]}"${n[0]===r?' class="on"':""}>${n[1]}</a>`).join("")+`<a class="gap${r==="staff"?" on":""}" href="#/${ss("who")?"dashboard":"login"}">${ss("who")?"Dashboard":"Staff"}</a>`;
  app.innerHTML=`<div class="disc0">${esc(S.disclaimer)}</div><header class="top"><div class="w bar"><a class="brand" href="#/">${S.logo?`<img src="${esc(S.logo)}" alt="">`:""}${esc(S.name)}</a><span class="tag">${esc(S.tagline)}</span></div><nav class="cats" aria-label="Sections"><div class="w">${nav}</div></nav></header><main class="w">${html}</main><footer><div class="w"><b>${esc(S.name)}</b><p>${esc(S.legal)}</p></div></footer>`;
  window.scrollTo(0,0);
}
const bar=parts=>`<div class="bar2" role="img" aria-label="${esc(parts.map(p=>p.l+" "+p.n).join(", "))}">${parts.filter(p=>p.n>0).map(p=>`<span style="flex:${p.n};background:${esc(p.c)}">${p.n}</span>`).join("")}</div><div class="leg2">${parts.map(p=>`<span><i style="background:${esc(p.c)}"></i>${esc(p.l)} ${p.n}</span>`).join("")}</div>`;
const seatParts=l=>D.parties.map(p=>({c:p.color,n:l.filter(x=>x.status==="called"&&x.party===p.id).length,l:p.name})).concat([{c:"var(--pend)",n:l.filter(x=>x.status!=="called"||!party(x.party)).length,l:"Undecided"}]);
function evParts(){
  const st=D.president.states,tot=st.reduce((a,s)=>a+ev(s),0);
  const c=D.president.candidates.map(k=>{const p=party(k.party);return{c:p?p.color:"#888",n:st.filter(s=>s.status==="called"&&s.winner===k.id).reduce((a,s)=>a+ev(s),0),l:k.name}});
  return{parts:c.concat([{c:"var(--pend)",n:tot-c.reduce((a,x)=>a+x.n,0),l:"Undecided"}]),tot,need:Math.floor(tot/2)+1,c};
}
const seat=(x,title)=>`<div class="seat"><div class="sh2"><b>${esc(title)}</b>${stat(x)}</div>${x.status==="called"&&x.winner?`<div class="win">${esc(x.winner)}${chip(x.party)}</div>`:`<div class="mut">${x.incumbent?"Incumbent: "+esc(x.incumbent):"No result yet"}</div>`}${x.votes||x.margin?`<small>${x.votes?esc(x.votes)+" votes":""}${x.votes&&x.margin?", ":""}${x.margin?"margin "+esc(x.margin):""}</small>`:""}</div>`;
const news=l=>l.length?l.map(a=>`<article class="ann"><small>${esc(fmt(a.date))}</small><h3>${esc(a.title)}</h3>${paras(a.body)}</article>`).join(""):'<p class="mut">No announcements yet.</p>';
/* public pages */
function home(){
  const e=evParts(),w=e.c.find(x=>x.n>=e.need),h=D.house,s=D.senate,n=l=>l.filter(x=>x.status==="called").length;
  shell(`<h1>${esc(D.election.name)}</h1><p class="lede">Results from the ${esc(S.name)}. Last updated ${esc(fmt(D.updated))}.</p><div class="cards3"><a class="card2" href="#/president"><h3>President</h3>${w?`<p class="win">${esc(w.l)} wins the presidency</p>`:`<p class="mut">${e.need} of ${e.tot} electoral votes needed to win</p>`}${bar(e.parts)}</a><a class="card2" href="#/senate"><h3>United States Senate</h3><p class="mut">${n(s)} of ${s.length} seats called</p>${bar(seatParts(s))}</a><a class="card2" href="#/house"><h3>House of Representatives</h3><p class="mut">${n(h)} of ${h.length} seats called</p>${bar(seatParts(h))}</a></div><h2 class="sh">Latest announcements</h2>${news(D.announcements.slice(0,3))}<p><a class="mut" href="#/news">All announcements</a></p>`,"");
}
function house(){const l=D.house;shell(`<h1>House of Representatives</h1><p class="lede">${l.length} seats. ${l.filter(x=>x.status==="called").length} called.</p>${bar(seatParts(l))}<div class="grid">${l.map(x=>seat(x,x.name)).join("")}</div>`,"house")}
function senate(){const l=D.senate;shell(`<h1>United States Senate</h1><p class="lede">${l.length} seats. ${l.filter(x=>x.status==="called").length} called.</p>${bar(seatParts(l))}${["I","II","III"].map(c=>{const g=l.filter(x=>x.class===c);return g.length?`<h2 class="sh">Class ${c} (${g.length} seats)</h2><div class="grid">${g.map(x=>seat(x,x.state)).join("")}</div>`:""}).join("")}`,"senate")}
const newsPage=()=>shell(`<h1>Announcements</h1>${news(D.announcements)}`,"news");
function president(){
  const e=evParts(),w=e.c.find(x=>x.n>=e.need);
  const tiles=D.president.states.map(s=>{const k=cand(s.winner),q=s.status==="called"&&k?party(k.party):null;return `<button type="button" class="tile st-${esc(s.status)}" data-s="${esc(s.code)}" style="grid-column:${s.col+1};grid-row:${s.row+1};background:${q?esc(q.color):"var(--pend)"}" aria-label="${esc(s.name)}"><b>${esc(s.code)}</b><small>${ev(s)}</small></button>`}).join("");
  shell(`<h1>Presidential election</h1>${w?`<p class="lede win">${esc(w.l)} has won the presidency with ${w.n} electoral votes.</p>`:`<p class="lede">${e.need} of ${e.tot} electoral votes are needed to win.</p>`}${bar(e.parts)}<h2 class="sh">Results by state</h2><div class="map" id="mp">${tiles}</div><div id="sd" class="box">Select a state to see its result.</div><h2 class="sh">Candidates</h2><div class="cards3">${D.president.candidates.map(k=>`<div class="card2"><h3>${esc(k.name)}</h3>${chip(k.party)}${k.ticket?`<p class="mut">Running mate: ${esc(k.ticket)}</p>`:""}</div>`).join("")}</div>`,"president");
  $("mp").onclick=x=>{const t=x.target.closest(".tile");if(!t)return;const s=D.president.states.find(z=>z.code===t.dataset.s),k=cand(s.winner);$("sd").innerHTML=`<h3>${esc(s.name)}</h3><p>${ev(s)} electoral vote${ev(s)===1?"":"s"}. ${stat(s)}</p>${s.status==="called"&&k?`<p class="win">${esc(k.name)}${chip(k.party)}</p>`:""}${s.votes||s.margin?`<small>${s.votes?esc(s.votes)+" votes":""}${s.votes&&s.margin?", ":""}${s.margin?"margin "+esc(s.margin):""}</small>`:""}`};
}
/* staff */
function login(){
  if(ss("who"))return go("#/dashboard");
  shell(`<h1>Staff login</h1><form class="box" id="lf"><label for="u">Username</label><input id="u" autocomplete="username" required><label for="p">Password</label><input id="p" type="password" autocomplete="current-password" required><p><button>Log in</button></p><p class="err" id="m"></p></form>`,"staff");
  $("lf").onsubmit=async e=>{e.preventDefault();const h=await sha($("p").value),u=$("u").value.trim().toLowerCase(),a=S.accounts.find(x=>x.name.toLowerCase()===u&&x.passwordHash===h);if(a){ss("who",a.name);go("#/dashboard")}else $("m").textContent="Wrong username or password."};
}
function gate(next){
  const cur=/YOUR-/i.test(O.owner+O.name)?"":`${O.owner}/${O.name}`;
  shell(`<h1>Connect to GitHub</h1><form class="box" id="gf"><p>Enter your repository and a GitHub token to update results. They stay in this browser tab only and are cleared when you log out.</p><label for="rp">Repository (owner/name)</label><input id="rp" value="${esc(cur)}" placeholder="your-org/your-repo" required><label for="k">GitHub token (fine-grained or classic)</label><input id="k" type="password" autocomplete="off" required><p><button>Continue</button></p><p id="m" class="mut"></p></form>`,"staff");
  $("gf").onsubmit=async e=>{e.preventDefault();const m=$("m"),t=$("k").value.trim().replace(/^Bearer\s+/i,"");
    const p=$("rp").value.trim().replace(/^https?:\/\/github\.com\//i,"").replace(/\.git$/,"").replace(/^\/|\/$/g,"").split("/");
    if(p.length<2||!p[0]||!p[1]){m.className="err";m.textContent="Enter the repository as owner/name, for example my-org/my-repo.";return}
    m.className="mut";m.textContent="Checking...";
    try{
      const r=await fetch(`https://api.github.com/repos/${p[0]}/${p[1]}`,{headers:{Authorization:"Bearer "+t,Accept:"application/vnd.github+json"}});
      const j=await r.json().catch(()=>({}));
      if(r.status===401)throw new Error("GitHub says the token isn't valid. Copy it again with no spaces.");
      if(!r.ok)throw new Error(`GitHub said ${r.status}${j.message?": "+j.message:""}. Check the repository name (${p[0]}/${p[1]}) and that the token can access it. For an organisation, the token may need approving or SSO authorisation.`);
      if(j.permissions&&j.permissions.push===false)throw new Error("This token can read the repo but not write to it. A classic token needs the repo scope; a fine-grained token needs Contents: Read and write.");
      O={owner:j.owner.login,name:j.name,branch:j.default_branch||"main"};ss("repo",`${O.owner}|${O.name}|${O.branch}`);
      ss(T,t);go(next)}catch(x){m.className="err";m.textContent=x.message}};
}
const opts=(f,v,o)=>`<select data-f="${f}">${o.map(x=>`<option value="${esc(x[0])}"${String(x[0])===String(v)?" selected":""}>${esc(x[1])}</option>`).join("")}</select>`;
function cell(c,x){
  const k=c[2],v=x[c[0]];
  if(k==="ro")return `${esc(v)}<input type="hidden" data-f="${c[0]}" value="${esc(v)}">`;
  if(k==="status")return opts(c[0],v,Object.entries(STAT));
  if(k==="party")return opts(c[0],v,[["","-"]].concat(D.parties.map(p=>[p.id,p.name])));
  if(k==="cand")return opts(c[0],v,[["","-"]].concat(D.president.candidates.map(p=>[p.id,p.name])));
  if(k==="cls")return opts(c[0],v,[["I","I"],["II","II"],["III","III"]]);
  return `<input data-f="${c[0]}" value="${esc(v)}">`;
}
const table=(key,list,cols)=>`<div class="tw"><table class="et" data-k="${key}"><thead><tr>${cols.map(c=>`<th>${c[1]}</th>`).join("")}</tr></thead><tbody>${list.map((x,i)=>`<tr data-i="${i}">${cols.map(c=>`<td>${cell(c,x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const getL=k=>k==="candidates"?D.president.candidates:k==="states"?D.president.states:D[k];
const setL=(c,k,a)=>{if(k==="candidates")c.president.candidates=a;else if(k==="states")c.president.states=a;else c[k]=a};
const readT=(k,l)=>[...document.querySelectorAll(`table[data-k="${k}"] tr[data-i]`)].map(tr=>{const o={...l[+tr.dataset.i]};tr.querySelectorAll("[data-f]").forEach(e=>{o[e.dataset.f]=e.dataset.f==="ev"?(+e.value||0):e.value});return o});
function dash(){
  if(!ss("who"))return go("#/login");
  if(!ss(T))return gate("#/dashboard");
  const seatCols=(first)=>[...first,["incumbent","Incumbent"],["status","Status","status"],["winner","Winner"],["party","Party","party"],["votes","Votes"],["margin","Margin"]];
  const sec=(k,t,l,cols,ex="")=>`<h2 class="sh">${t}</h2>${ex}${table(k,l,cols)}<p><button data-save="${k}">Save ${t.toLowerCase()}</button></p>`;
  const po=D.parties.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
  shell(`<h1>Dashboard</h1><p>Signed in as ${esc(ss("who"))}. <a href="#/dashboard" id="lo" class="ul">Log out</a><a href="#/dashboard" id="ct" class="ul">Change token</a></p><p id="m"></p>
<h2 class="sh">Election</h2><div class="box"><label for="en">Election name</label><input id="en" value="${esc(D.election.name)}"><p><button id="sen">Save name</button></p></div>
${sec("candidates","Candidates",D.president.candidates,[["id","ID","ro"],["name","Name"],["party","Party","party"],["ticket","Running mate"]],`<div class="box"><label for="nc">New candidate</label><input id="nc" placeholder="Name"><select id="npp">${po}</select><input id="nr" placeholder="Running mate (optional)" style="margin-top:.4rem"><p><button id="ac">Add candidate</button></p></div>`)}
${sec("states","State results",D.president.states,[["code","Code","ro"],["name","State"],["ev","Electoral votes"],["status","Status","status"],["winner","Winner","cand"],["votes","Votes"],["margin","Margin"]])}
${sec("senate","Senate seats",D.senate,seatCols([["state","Seat"],["class","Class","cls"]]))}
${sec("house","House seats",D.house,seatCols([["name","Seat"]]))}
${sec("parties","Parties",D.parties,[["id","ID","ro"],["name","Name"],["color","Colour (hex)"]])}
<h2 class="sh">Announcements</h2><div class="box"><label for="at">Title</label><input id="at"><label for="ab">Message (blank line = new paragraph)</label><textarea id="ab"></textarea><p><button id="aa">Post announcement</button></p></div>${D.announcements.map(a=>`<div class="row"><span>${esc(a.title)} <small>${esc(fmt(a.date))}</small></span><button class="dng" data-del="${esc(a.id)}">Delete</button></div>`).join("")}`,"staff");
  const m=$("m"),say=(t,c)=>{m.className=c||"mut";m.textContent=t};
  const run=(fn,msg,ok)=>{say("Saving...");saveData(fn,msg).then(()=>{FL=ok;dash()}).catch(e=>say(e.message,"err"))};
  $("lo").onclick=e=>{e.preventDefault();ss("who",null);ss(T,null);go("#/dashboard")};
  $("ct").onclick=e=>{e.preventDefault();ss(T,null);go("#/dashboard")};
  $("sen").onclick=()=>run(c=>{c.election.name=$("en").value.trim()||c.election.name;return c},"Update election name","Saved.");
  document.querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>{const k=b.dataset.save,a=readT(k,getL(k));run(c=>{setL(c,k,a);return c},"Update "+k,"Saved "+k+".")});
  $("ac").onclick=()=>{const n=$("nc").value.trim();if(!n)return say("Enter a candidate name.","err");run(c=>{c.president.candidates.push({id:"c"+Date.now().toString(36),name:n,party:$("npp").value,ticket:$("nr").value.trim()});return c},"Add candidate","Candidate added.")};
  $("aa").onclick=()=>{const t=$("at").value.trim(),b=$("ab").value.trim();if(!t)return say("Add a title.","err");run(c=>{c.announcements.unshift({id:"n"+Date.now().toString(36),date:new Date().toISOString().slice(0,10),title:t,body:b});return c},"Post announcement","Announcement posted.")};
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("Delete this announcement?"))run(c=>{c.announcements=c.announcements.filter(a=>a.id!==b.dataset.del);return c},"Delete announcement","Announcement deleted.")});
  if(FL){say(FL,"ok");FL=""}
}
function hashPage(){
  shell(`<h1>Password hash</h1><form class="box" id="hf"><label for="p">Password</label><input id="p"><p><button>Make hash</button></p><p id="o" style="word-break:break-all"></p></form>`,"");
  $("hf").onsubmit=async e=>{e.preventDefault();$("o").textContent=await sha($("p").value)};
}
function route(){
  const r=location.hash.replace(/^#\/?/,"").split("/")[0];document.title=S.name;
  const R={"":home,president,senate,house,news:newsPage,login,dashboard:dash,hash:hashPage};(R[r]||home)();
}
addEventListener("hashchange",route);
fetch("data.json?"+Date.now()).then(r=>r.json()).then(d=>{D=d;route()}).catch(()=>{app.innerHTML="<p style='padding:2rem'>Could not load data.json.</p>"});
})();
