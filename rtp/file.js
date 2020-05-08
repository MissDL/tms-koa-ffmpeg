const { BaseCtrl } = require('tms-koa/lib/controller/fs/base')
const { LocalFS } = require('tms-koa/lib/model/fs/local')
const { ResultData, ResultFault } = require('tms-koa')
const FfmpegStatck = require('../utils/stack')
const { CtrlBase, attachBaseEvent } = require('./base')

const log4js = require('@log4js-node/log4js-api')
const logger = log4js.getLogger('tms-koa-ffmpeg-file')

class RTPFile extends BaseCtrl {
  constructor(...args) {
    super(...args)
  }
  /**
   * 播放指定的文件
   */
  play() {
    const { path, address, aport, vport } = this.request.query

    if (!parseInt(aport) && !parseInt(vport))
      return new ResultFault('没有指定有效的RTP接收端口')

    const localFS = new LocalFS(this.domain, this.bucket)

    if (!localFS.existsSync(path)) return new ResultFault('指定的文件不存在')

    const fullpath = localFS.fullpath(path)

    const cmd = FfmpegStatck.createCommand()
    cmd.input(fullpath).inputOptions('-re')

    if (parseInt(aport))
      cmd
        .output(`rtp://${address}:${aport}`)
        .noVideo()
        .audioCodec('libopus')
        .format('rtp')

    if (parseInt(vport))
      cmd
        .output(`rtp://${address}:${vport}`)
        .noAudio()
        .videoCodec('libvpx')
        .format('rtp')

    attachBaseEvent(this, cmd, logger)

    cmd.run()

    return new ResultData({ cid: cmd.uuid })
  }
}

Object.assign(RTPFile.prototype, CtrlBase)

module.exports = RTPFile
