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
const AT_ME_BASE = `@${BOT_NAME}`
const AT_ME = AT_ME_BASE + String.fromCodePoint(8197)
const CURRENT_WORKING_DIR = '.'
const SHELL = '/bin/bash'
const WECHAT_MAX_CHAR_COUNT = 1200

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
      throw '禁止删除系统!'
    }
    reply = execSync(command, { cwd: CURRENT_WORKING_DIR, shell: SHELL }).toString()
  } catch(e) {
    reply = e.toString()
  }
  return reply
}
async function onMessage (msg: Message) {
  log.info('StarterBot', msg.toString())
  let msgText = msg.text()
  let reply: string
  // console.log("msgsize = " + msgText.length + "; msg = " + msgText)

  // console.log('ascii: ')
  // for(let i = 0;i < msgText.length ;++i) {
  //     console.log(i + '\t' + msgText.charCodeAt(i) + '\n')
  // }
  if(await msg.mentionSelf() && !msg.self()) {
    // 执行shell脚本
    let command = msgText.replace(AT_ME, '').replace(AT_ME_BASE, '')
    reply = execSyncHelper(command)
    console.log('reply.length: ' + reply.length)
    if(reply.length === 0) {
      reply = '输出为空'
    } else if(reply.length > 1200) {
      console.log('超过')
      reply = `输出超过了${WECHAT_MAX_CHAR_COUNT}字符`
      console.log(reply)
    }
    msg.say(reply)
  }
}


async function handleRepoUpdate(signal: string) {
  log.info('Remote repository branch master detected')
  const room = await bot.Room.find({topic: ROOM_NAME})
  await room?.say('后端master分支已经更新😀')
}

// main routine
// 将进程pid写入文件.bot/pid.log
fs.mkdirSync('.bot',{recursive: true})
fs.writeFileSync('.bot/pid.log',process.pid.toString())
log.info(process.pid.toString())

// 创建机器人
const bot = WechatyBuilder.build({
  name: 'ding-dong-bot',
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    uos: true,
  },
})

// 绑定回调函数
bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)

// 注册信号处理器
process.on('SIGUSR1', handleRepoUpdate) 

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))