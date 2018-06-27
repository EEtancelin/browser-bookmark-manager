'use strict'

import childProc from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import BrowserPlugin from './browser-plugin'

class ChromePlugin extends BrowserPlugin {

  /**
   * Determines the location of the file containing the bookmarks
   * @param  {string} profile name of profiel
   * @return {string}         path to Bookmarks file
   */
  static getBookmarkLocation (profile) {
    // Determine Chrome config location
    if (os.type() === 'Darwin') {
      return `${os.homedir()}/Library/Application Support/Google/Chrome/${profile}/Bookmarks`
    } else if (os.type() === 'Windows_NT') {
      return path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', profile, 'Bookmarks')
    } else if (os.type() === 'Linux') {
      return path.join(os.homedir(), '.config', 'google-chrome', profile, 'Bookmarks')
    }
  }

  getBookmarks (profile) {
    // Yes we can use synchronous code here because the file needs to be loaded before something will happen anyways
    let data
    try {
      data = fs.readFileSync(ChromePlugin.getBookmarkLocation(profile), 'utf8')
    } catch (err) {
      throw new Error(`There is no profile '${profile}'`)
    }
    const obj = JSON.parse(data)

    let it
    let res
    let bookmarkItems = []

    // Traverse all roots keys
    for (let key in obj.roots) {
      it = traverseTree(obj.roots[key], [obj.roots[key].name])

      res = it.next()
      while (!res.done) {
        if (res.value.type === 'url') {
          bookmarkItems.push({
            name: res.value.name,
            value: res.value.url
          })
        }
        res = it.next()
      }
    }
    return bookmarkItems
  }

  open (url) {
    if (os.type() === 'Darwin') {
      childProc.exec(`open -a "Google Chrome" "${url}"`)
    } else if (os.type() === 'Windows_NT') {
      childProc.exec(`start chrome "${url}"`)
    } else if (os.type() === 'Linux') {
      childProc.exec(`chrome "${url}"`)
    }
  }
}

function equalOrUndefined (arr1, arr2, idx) {
  return ( !arr1[idx] || !arr2[idx] || arr1[idx] == arr2[idx])
}
const isPathAllowed  = path => {
  const allowedPath = ["Barre de favoris", "Mailoop"]
  return (equalOrUndefined(path, allowedPath, 0) && equalOrUndefined(path, allowedPath, 1)  )
}

function * traverseTree (data, path) {
  const allowedPath = ["Barre de favoris", "Mailoop"]
  if (!data) {
    return
  }
  if (!isPathAllowed(path)) {
    return
  }
  if (data.children) {
    yield * traverseTree(data.children, path)
  }

  for (var i = 0; i < data.length; i++) {
    var val = data[i]
    yield val

    if (val.children) {
      yield * traverseTree(val.children, [...path, val.name])
    }
  }
}

export default ChromePlugin
