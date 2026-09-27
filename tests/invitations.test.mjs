import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { invitationScripts, validVoiceClip } from '../lib/invitations.ts';

const pack=JSON.parse(readFileSync(new URL('../public/audio/voice-pack.json',import.meta.url),'utf8'));
assert.ok(pack.clips.length>=6,'The app needs actual recordings, not an empty manifest');
assert.equal(new Set(pack.clips.map(clip=>clip.id)).size,pack.clips.length);
for(const language of ['ru','en']){
  const clips=pack.clips.filter(clip=>clip.language===language);
  assert.ok(clips.length>=3,`Provide varied ${language} invitations`);
  for(const clip of clips){
    assert.ok(validVoiceClip(clip));
    assert.equal(typeof clip.text,'string'); // Historical recordings stay unchanged; active invitations are text/live only.
    const audio=readFileSync(new URL(`../public${clip.src}`,import.meta.url));
    assert.ok(audio.length>1000,'A listed file must contain actual audio');
    assert.ok(!clip.id.startsWith('local-preview-'),'Do not reinstall the rejected system voices');
    assert.ok(clip.envelope.length>=40&&clip.envelope.length<=200,'Keep each prepared invitation short');
    assert.ok(clip.envelope.some(level=>level>.27),'Speech must open the mouth');
    assert.ok(clip.envelope.some(level=>level<.055),'Silence must close the mouth');
    if(clip.src.endsWith('.mp3'))assert.ok(audio[0]===0xff&&(audio[1]&0xe0)===0xe0||audio.toString('ascii',0,3)==='ID3','MP3 must contain a valid file signature');
    if(clip.src.endsWith('.wav')){
      assert.equal(audio.toString('ascii',0,4),'RIFF');
      assert.equal(audio.toString('ascii',8,12),'WAVE');
      let format,data;
      for(let at=12;at+8<=audio.length;){
        const size=audio.readUInt32LE(at+4),id=audio.toString('ascii',at,at+4);
        if(id==='fmt ')format=audio.subarray(at+8,at+8+size);
        if(id==='data')data=audio.subarray(at+8,at+8+size);
        at+=8+size+(size%2);
      }
      assert.ok(format&&data);assert.equal(format.readUInt16LE(0),1);
      assert.equal(format.readUInt16LE(2),1);assert.equal(format.readUInt16LE(14),16);
      const duration=data.length/format.readUInt32LE(8);
      assert.ok(duration>=2&&duration<=10,'Keep each invitation short');
      let peak=0;
      for(let i=0;i<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));
      assert.ok(peak>1000&&peak<32767,'Recordings must be audible and not digitally clipped');
      assert.equal(clip.envelope.length,Math.ceil(duration*20));
      assert.ok(clip.envelope.some(level=>level>.27),'Speech must open the mouth');
      assert.ok(clip.envelope.some(level=>level<.055),'Silence must close the mouth');
    }
  }
}
const base=pack.clips[0];
for(const src of ['https://example.com/audio.mp3','/audio/../private.wav','/audio/file.txt'])assert.equal(validVoiceClip({...base,src}),false);
for(const envelope of [[NaN],[Infinity],[-.1],[1.1],['1']])assert.equal(validVoiceClip({...base,envelope}),false);
console.log('PASS: actual RU/EN recordings, audio signatures, mouth envelopes, rejected-voice exclusion, and local-only manifest validation.');

assert.match(invitationScripts.ru[0],/Восемь/);assert.match(invitationScripts.en[0],/Eight/);
