const url = require('url')
module.exports = {
  requestIntercept (context, interceptOpt, req, res, ssl, next) {
    const { rOptions, log, RequestConter } = context

    let proxyConf = interceptOpt.proxy
    if (RequestConter && interceptOpt.backup && interceptOpt.backup.length > 0) {
      // 优选逻辑
      const backup = [proxyConf]
      for (const bk of interceptOpt.backup) {
        backup.push(bk)
      }
      const key = interceptOpt.key
      const count = RequestConter.getOrCreate(key, backup)
      if (count.value == null) {
        count.doRank()
      }
      if (count.value == null) {
        log.error('count value is null', count)
      } else {
        proxyConf = count.value
        context.requestCount = {
          key,
          value: count.value,
          count
        }
      }
    }

    let proxyTarget = proxyConf + req.url
    if (interceptOpt.replace) {
      const regexp = new RegExp(interceptOpt.replace)
      proxyTarget = req.url.replace(regexp, proxyConf)
    }
    log.info('proxy', rOptions.path, rOptions.url)
    // const backup = interceptOpt.backup
    const proxy = proxyTarget.indexOf('http') === 0 ? proxyTarget : rOptions.protocol + '//' + proxyTarget
    // eslint-disable-next-line node/no-deprecated-api
    const URL = url.parse(proxy)
    rOptions.protocol = URL.protocol
    rOptions.hostname = URL.host
    rOptions.host = URL.host
    rOptions.headers.host = URL.host
    rOptions.path = URL.path
    if (URL.port == null) {
      rOptions.port = rOptions.protocol === 'https:' ? 443 : 80
    }
    log.info('proxy:', rOptions.hostname, req.url, proxyTarget)
    return true
  },
  is (interceptOpt) {
    return !!interceptOpt.proxy
  }
}
