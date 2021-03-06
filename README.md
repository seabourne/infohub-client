# infohub-client

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

## InformationHub

Information Hub Access.
Simple shim for the Information Hub Data API. Provides CRUD
operations.

For now, only implements operations on entities -- Create, Update,
Read, Read Multiple, Delete and Delete Multiple. To be extended as we
get a better idea of actual requirements.

The selection, attribute and cursor parameters passed to operations
have the same format as defined by the Information Hub Data API.

The response object returned by operations has the same properties as
defined by the Information Hub Data API. In addition, it is annotated
with these methods:

-   `response.anyProblems()` - returns true if errors are present
-   `response.errors.toError()` - returns an `Error` object for the
      response errors (undefined if there are no errors)
-   `response.errors.throw()` - throws an error if there are response
      errors; does nothing otherwise

The Information Hub Access module accepts these
configuration properties:

-   `baseURL` - The base URL for the Information Hub Data API;
      default is `http://localhost/dataapi/`, note the trailing
      slash (/).

For use in Nxus projects, wrap this client as the proxy for a NxusModule to
pass in configuration from nxus config:

  import {NxusModule} from 'nxus-core'

  import {default as Client} from 'infohub-client'

  class InformationHub extends NxusModule {

    constructor(options) {
      super()
      this.client = new Client({baseURL: this.config.baseURL})
      this.__proxy.use(this.client)
    }

  }
  var informationHub = InformationHub.getProxy()

  export {InformationHub as default, informationHub}

**Parameters**

-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** configuration options;
        for now, the only option is `baseURL`, which sets the base URL
        for the information hub service

### getEntity

Gets an entity specified by id.

**Parameters**

-   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** entity id
-   `attrs` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** (optional) attribute parameters

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise that resolves to a `response` object.

### getEntities

Gets entities specified by selection parameters.

**Parameters**

-   `sel` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** selection parameters
-   `attrs` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** (optional) attribute parameters
-   `cursor` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** (optional) cursor parameters

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise that resolves to a `response` object.

### createEntity

Creates an entity.

**Parameters**

-   `obj` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** entity object

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise that resolves to a `response` object.

### updateEntity

Updates an entity specified by id.

**Parameters**

-   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** entity id
-   `obj` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** entity object

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise that resolves to a `response` object.

### deleteEntity

Deletes an entity specified by id.

**Parameters**

-   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** entity id

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise that resolves to a `response` object.

### deleteEntities

Deletes entities specified by selection parameters.

**Parameters**

-   `sel` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** selection parameters

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise that resolves to a `response` object.

### getSchemas

Gets schemas

**Parameters**

-   `sel`  
-   `attrs`  
-   `cursor`  
-   `cache`   (optional, default `true`)

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** Promise that resolves to a `response` object.
