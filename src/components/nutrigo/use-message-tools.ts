import {useCallback,useEffect,useRef,useState} from 'react';
import {messageToolsApi} from '../../api/accompaniment';
import type {MessageSettings,SaveMessageSettings} from '../../types/message-settings';
import {friendlyError} from '../../lib/error-messages';

export type MessageToolsState={data:MessageSettings|null;error:string;loading:boolean;busy:boolean;reload:()=>void;save:(input:SaveMessageSettings)=>Promise<MessageSettings>};
export function useMessageTools(enabled:boolean):MessageToolsState{
 const [data,setData]=useState<MessageSettings|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(enabled),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 const alive=useRef(false),saving=useRef(false),loadController=useRef<AbortController|null>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;loadController.current?.abort();};},[]);
 useEffect(()=>{loadController.current?.abort();if(!enabled){setData(null);setLoading(false);setError('');return;}const controller=new AbortController();loadController.current=controller;setLoading(true);setError('');messageToolsApi.load(controller.signal).then(result=>{if(!controller.signal.aborted)setData(result);}).catch(error=>{if(!controller.signal.aborted){setData(null);setError(friendlyError(error));}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[enabled,revision]);
 const reload=useCallback(()=>{if(!saving.current)setRevision(n=>n+1);},[]);
 const save=useCallback(async(input:SaveMessageSettings)=>{if(!enabled||saving.current)throw new Error('Esperá a que termine el guardado.');saving.current=true;loadController.current?.abort();setBusy(true);setLoading(false);setError('');try{const result=await messageToolsApi.save(input);if(alive.current)setData(result);return result;}catch(error){if(alive.current)setError(friendlyError(error));throw error;}finally{saving.current=false;if(alive.current)setBusy(false);}},[enabled]);
 return {data,error,loading,busy,reload,save};
}
