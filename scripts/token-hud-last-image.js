const MODULE_ID="token-hud-last-image";
const FLAG="lastImage";
function ok(p){return typeof p==="string"&&p&&!p.includes("*")&&!p.includes("{")&&p!=="icons/svg/mystery-man.svg";}
Hooks.on("updateToken", async (doc,changes,opts,userId)=>{
 if(userId!==game.user.id)return;
 const img=foundry.utils.getProperty(changes,"texture.src");
 if(!ok(img))return;
 const actor=doc.actor;
 if(!actor?.isOwner)return;
 const pt=actor.prototypeToken;
 if(!pt.randomImg||!pt.texture?.src?.includes("*"))return;
 await actor.setFlag(MODULE_ID,FLAG,img);
});
Hooks.on("preCreateToken",(doc,data,opts,userId)=>{
 if(userId!==game.user.id)return;
 const actor=doc.actor;
 if(!actor)return;
 const pt=actor.prototypeToken;
 if(!pt.randomImg||!pt.texture?.src?.includes("*"))return;
 const img=actor.getFlag(MODULE_ID,FLAG);
 if(!ok(img))return;
 doc.updateSource({"texture.src":img});
});
Hooks.once("ready",()=>console.log(`${MODULE_ID} ready`));
