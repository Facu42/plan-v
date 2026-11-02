import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeUploadedConsultation, prepareConsultationCapture } from './consultation-capture';
import { decodeConsultationWav } from '../../server/consultations/audio';

afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});

function audioContext(samples:Float32Array,rate=48000){
 const processor={connect:vi.fn(),disconnect:vi.fn(),onaudioprocess:null as null|((event:{inputBuffer:{getChannelData:()=>Float32Array}})=>void)};
 class Context {
  sampleRate=rate;state='running';destination={};
  resume=async()=>{};close=async()=>{};
  createScriptProcessor=()=>processor;
  createGain=()=>({gain:{value:1},connect:vi.fn()});
  createMediaStreamSource=()=>({connect:vi.fn()});
  createAnalyser=()=>({fftSize:2048,getFloatTimeDomainData:vi.fn()});
  decodeAudioData=async()=>({duration:samples.length/rate,length:samples.length,sampleRate:rate,numberOfChannels:1,getChannelData:()=>samples});
 }
 vi.stubGlobal('AudioContext',Context);return {Context,processor};
}

describe('audio final válido para el servidor sin perder muestras',()=>{
 it('conserva el final menor a0,1s de un archivo de30s y un fragmento',async()=>{
  const samples=new Float32Array(30*48000+2400);samples[samples.length-1]=0.5;
  audioContext(samples);
  const result=await decodeUploadedConsultation({size:100,arrayBuffer:async()=>new ArrayBuffer(1)} as File,async()=>true);
  expect(result).toHaveLength(2);
  expect(decodeConsultationWav(result[1]).durationSeconds).toBeGreaterThanOrEqual(0.1);
  expect(new DataView(result[1].buffer).getInt16(44+2399*2,true)).toBeGreaterThan(0);
 });
 it('finaliza una captura con un solo bloque de4096 muestras a48kHz',async()=>{
  vi.useFakeTimers();const {Context,processor}=audioContext(new Float32Array(0));
  const track={readyState:'live',stop:vi.fn(),addEventListener:vi.fn()};
  const stream={getAudioTracks:()=>[track],getTracks:()=>[track]};
  vi.stubGlobal('navigator',{mediaDevices:{getDisplayMedia:async()=>stream,getUserMedia:async()=>stream}});
  vi.stubGlobal('window',{AudioContext:Context});vi.stubGlobal('MediaStream',class{});
  const output=vi.fn();const capture=await prepareConsultationCapture(output,vi.fn(),vi.fn(),async()=>true);
  capture.begin();processor.onaudioprocess!({inputBuffer:{getChannelData:()=>new Float32Array(4096).fill(0.25)}});await capture.stop();
  expect(output).toHaveBeenCalledTimes(1);
  const wav=output.mock.calls[0][0] as Uint8Array;
  expect(decodeConsultationWav(wav).durationSeconds).toBeGreaterThanOrEqual(0.1);
  expect(new DataView(wav.buffer).getInt16(44+4095*2,true)).toBeGreaterThan(0);
  expect(track.stop).toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
 it('apaga el video de la pestaña, no lo mezcla, y la pausa no guarda audio',async()=>{
  vi.useFakeTimers();const {Context,processor}=audioContext(new Float32Array(0));
  const video={enabled:true,readyState:'live',stop:vi.fn(),addEventListener:vi.fn()};
  const remote={readyState:'live',stop:vi.fn(),addEventListener:vi.fn()};
  const micTrack={readyState:'live',stop:vi.fn(),addEventListener:vi.fn()};
  const tab={getAudioTracks:()=>[remote],getVideoTracks:()=>[video],getTracks:()=>[video,remote]};
  const mic={getAudioTracks:()=>[micTrack],getVideoTracks:()=>[],getTracks:()=>[micTrack]};
  vi.stubGlobal('navigator',{mediaDevices:{getDisplayMedia:async()=>tab,getUserMedia:async()=>mic}});
  vi.stubGlobal('window',{AudioContext:Context});vi.stubGlobal('MediaStream',class{});
  const output=vi.fn();const capture=await prepareConsultationCapture(output,vi.fn(),vi.fn(),async()=>true);
  expect(video.enabled).toBe(false);
  capture.begin();capture.pause();
  processor.onaudioprocess!({inputBuffer:{getChannelData:()=>new Float32Array(4096).fill(0.25)}});
  expect(output).not.toHaveBeenCalled();
  capture.resume();
  processor.onaudioprocess!({inputBuffer:{getChannelData:()=>new Float32Array(4096).fill(0.25)}});
  await capture.stop();
  expect(output).toHaveBeenCalledTimes(1);
 });
 it('el modo solo micrófono no pide la pestaña',async()=>{
  const {Context}=audioContext(new Float32Array(0));
  const getDisplayMedia=vi.fn();
  const track={readyState:'live',stop:vi.fn(),addEventListener:vi.fn()};
  vi.stubGlobal('navigator',{mediaDevices:{getDisplayMedia,getUserMedia:async()=>({getAudioTracks:()=>[track],getTracks:()=>[track]})}});
  vi.stubGlobal('window',{AudioContext:Context});vi.stubGlobal('MediaStream',class{});
  const capture=await prepareConsultationCapture(vi.fn(),vi.fn(),vi.fn(),undefined,{micOnly:true,preconsented:true});
  expect(getDisplayMedia).not.toHaveBeenCalled();
  expect(capture.sources.remote).toBe(false);
  expect(capture.sources.microphone).toBe(true);
  capture.dispose();
 });
});

describe('consentimiento registrado antes de usar el audio',()=>{
 it.each(['ausente','retirado','consulta fallida'])('no pide micrófono ni pantalla con permiso %s',async scenario=>{
  const getDisplayMedia=vi.fn(),getUserMedia=vi.fn();
  vi.stubGlobal('navigator',{mediaDevices:{getDisplayMedia,getUserMedia}});
  vi.stubGlobal('window',{AudioContext:class{}});
  const authorize=scenario==='ausente'?undefined:async()=>{if(scenario==='consulta fallida')throw Error('offline');return false;};
  await expect(prepareConsultationCapture(vi.fn(),vi.fn(),vi.fn(),authorize)).rejects.toThrow();
  expect(getDisplayMedia).not.toHaveBeenCalled();expect(getUserMedia).not.toHaveBeenCalled();
 });
 it.each(['ausente','retirado','consulta fallida'])('no lee ni decodifica un archivo con permiso %s',async scenario=>{
  const arrayBuffer=vi.fn(async()=>new ArrayBuffer(1)),Context=vi.fn();
  vi.stubGlobal('AudioContext',Context);
  const authorize=scenario==='ausente'?undefined:async()=>{if(scenario==='consulta fallida')throw Error('offline');return false;};
  await expect(decodeUploadedConsultation({size:100,arrayBuffer} as unknown as File,authorize)).rejects.toThrow();
  expect(arrayBuffer).not.toHaveBeenCalled();expect(Context).not.toHaveBeenCalled();
 });
});
