import test from 'node:test';
import assert from 'node:assert/strict';
import {graphicsProfile,graphicsQuality} from '../simulation/graphics.js';

test('graphics preference accepts low effects and handles unavailable or corrupt storage',()=>{
  assert.equal(graphicsQuality({getItem:()=> 'low'}),'low');
  assert.deepEqual(graphicsProfile({getItem:()=> 'low'}),{quality:'low',lowEffects:true,pixelRatioCap:.7});
  assert.deepEqual(graphicsProfile({getItem:()=> 'standard'}),{quality:'standard',lowEffects:false,pixelRatioCap:1.5});
  assert.equal(graphicsQuality({getItem:()=> 'unexpected'}),'standard');
  assert.equal(graphicsQuality({getItem:()=> {throw new Error('unavailable');}}),'standard');
});
