const KEY='planv.returnToTeam';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function rememberTeamReturn(store:Store,path:string,now=new Date()){
 if(/^\/equipo\/?$/.test(path))store.setItem(KEY,now.toISOString());
 else store.removeItem(KEY);
}
export function takeTeamReturn(store:Store,path:string,now=new Date()){
 const value=store.getItem(KEY);store.removeItem(KEY);
 if(!value||path!=='/')return false;
 const age=now.getTime()-Date.parse(value);
 return Number.isFinite(age)&&age>=0&&age<=30*60*1000;
}
