import {test} from 'node:test';
import assert from 'node:assert/strict';
import {approveRegistration} from '../lib/approve-registration';
const member={_id:'id',name:'Test',email:'test@example.test',nik:'123',status:'active'};
test('persetujuan membuat akun setelah berhasil mengaktifkan anggota',async()=>{const events:string[]=[];const result=await approveRegistration({activate:async()=>{events.push('activate');return member},saveAccount:async()=>{events.push('account')},restore:async()=>{events.push('restore')}});assert.equal(result,member);assert.deepEqual(events,['activate','account'])});
test('kegagalan akun memulihkan status anggota',async()=>{const events:string[]=[];await assert.rejects(approveRegistration({activate:async()=>member,saveAccount:async()=>{throw Error('duplicate')},restore:async()=>{events.push('restore')}}),/duplicate/);assert.deepEqual(events,['restore'])});
test('persetujuan kedua tidak membuat akun atau mengubah keputusan',async()=>{const events:string[]=[];await assert.rejects(approveRegistration({activate:async()=>null,saveAccount:async()=>{events.push('account')},restore:async()=>{events.push('restore')}}),/ALREADY_PROCESSED/);assert.deepEqual(events,[])});
