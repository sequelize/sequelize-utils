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

  releaseVersion: function(version, branch) {
    if (!semver.gt(version, this.getSequelizeVersion())) {
      console.log('To be released version is not greater than the current version (' + version + ' <-> ' + getSequelizeVersion() +').')
      process.exit(2)
    }

    if (/*(code = sh.run(__dirname + '/../bin/sequelize-utils -t ' + branch))*/ 0 === 0) {
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
      helper.logAndExec('  - Pushing the changes to Github', "echo 1", { dir: "repositories/sequelize" })
      helper.logAndExec('  - Publishing the new version to NPM', "echo 2", { dir: "repositories/sequelize" })
      // logAndExec('  - Pushing the changes to Github', "git push && git push --tags", { dir: "repositories/sequelize" })
      // logAndExec('  - Publishing the new version to NPM', "npm publish .", { dir: "repositories/sequelize" })
    } else {
      process.exit(code)
    }
  }
}
