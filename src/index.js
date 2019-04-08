/* To Do:
    *   convenience methods for CursorMetadata (e.g. next, prev)
    *   what about chained methods .attrs() .cursor()
    *   add geoJson _geo field for index: geo, add .geo() method?
 */

'use strict'

import util from 'util'

import _ from 'underscore'
import request from 'request'
import qs from 'qs'

const BASE_URL = 'http://localhost/dataapi/'

const APPLICATION_CONFIG_ERROR = {
  message: "application configuration error",
  code: 82 }


function capitalize(str) {
  return str && (str.slice(0, 1).toUpperCase() + str.slice(1))
}

function formatMessage(message, info) {
  info = _.map(info, (val, key) => {
    if (val === undefined)
      val = "undefined"
    else if (val === null)
      val = "null"
    else if (_.isObject(val))
      val = util.inspect(val)
    return `${key} ${val}`
  })
  if (info.length) message = `${message} (${info.join(", ")})`
  return message
}

const RESPONSE_METHODS = {
  anyProblems: function () { return !!this.errors && this.errors.anyProblems() }
}
const RESPONSE_ERRORS_METHODS = {
  anyProblems: function () { return (this.length > 0) },
  toError: function () {
    if (this.length === 0) return
    let msg = this
      .map((problem) => { return formatMessage(problem.message, problem.info) })
      .join("; ")
    msg = capitalize(msg) + "."
    let e = new Error(msg)
    e.problems = this
    return e
  },
  throw: function () {
    if (this.anyProblems()) throw this.toError()
  }
}


function assembleQuery(...args) {
  let options = Object.assign({}, ...args),
      query = qs.stringify(options, {encodeValuesOnly: true})
  if (query) query = '?' + query
  return query
}

function errorResponse(err) {
  let response = { entities: [], errors: [] },
      params = { fault: err.toString() }
  response.errors.push(Object.assign({params}, APPLICATION_CONFIG_ERROR))
  return response
}

function packageResponse(err, body) {
  if (_.isString(body)) {
    err = body
  }
  let response = err ? errorResponse(err) : body
  if (!response.entities) response.entities = [] // hack around Data API bug
  Object.assign(response, RESPONSE_METHODS)
  if (response.errors) Object.assign(response.errors, RESPONSE_ERRORS_METHODS)
  return response
}


function createReverseLinks(schemas) {
  let skipSchemas = ["cc:common", "cc:common-resource", "cc:comment"]
  let reversed = {}
  for(let k in schemas) {
    schemas[k].linksReverse = []
    reversed[k] = {}
  }
  for(let source in schemas) {
    if (skipSchemas.includes(source)) {
      continue
    }
    if(schemas[source].links) {
      for(let link of schemas[source].links) {
        let target = link.targetType
        if (!_.isArray(target)) {
          target = [target]
        }
        for (let t of target) {
          if (reversed[t][link.type]) {
            reversed[t][link.type].targetType.push(source)
          } else {
            reversed[t][link.type] = Object.assign({}, link, {targetType: [source]})
          }
        }
      }
    }
  }
  for (let t in reversed) {
    for (let m in reversed[t]) {
      schemas[t].linksReverse.push(reversed[t][m])
    }
  }
  
  return schemas
}


/** Information Hub Access.
 * Simple shim for the Information Hub Data API. Provides CRUD
 * operations.
 *
 * For now, only implements operations on entities -- Create, Update,
 * Read, Read Multiple, Delete and Delete Multiple. To be extended as we
 * get a better idea of actual requirements.
 *
 * The selection, attribute and cursor parameters passed to operations
 * have the same format as defined by the Information Hub Data API.
 *
 * The response object returned by operations has the same properties as
 * defined by the Information Hub Data API. In addition, it is annotated
 * with these methods:
 * *   `response.anyProblems()` - returns true if errors are present
 * *   `response.errors.toError()` - returns an `Error` object for the
 *       response errors (undefined if there are no errors)
 * *   `response.errors.throw()` - throws an error if there are response
 *       errors; does nothing otherwise
 *
 * The Information Hub Access module accepts these 
 * configuration properties:
 * *   `baseURL` - The base URL for the Information Hub Data API;
 *       default is `http://localhost/dataapi/`, note the trailing
 *       slash (/).
 *
 * For use in Nxus projects, wrap this client as the proxy for a NxusModule to
 * pass in configuration from nxus config:
 *
 *   import {NxusModule} from 'nxus-core'
 *
 *   import {default as Client} from 'infohub-client'
 *
 *   class InformationHub extends NxusModule {
 *
 *     constructor(options) {
 *       super()
 *       this.client = new Client({baseURL: this.config.baseURL})
 *       this.__proxy.use(this.client)
 *     }
 *   }
 *   var informationHub = InformationHub.getProxy()
 *
 *   export {InformationHub as default, informationHub}
 *
 */
