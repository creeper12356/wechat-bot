import { Contact, Message, ScanStatus, WechatyBuilder, log } from "wechaty";
import  QRCodeTerminal  from "qrcode-terminal";
import type { WechatyInterface } from "wechaty/impls";
import { execSync } from 'child_process'

export default class Bot {
    bot: WechatyInterface


    readonly ROOM_NAME: string
    readonly BOT_NAME: string
    readonly AT_ME_BASE: string
    readonly AT_ME: string
    readonly CURRENT_WORKING_DIR: string
    readonly SHELL: string
    readonly WECHAT_MAX_CHAR_COUNT: number


    constructor(name: string) {
        this.bot = WechatyBuilder.build({
            name: name,
            puppet: 'wechaty-puppet-wechat',
            puppetOptions: {
              uos: true,
            },
        })

        // 配置常量参数
        this.ROOM_NAME = process.env['ROOM_NAME'] ?? 'default room'
        this.BOT_NAME = name
        this.AT_ME_BASE = `@${this.BOT_NAME}`
        this.AT_ME = this.AT_ME_BASE + String.fromCodePoint(8197)
        this.CURRENT_WORKING_DIR = process.env['CWD'] ?? '.'
        this.SHELL = '/bin/bash'
        this.WECHAT_MAX_CHAR_COUNT = 1200


        // 绑定回调函数
        this.bot.on('scan',    this.onScan.bind(this))
        this.bot.on('login',   this.onLogin.bind(this))
        this.bot.on('logout',  this.onLogout.bind(this))
        this.bot.on('message', this.onMessage.bind(this))

        // 注册信号处理器
        process.on('SIGUSR1', this.handleRepoUpdate.bind(this)) 


    }
    public execSyncHelper(command: string) :string{
        let reply: string
        try {
          if(command.startsWith('rm')) {
            // 防止误删
            throw '禁止删除系统!'
          }
          reply = execSync(command, { cwd: this.CURRENT_WORKING_DIR, shell: this.SHELL }).toString()
        } catch(e: any) {
          reply = e.toString()
        }
        return reply
    }
    public start() {
        this.bot.start()
        .then(() => log.info('StarterBot', 'Starter Bot Started.'))
        .catch(e => log.error('StarterBot', e))
    }
    public onScan (qrcode: string, status: ScanStatus) {
        if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
          const qrcodeImageUrl = [
            'https://wechaty.js.org/qrcode/',
            encodeURIComponent(qrcode),
          ].join('')
          log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)
      
          QRCodeTerminal.generate(qrcode, { small: true })  // show qrcode on console
      
        } else {
          log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
        }
    }
    public onLogin (user: Contact) {
        log.info('StarterBot', '%s login', user)
    }

    public onLogout (user: Contact) {
        log.info('StarterBot', '%s logout', user)
    }
    public async onMessage (msg: Message) {
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
          let command = msgText.replace(this.AT_ME, '').replace(this.AT_ME_BASE, '')
          console.log(typeof this.execSyncHelper)
          reply = this.execSyncHelper(command)
          console.log('reply.length: ' + reply.length)
          if(reply.length === 0) {
            reply = '输出为空'
          } else if(reply.length > 1200) {
            console.log('超过')
            reply = `输出超过了${this.WECHAT_MAX_CHAR_COUNT}字符`
            console.log(reply)
          }
          msg.say(reply)
        }
    }

    public async handleRepoUpdate() {
        log.info('Remote repository branch master detected')
        const room = await this.bot.Room.find({topic: this.ROOM_NAME})
        await room?.say('后端master分支已经更新😀')
    }
      

}