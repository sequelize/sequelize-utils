var sh      = require('execSync')
  , semver  = require('semver')
  , _       = require('lodash')
  , fs      = require('fs')
  , helper  = require('./helper')
  , cvs     = require('./cvs')

var App = module.exports = function(program) {
  this.program = program
}

App.prototype.downloadRepositories = function() {
  helper.logAndExec("Creating the 'repositories' directory", 'mkdir -p ' + __dirname + '/../repositories')

  var remoteRepositories    = ['sequelize', 'sequelize-sqlite', 'sequelize-postgres', 'sequelize-mysql']
    , availableRepositories = sh.exec('cd ' + __dirname + '/../repositories && ls -1').stdout.split("\n")
    , necessaryRepositories = _.difference(remoteRepositories, _.compact(availableRepositories))

  necessaryRepositories.forEach(function(name) {
    helper.logAndExec("Cloning into '" + name + "'", 'git clone git@github.com:sequelize/' + name + '.git', {
      dir: 'repositories'
    })
  })

  remoteRepositories.forEach(function(name) {
    helper.logAndExec("Fetching the latest changes of '" + name +"' on 'master'", "git checkout master && git checkout . && git pull origin master", {
      dir: 'repositories/' + name
    })

    helper.logAndExec("Installing packages of '" + name +"' on 'master'", "npm install", {
      dir: 'repositories/' + name
    })
  })
}

App.prototype.runTests = function() {
  var branch = this.program.test

  helper.logAndExec(
    "Running tests of 'sequelize' on '" + branch + "'",
    "git checkout " + branch + " && make all",
    { dir: "repositories/sequelize" }
  )
}

App.prototype.release = function() {
  var version = this.program.release

  if (!semver.valid(version)) {
    console.log("Invalid version '" + version + "'")
    process.exit(1)
  }

  var code = sh.run(__dirname + '/../bin/sequelize-utils -d')

  if (code === 0) {
    var m2Version = cvs.getSequelizeVersion('milestones/2.0.0')

    cvs.releaseVersion(version, 'master')

    sh.exec("cd " + __dirname + "/../repositories/sequelize && git checkout 'milestones/2.0.0' && git merge master")
    sh.exec("cd " + __dirname + "/../repositories/sequelize && git merge master")
    sh.exec("cd " + __dirname + "/../repositories/sequelize && git checkout --ours package.json && git commit -am 'merge'")

    if (m2Version === '2.0.0-alpha3') {
      m2Version = '2.0.0-beta.0'
    } else {
      m2Version = semver.inc(m2Version, 'prerelease')
    }

    cvs.releaseVersion(m2Version, 'milestones/2.0.0')
  } else {
    process.exit(code)
  }
}

App.prototype.updateBundle = function(dialect, branch) {
  sh.exec("cd " + __dirname + "/../repositories/sequelize-" + dialect + " && git checkout " + branch + " && git pull origin " + branch)

  var packageJson = cvs.getSequelizePackageJson(dialect)
    , version     = cvs.getSequelizeVersion(branch)

  console.log("Releasing the branch '" + branch + "' as v" + version + " for the dialect bundle " + dialect + ".")

  process.stdout.write('  - Updating the package.json with the new version ... ')

  packageJson.version = packageJson.dependencies.sequelize = version
  fs.writeFileSync(
    __dirname + '/../repositories/sequelize-' + dialect + '/package.json',
    JSON.stringify(packageJson, null, 2)
  )

  console.log('OK')

  helper.logAndExec('  - Committing the new version',  "git commit -am 'v" + version + "'", { dir: "repositories/sequelize-" + dialect })
  helper.logAndExec('  - Tagging the new version', "git tag v" + version, { dir: "repositories/sequelize-" + dialect })
  helper.logAndExec('  - Pushing the changes to Github', "echo 1", { dir: "repositories/sequelize-" + dialect })
  helper.logAndExec('  - Publishing the new version to NPM', "echo 2", { dir: "repositories/sequelize-" + dialect })
  // logAndExec('  - Pushing the changes to Github', "git push && git push --tags", { dir: "repositories/sequelize-" + dialect })
  // logAndExec('  - Publishing the new version to NPM', "npm publish .", { dir: "repositories/sequelize-" + dialect })
}