class InformationHub {

  /** Creates information hub accessor.
   * @param {Object} options - configuration options;
   *     for now, the only option is `baseURL`, which sets the base URL
   *     for the information hub service
   */
  constructor(options) {
    let baseURL = options.baseURL || BASE_URL
    this._request = request.defaults({baseUrl: baseURL})
    this._schemaCache = null
  }

  /** Gets an entity specified by id.
   * @param {string} id - entity id
   * @param {Object} attrs - (optional) attribute parameters
   * @returns {Promise} Promise that resolves to a `response` object.
   */
  getEntity(id, attrs) {
    return new Promise((resolve, reject) => {
      let query = assembleQuery(attrs)
      this._request(
        { url: `/entities/${id}` + query, method: 'GET', json: true },
        (err, res, body) => {
          resolve(packageResponse(err, body))
        }
      )
    })
  }

  /** Gets entities specified by selection parameters.
   * @param {Object} sel - selection parameters
   * @param {Object} attrs - (optional) attribute parameters
   * @param {Object} cursor - (optional) cursor parameters
   * @returns {Promise} Promise that resolves to a `response` object.
   */
  getEntities(sel, attrs, cursor) {
    return new Promise((resolve, reject) => {
      let query = assembleQuery(sel, attrs, cursor)
      this._request(
        { url: '/entities' + query, method: 'GET', json: true },
        (err, res, body) => {
          resolve(packageResponse(err, body))
        }
      )
    })
  }

  /** Creates an entity.
   * @param {Object} obj - entity object
   * @returns {Promise} Promise that resolves to a `response` object.
   */
  createEntity(obj) {
    return new Promise((resolve, reject) => {
      this._request(
        { url: '/entities', method: 'POST', json: true, body: obj },
        (err, res, body) => {
          resolve(packageResponse(err, body))
        }
      )
    })
  }

  /** Updates an entity specified by id.
   * @param {string} id - entity id
   * @param {Object} obj - entity object
   * @returns {Promise} Promise that resolves to a `response` object.
   */
  updateEntity(id, obj) {
    return new Promise((resolve, reject) => {
      this._request(
        { url: `/entities/${id}`, method: 'POST', json: true, body: obj },
        (err, res, body) => {
          resolve(packageResponse(err, body))
        }
      )
    })
  }

  /** Deletes an entity specified by id.
   * @param {string} id - entity id
   * @returns {Promise} Promise that resolves to a `response` object.
   */
  deleteEntity(id) {
    return new Promise((resolve, reject) => {
      this._request(
        { url: `/entities/${id}`, method: 'DELETE', json: true },
        (err, res, body) => {
          resolve(packageResponse(err, body))
        }
      )
    })
  }

  /** Deletes entities specified by selection parameters.
   * @param {Object} sel - selection parameters
   * @returns {Promise} Promise that resolves to a `response` object.
   */
  deleteEntities(sel) {
    return new Promise((resolve, reject) => {
      let query = assembleQuery(sel)
      this._request(
        { url: '/entities' + query, method: 'DELETE', json: true },
        (err, res, body) => {
          resolve(packageResponse(err, body))
        }
      )
    })
  }

  createLink(type, source, target) {
    return new Promise((resolve, reject) => {
      this._request(
        { url: '/links', method: 'POST', json: true, body: {type, source, target} },
        (err, res, body) => {
          resolve(packageResponse(err, body))
        }
      )
    })
  }

  /** Gets schemas
   * @returns {Promise} Promise that resolves to a `response` object.
   */
  getSchemas(sel, attrs, cursor, cache=true) {
    if (cache && this._schemaCache) {
      return Promise.resolve(this._schemaCache)
    }
    return new Promise((resolve, reject) => {
      this._request(
        { url: '/schemas', method: 'GET', json: true },
        (err, res, body) => {
          let response = packageResponse(err, body)
          let schemas = {}
          if (response.schemas) {
            for(let k of response.schemas) {
              schemas[k.type] = k
            }
            createReverseLinks(schemas)
          }
          if (cache) {
            this._schemaCache = schemas
          }
          resolve(schemas)
        }
      )
    })
  }
  

}

export {InformationHub as default}

