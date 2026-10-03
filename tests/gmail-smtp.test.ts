import {test} from 'node:test';
import assert from 'node:assert/strict';
import {smtpConfig,smtpErrorHint} from '../lib/smtp';
const env={SMTP_HOST:'smtp.gmail.com',SMTP_USER:'sender@gmail.com',SMTP_PASS:'abcd efgh ijkl mnop',SMTP_FROM:'sender@gmail.com',APP_URL:'http://localhost:3000',SMTP_AUTH_TYPE:'password'};
test('Gmail App Password yang disalin dengan spasi dinormalisasi',()=>{const c=smtpConfig(env);assert.equal(c.transport.auth?.pass,'abcdefghijklmnop');assert.equal(c.transport.requireTLS,true)});
test('password Gmail selain App Password ditolak tanpa membocorkan nilainya',()=>{const pass='invalid123456';assert.throws(()=>smtpConfig({...env,SMTP_PASS:pass}),error=>{assert.ok(error instanceof Error);assert.match(error.message,/App Password/);assert.ok(!error.message.includes(pass));return true})});
test('diagnostik Gmail 535 menjelaskan langkah perbaikan',()=>{assert.match(smtpErrorHint({code:'EAUTH',responseCode:535},'smtp.gmail.com'),/App Password baru/);assert.ok(!smtpErrorHint({code:'EAUTH',message:'sensitive'},'smtp.gmail.com').includes('sensitive'))});
