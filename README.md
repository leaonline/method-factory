# Meteor ValidatedMethod Factory

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub file size in bytes](https://img.shields.io/github/size/leaonline/method-factory/method-factory.js)
![GitHub](https://img.shields.io/github/license/leaonline/method-factory)

Create validated Meteor methods. Lightweight. Simple.

With this package you can define factory functions to create a variety of Meteor methods.
Decouples definition from instantiation (also for the schema) and allows different configurations for different
types of methods.

**Minified size < 2KB!**

## Why do I want this?

* Decouple definition from instantiation
* Just pass in the schema as plain object, instead of manually instantiating `SimpleSchema`
* Create fixed mixins on the abstract factory level, on the factory level, or both (see mixins section)

## Installation

Simply add this package to your meteor packages

```bash
$ meteor add leaonline:method-factory
```

## Usage

Import the `createMethodFactory` method and create the factory function from it:

```javascript
import { createMethodFactory } from 'meteor/leaonline:method-factory'

const createMethod = createMethodFactory() // no params = use defaults
const fancyMethod = createMethod({ name: 'fancy', validate: () => {}, run: () => 'fancy' }) // minimal required
fancyMethod.call() // 'fancy'
```

### With schema

We support various ways to validate an input schema. To **decouple** schema definition from instantiation, we introduced a `shemaFactory`, which
is basically a function that creates your schema for this collection. This also ensures, that
methods don't share the same schema instances:

```javascript
import { createMethodFactory } from 'meteor/leaonline:method-factory'
import SimpleSchema from 'simpl-schema'

const schemaFactory = definitions => new SimpleSchema(definitions)

const createMethod = createMethodFactory({ schemaFactory })
const fancyMethod = createMethod({
  name: 'fancy',
  schema: { title: String },
  run: function({ title }) {
    return `Hello, ${title}`
  }
})
fancyMethod.call({ title: 'Mr.x' }) // Hello, Mr.x
```

As you can see, there is **no need to pass a `validate` function** as it is internally built using the `schemaFactory`
and the given `schema`.

##### Overriding `validate` when using schema

You can also override the internal `validate` when using `schema` by passing a `validate` function.
This, however, disables the schema validation and is then your responsibility:


```javascript
import { createMethodFactory } from 'meteor/leaonline:method-factory'
import SimpleSchema from 'simpl-schema'

const schemaFactory = definitions => new SimpleSchema(definitions)

const createMethod = createMethodFactory({ schemaFactory })
const customValidationMethod = createMethod({
  name: 'customValidation',
  schema: { title: String },
  validate(document) {
    if (!['Mrs.y', 'Mr.x'].includes(document.title)) {
     throw new Error()
    }
  },
  run: function({ title }) {
    return `Hello, ${title}`
  }
})
customValidationMethod.call({ title: 'Dr.z' }) // err
```

If none of these cover your use case, you can still use mixins.


### With custom `ValidatedMethod`

You can extend the `ValidatedMethod` and pass it to the factory as well.
Note, that you need to inherit from `ValidatedMethod`. Fully custom classes are not
supported.

```javascript
import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { myDefaultMixin } from '/path/to/myDefaultMixin'

class CustomMethod extends ValidatedMethod {
  constructor (options) {
    if (options.mixins && options.mixins.length > 0) {
      options.mixins = options.mixins.concat([myDefaultMixin])
    }  else {
      options.mixins = [myDefaultMixin]
    }
    super(options)
  }
}

const createMethod = createMethodFactory({ custom: CustomMethod })
const customMethod = createMethod({ ... })
```


### With mixins

There are three ways to define [mixins](https://github.com/meteor/validated-method#mixins):

- on the abstract factory function level, all methods created by the factory will contain these mixins
- on the factory level, you basically pass mixins the a single method
- on both levels, where mixins from the abstract factory function are executed first; no overrides

#### Abstract factory level mixins

If you want a certain mixin to be included for all methods created by the factory just pass them to the
`createMethodFactory` function:

```javascript
import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { myDefaultMixin } from '/path/to/myDefaultMixin'

const createMethod = createMethodFactory({ mixins: [myDefaultMixin] })
const someMethod = createMethod({ 
  name: 'methodWithMixin', 
  validate: () => {}, 
  run: () => 'result', 
  foo: 'bar' // assuming your mixin requires foo 
})
```

#### Factory level mixins

You can also define mixins for each method. This is the same as passing mixins to the `ValidatedMethod`:

```javascript
import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { myDefaultMixin } from '/path/to/myDefaultMixin'

const createMethod = createMethodFactory() // use defaults

const methodWithMixin = createMethod({ 
  name: 'methodWithMixin',
  mixins: [myDefaultMixin],
  validate: () => {}, 
  run: () => 'result', 
  foo: 'bar' // assuming your mixin requires foo 
})

const methodWithoutMixin = createMethod({
  name: 'methodWithoutMixin',
  validate: () => {}, 
  run: () => 'result', 
})
```

##### Use mixins on both levels

Of course you can define mixins on both levels, so that you have a certain set of default mixins and method-specific 
mixins:

```javascript
import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { myDefaultMixin } from '/path/to/myDefaultMixin'
import { someOtherMixin } from '/path/to/someOtherMixin'

const createMethod = createMethodFactory({ mixins: [myDefaultMixin] })

const methodWithMixin = createMethod({ 
  name: 'methodWithMixin', 
  validate: () => {}, 
  run: () => 'result', 
  foo: 'bar' // assuming your mixin requires foo 
})

const methodWithMixins = createMethod({
  name: 'methodWithMixin', 
  mixins: [someOtherMixin],
  validate: () => {}, 
  run: () => 'result', 
  foo: 'bar', // assuming your mixin requires foo
  bar: 'baz', // assuming the other mixin requires bar 
})
```

## Codestyle

We use `standard` as code style and for linting.

##### via npm

```bash
$ npm install --global standard snazzy
$ standard | snazzy
```

##### via Meteor npm

```bash
$ meteor npm install --global standard snazzy
$ standard | snazzy
```


## Test

We use `meteortesting:mocha` to run our tests on the package.

##### Watch mode

```bash
$ TEST_WATCH=1 TEST_CLIENT=0 meteor test-packages ./ --driver-package meteortesting:mocha
```

##### Cli mode

## License

MIT, see [LICENSE](./LICENSE)
