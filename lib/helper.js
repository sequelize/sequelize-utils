var _  = require('lodash')
  , sh = require('execSync')

var Helper = module.exports = {
  logAndExec: function (msg, cmd, options) {
    options = _.extend({
      dir:         null,
      quitOnError: true
    }, options || {})

    if (options.dir) {
      cmd = 'cd ' + __dirname + '/../' + options.dir + ' && ' + cmd
    }

    process.stdout.write(msg + " ... ")

    var result = sh.exec(cmd)

    if (result.code === 0) {
      console.log("OK")
    } else {
      console.log("Failed!")

      if (options.quitOnError) {
        console.log()
        console.log("Executed command:", cmd)
        console.log("Output:", result.stdout)
        process.exit(result.code)
      } else {
        return result
      }
    }
  }

}
