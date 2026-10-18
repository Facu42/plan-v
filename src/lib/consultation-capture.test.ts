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
  const result=await decodeUploadedConsultation({size:100,arrayBuffer:async()=>new ArrayBuffer(1)} as File);
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
  const output=vi.fn();const capture=await prepareConsultationCapture(output,vi.fn(),vi.fn());
  capture.begin();processor.onaudioprocess!({inputBuffer:{getChannelData:()=>new Float32Array(4096).fill(0.25)}});await capture.stop();
  expect(output).toHaveBeenCalledTimes(1);
  const wav=output.mock.calls[0][0] as Uint8Array;
  expect(decodeConsultationWav(wav).durationSeconds).toBeGreaterThanOrEqual(0.1);
  expect(new DataView(wav.buffer).getInt16(44+4095*2,true)).toBeGreaterThan(0);
  expect(track.stop).toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
});
