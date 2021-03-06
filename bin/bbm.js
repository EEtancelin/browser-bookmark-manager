#!/usr/bin/env node

import program from 'commander'
import inquirer from 'inquirer'
import * as plugins from '../browser-plugins/index'
import {version} from '../package.json'
import chalk from 'chalk'

program
  .version(version)
  .usage('[options] <searchterm ..>')
  .option('-b, --browser [browsername]', 'specified type of browser [chrome]', 'chrome')
  .option('-p, --profile [profilename]', 'name of browsers user profile', 'Default')
  .parse(process.argv)

program.browser = program.browser.toLowerCase()
const browserClass = plugins.browserNames[program.browser]

// Exit if an invalid browser was chosen
if (browserClass === undefined) {
  errorExit(`'${program.browser}' is not a valid browser name. Valid browsernames are "firefox", "chrome"`)
}

const currentPlugin = new plugins[browserClass]()
const searchTerms = program.args

// Perform the search for the actual bookmarks
let results
try {
  results = currentPlugin.search(searchTerms[0], program.profile)
} catch (err) {
  errorExit(err.toString())
}

inquirer.prompt([
  {
    type: 'list',
    name: 'url',
    message: `Which bookmark do you want to open?`,
    choices: results
  }
]).then(function (answer) {
  currentPlugin.open(answer.url)
  console.log(`Opening ${answer.url}`)
})

function errorExit (message) {
  const error = chalk.bold.red
  console.log(error(message))
  process.exit(0)
}
