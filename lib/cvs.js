var sh      = require('execSync')
  , semver  = require('semver')
  , _       = require('lodash')
  , fs      = require('fs')
  , helper  = require('./helper')

var CVS = module.exports = {
  getSequelizePackageJson: function(dialect) {
    if (dialect) {
      return JSON.parse(fs.readFileSync(__dirname + '/../repositories/sequelize-' + dialect + '/package.json').toString())
    } else {
      return JSON.parse(fs.readFileSync(__dirname + '/../repositories/sequelize/package.json').toString())
    }
  },

  getSequelizeVersion: function(branch) {
    if (branch) {
      sh.exec("cd " + __dirname + "/../repositories/sequelize && git checkout '" + branch + "'")
      var result = this.getSequelizePackageJson().version
      sh.exec("cd " + __dirname + "/../repositories/sequelize && git checkout master")
      return result
    } else {
      return this.getSequelizePackageJson().version
    }
  },

  releaseVersion: function(version, branch, options) {
    options = _.extend({
      force: false
    }, options || {})

    if (!semver.gt(version, this.getSequelizeVersion())) {
      console.log('To be released version is not greater than the current version (' + version + ' <-> ' + getSequelizeVersion() +').')
      process.exit(2)
    }

    var code = sh.run(__dirname + '/../bin/sequelize-utils -t ' + branch)

    if (code === 0) {
      console.log("Releasing the branch '" + branch + "' as v" + version + ".")
      process.stdout.write('  - Updating the package.json with the new version ... ')

      var packageJson = this.getSequelizePackageJson()
      packageJson.version = version
      fs.writeFileSync(
        __dirname + '/../repositories/sequelize/package.json',
        JSON.stringify(packageJson, null, 2)
      )

      console.log('OK')

      helper.logAndExec('  - Committing the new version',  "git commit -am 'v" + version + "'", { dir: "repositories/sequelize" })
      helper.logAndExec('  - Tagging the new version', "git tag v" + version, { dir: "repositories/sequelize" })

      if (options.force) {
        helper.logAndExec('  - Pushing the changes to Github', "git push && git push --tags", { dir: "repositories/sequelize" })
        helper.logAndExec('  - Publishing the new version to NPM', "npm publish .", { dir: "repositories/sequelize" })
      } else {
        helper.logAndExec('  ~ Pushing the changes to Github (fake)', "echo 1", { dir: "repositories/sequelize" })
        helper.logAndExec('  ~ Publishing the new version to NPM (fake)', "echo 1", { dir: "repositories/sequelize" })
      }
    } else {
      process.exit(code)
    }
  }
}
