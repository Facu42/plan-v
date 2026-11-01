/** WAV encoding stays in the browser: microphone + selected tab are mixed as audio only. */
export function encodeConsultationWav(samples:Float32Array,sampleRate:number):Uint8Array {
 const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);const text=(s:string,at:number)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
 text('RIFF',0);v.setUint32(4,buffer.byteLength-8,true);text('WAVEfmt ',8);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text('data',36);v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const value=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,value<0?value*32768:value*32767,true);}return new Uint8Array(buffer);
}
export function consultationBase64(audio:Uint8Array) { let text='';for(let i=0;i<audio.length;i+=16384)text+=String.fromCharCode(...audio.subarray(i,i+16384));return btoa(text); }
/** Preserve a short final block; pad only silence to the server's 0.1s minimum. */
function encodeSegment(samples:Float32Array,sampleRate:number):Uint8Array {
 const minimum=Math.ceil(sampleRate*0.1);
 if(samples.length>=minimum)return encodeConsultationWav(samples,sampleRate);
 const padded=new Float32Array(minimum);padded.set(samples);return encodeConsultationWav(padded,sampleRate);
}
export type AudioPresence={microphone:boolean;remote:boolean;microphone_level:number;remote_level:number};
export type ConsultationCapture={sources:AudioPresence;begin():void;stop():Promise<void>;dispose():void};
async function requireRecordedConsent(authorize?:()=>Promise<boolean>) {
 let allowed=false;try{allowed=await authorize?.()===true;}catch{/* Fail closed if the saved permission cannot be read. */}
 if(!allowed)throw new Error('La paciente debe activar los permisos de grabación e IA antes de continuar.');
}
export async function prepareConsultationCapture(onSegment:(audio:Uint8Array,index:number)=>void,onSources:(presence:AudioPresence)=>void,onInterruption:()=>void,authorize?:()=>Promise<boolean>):Promise<ConsultationCapture> {
 await requireRecordedConsent(authorize);
 if(!navigator.mediaDevices?.getDisplayMedia||!navigator.mediaDevices?.getUserMedia||!window.AudioContext)throw new Error('Este navegador no permite grabar la videollamada. Cargá un audio o una transcripción.');
 let mic:MediaStream|undefined,tab:MediaStream|undefined,ctx:AudioContext|undefined;let timer:ReturnType<typeof setInterval>|undefined;let disposed=false,started=false;
 const clean=()=>{disposed=true;if(timer)clearInterval(timer);mic?.getTracks().forEach(t=>t.stop());tab?.getTracks().forEach(t=>t.stop());if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>undefined);};
 try {
  // El video del compartir pantalla no se codifica ni se sube: solo entra el audio al WAV.
  tab=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
  for (const track of tab.getVideoTracks?.() ?? []) track.enabled = false;
  try{mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});}catch{clean();throw new Error('No se pudo activar el micrófono. Permití su acceso o cargá una grabación.');}
  ctx=new AudioContext();await ctx.resume();
  const processor=ctx.createScriptProcessor(4096,1,1),silent=ctx.createGain();silent.gain.value=0;processor.connect(silent);silent.connect(ctx.destination);
  const sources:AudioPresence={microphone:mic.getAudioTracks().some(t=>t.readyState==='live'),remote:tab.getAudioTracks().some(t=>t.readyState==='live'),microphone_level:0,remote_level:0};
  const levels:Array<{analyser:AnalyserNode;kind:'microphone'|'remote'}>=[];
  for(const [stream,kind] of [[mic,'microphone'],[tab,'remote']] as const){if(!stream.getAudioTracks().length)continue;const source=ctx.createMediaStreamSource(new MediaStream(stream.getAudioTracks())),gain=ctx.createGain(),analyser=ctx.createAnalyser();gain.gain.value=0.7;source.connect(gain);gain.connect(processor);source.connect(analyser);levels.push({analyser,kind});}
  let buffers:Float32Array[]=[],count=0,index=0;
  const flush=()=>{if(!count)return;const samples=new Float32Array(count);let offset=0;for(const b of buffers){samples.set(b,offset);offset+=b.length;}buffers=[];count=0;onSegment(encodeSegment(samples,ctx!.sampleRate),index++);};
  processor.onaudioprocess=event=>{if(!started||disposed)return;const b=new Float32Array(event.inputBuffer.getChannelData(0));buffers.push(b);count+=b.length;if(count>=ctx!.sampleRate*30)flush();};
  const interrupted=()=>{if(disposed)return;onInterruption();sources.microphone=mic!.getAudioTracks().some(t=>t.readyState==='live');sources.remote=tab!.getAudioTracks().some(t=>t.readyState==='live');onSources({...sources});};
  mic.getTracks().forEach(t=>t.addEventListener('ended',interrupted));tab.getTracks().forEach(t=>t.addEventListener('ended',interrupted));
  timer=setInterval(()=>{for(const {analyser,kind}of levels){const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);const rms=Math.sqrt(values.reduce((sum,v)=>sum+v*v,0)/values.length);if(kind==='microphone')sources.microphone_level=rms;else sources.remote_level=rms;}onSources({...sources});},500);
  onSources({...sources});
  return {sources,begin(){started=true;},async stop(){started=false;flush();processor.disconnect();clean();},dispose(){processor.disconnect();clean();}};
 }catch(error){clean();throw error;}
}

/** Supported codecs are decoded locally, then split into independently valid WAV files. */
export async function decodeUploadedConsultation(file:File,authorize?:()=>Promise<boolean>):Promise<Uint8Array[]> {
 await requireRecordedConsent(authorize);
 if(file.size>20*1024*1024)throw new Error('El audio supera 20 MB. Dividilo antes de cargarlo.');
 const ctx=new AudioContext();
 try{const decoded=await ctx.decodeAudioData(await file.arrayBuffer());if(decoded.duration>3*3600)throw new Error('El audio supera tres horas.');const mono=new Float32Array(decoded.length);for(let c=0;c<decoded.numberOfChannels;c++){const channel=decoded.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/decoded.numberOfChannels;}const step=Math.floor(decoded.sampleRate*30),chunks:Uint8Array[]=[];for(let i=0;i<mono.length;i+=step)chunks.push(encodeSegment(mono.subarray(i,Math.min(i+step,mono.length)),decoded.sampleRate));return chunks;}
 catch(error){if(error instanceof Error && (error.message.includes('tres horas')||error.message.includes('20 MB')))throw error;throw new Error('El navegador no puede leer este audio. Convertí a WAV o cargá una transcripción.');}
 finally{await ctx.close();}
}
