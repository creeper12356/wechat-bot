import 'dotenv/config.js'
import fs from 'fs'
import { log } from 'wechaty'
import Bot from './Bot.ts'


// 将进程pid写入文件.bot/pid.log
fs.mkdirSync('.bot',{recursive: true})
fs.writeFileSync('.bot/pid.log',process.pid.toString())
log.info(process.pid.toString())

// 创建机器人
const bot = new Bot('SmallCre')
bot.start()