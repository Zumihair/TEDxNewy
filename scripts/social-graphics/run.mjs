import { chromium } from "playwright";
import fs from "fs";
const { jobs } = await import(process.env.JOBS||"./jobs.example.mjs");
const bundle=fs.readFileSync("bundle.js","utf8");
const only=process.argv[2]?process.argv[2].split(","):null;
const b=await chromium.launch(); const pg=await b.newPage();
await pg.goto("https://tedxnewy.com.au/",{waitUntil:"domcontentloaded"});
await pg.evaluate(bundle);
fs.mkdirSync("out",{recursive:true});
const specs={};const SPECOUT=process.env.SPECOUT||"specs.json";
for(const [file,url,mode,aspect,over] of jobs){
  if(only&&!only.includes(file))continue;
  const r=await pg.evaluate(async([url,mode,aspect,over])=>{
    const {renderPost,DEFAULT_SPEC,PALETTE}=window.CC;
    const load=s=>new Promise((res,rej)=>{const i=new Image();i.crossOrigin="anonymous";i.onload=()=>res(i);i.onerror=rej;i.src=s;});
    const im=await load(url);
    const W=1080,H=aspect==="1:1"?1080:1350;
    let src=im;
    if(mode!=="cover"){
      const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
      if(mode==="art"){
        x.fillStyle=PALETTE.cream;x.fillRect(0,0,W,H);
        const h=im.height*W/im.width; x.drawImage(im,0,(H-h)/2+20,W,h);
      } else {
        const s=Math.max(W/im.width,H/im.height);
        x.filter="blur(36px) brightness(0.7)";x.drawImage(im,(W-im.width*s)/2,(H-im.height*s)/2,im.width*s,im.height*s);x.filter="none";
        const h=im.height*W/im.width; x.drawImage(im,0,(H-h)/2,W,h);
      }
      src=c;
    }
    let spec={...DEFAULT_SPEC,aspect,overlay:{colour:"dark",placement:"bottom",strength:0.55},...over};
    if(mode==="art"){spec={...spec,overlay:{colour:"dark",placement:"none",strength:0},logo:{corner:"tl",style:"black",event:"Standard"},textColour:"ink",headline:"",subtext:"Drawn live by Alex Wegner of Sketch it Live"};}
    const out=document.createElement("canvas");
    if(over.autoLogo){
      await renderPost(out,{...spec,logo:{...spec.logo,corner:"none"}},src,1);
      const d=out.getContext("2d").getImageData(59,59,254,46).data; let l=0;
      for(let i=0;i<d.length;i+=4) l+=(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2])/255; l/=d.length/4;
      spec={...spec,logo:{...spec.logo,style:l>0.5?"black":"white"}};
    }
    await renderPost(out,spec,src,1);
    return {png:out.toDataURL("image/png"),spec};
  },[url,mode,aspect,over]);
  fs.writeFileSync(`out/${file}.png`,Buffer.from(r.png.split(",")[1],"base64"));
  specs[file]=r.spec; console.log("ok",file);
}
fs.writeFileSync(SPECOUT,JSON.stringify(specs,null,1));
await b.close();
