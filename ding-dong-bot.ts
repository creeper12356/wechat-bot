#!/usr/bin/env -S node --no-warnings --loader ts-node/esm
/**
 * Wechaty - Conversational RPA SDK for Chatbot Makers.
 *  - https://github.com/wechaty/wechaty
 */
// https://stackoverflow.com/a/42817956/1123955
// https://github.com/motdotla/dotenv/issues/89#issuecomment-587753552
import 'dotenv/config.js'
import fs from 'fs'
import { execSync } from 'child_process'

import {
  Contact,
  Message,
  ScanStatus,
  WechatyBuilder,
  log,
}                  from 'wechaty'

import qrcodeTerminal from 'qrcode-terminal'
// 配置项
const ROOM_NAME = '早八凑不齐一个人小组'
const BOT_NAME = 'SmallCre'
const CURRENT_WORKING_DIR = '../ISE-AI-assistant-Backend/'

function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')
    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

    qrcodeTerminal.generate(qrcode, { small: true })  // show qrcode on console

  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
  }
}

function onLogin (user: Contact) {
  log.info('StarterBot', '%s login', user)
}

function onLogout (user: Contact) {
  log.info('StarterBot', '%s logout', user)
}
function execSyncHelper(command: string) {
  let reply: string
  try {
    if(command.startsWith('rm')) {
      // 防止误删
      throw 'You cannot remove the system'
    }
    reply = execSync(command, {cwd: CURRENT_WORKING_DIR}).toString()
  } catch(e) {
    reply = e.toString()
  }
  return reply
}
async function onMessage (msg: Message) {
  log.info('StarterBot', msg.toString())
  let reply:string
  if(await msg.mentionSelf() && !msg.self()) {
    // 执行shell脚本
    reply = execSyncHelper(msg.text())
    msg.say(reply == '' ? '<消息为空>': reply)
  }
}


async function handleRepoUpdate(signal: string) {
  log.info('Remote repository branch master detected')
  const room = await bot.Room.find({topic: ROOM_NAME})
  await room?.say('后端master分支已经更新😀')
}



// main routine
fs.mkdirSync('.bot',{recursive: true})
fs.writeFileSync('.bot/pid.log',process.pid.toString())

const bot = WechatyBuilder.build({
  name: 'ding-dong-bot',
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    uos: true,
  },
})

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))

log.info(process.pid.toString())




process.on('SIGUSR1', handleRepoUpdate) 
