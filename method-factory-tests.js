/* global describe it */
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Random } from 'meteor/random'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { expect } from 'chai'
import SimpleSchema from 'simpl-schema'
const schemaFactory = def => new SimpleSchema(def)
const methodExists = name => expect(Meteor.server.method_handlers[name]).to.be.a('function')

function testMixin (options) {
  check(options.foo, String)
  return options
}

const withMixins = createMethodFactory({ mixins: [testMixin] })

class CustomMethod extends ValidatedMethod {
  constructor (...args) {
    super(...args)
    this.foo = 'bar'
  }
}

describe('defaults, no params', function () {
  it('creates a validated method by default', function () {
    const createMethod = createMethodFactory()
    const someMethod = createMethod({
      name: 'someMethod',
      validate: () => {},
      run: () => 'hi',
      applyOptions: { noRetry: true }
    })
    methodExists('someMethod')
    expect(someMethod.call()).to.equal('hi')
  })
})

describe('custom class', function () {
  it('throws if the custom class is not extending ValidatedMethod', function () {
    expect(() => createMethodFactory({ custom: Date })).to.throw()
  })
  it('creates an extended ValidatedMethod', function () {
    const createMethod = createMethodFactory({ custom: CustomMethod })
    const method = createMethod({ name: 'fooTest', validate: () => {}, run: () => {} })
    expect(method.foo).equal('bar')
  })
})

describe('with schema', function () {
  it('throws if the given schemaFactory is not a function', function () {
    const expectThrow = value => expect(() => createMethodFactory({ schemaFactory: value })).to.throw()
    expectThrow([])
    expectThrow({})
    expectThrow(new SimpleSchema({ title: String }))
    expectThrow(1)
    expectThrow('foo')
  })
  it('allows to define schema as validation base', function () {
    const createMethod = createMethodFactory({ schemaFactory })
    const methodArgs = { name: Random.id(), schema: { title: String }, run: ({ title }) => `Hello, ${title}` }
    const method = createMethod(methodArgs)

    // expected fails
    expect(() => method.call()).to.throw()
    expect(() => method.call({})).to.throw()
    expect(() => method.call({ foo: 'bar' })).to.throw()

    // expected pass
    expect(method.call({ title: 'Mr.x' })).to.equal('Hello, Mr.x')
  })
  it('allows to override schema validation with a custom validate function', function () {
    const createMethod = createMethodFactory({ schemaFactory })
    const methodArgs = { name: Random.id(), validate: () => {}, schema: { title: String }, run: ({ title }) => `Hello, ${title}` }
    const method = createMethod(methodArgs)

    expect(method.call({})).to.equal('Hello, undefined')
  })
})

describe('with mixins', function () {
  const validate = () => {}
  const run = () => {}

  it('throws if mixins are not an array of functions', function () {
    const expectThrow = mixins => expect(() => createMethodFactory({ mixins })).to.throw()

    expectThrow(1)
    expectThrow('foo')
    expectThrow({})
    expectThrow(false)
    expectThrow([1])
    expectThrow(['foo'])
    expectThrow([{}])
    expectThrow([false])
  })
  it('allows to define mixins on the abstract factory level', function () {
    // expect error
    expect(() => withMixins({ name: Random.id(), validate, run })).to.throw()

    // expect pass
    withMixins({ name: Random.id(), validate, run, foo: 'bar' }).call()
  })
  it('allows to define mixins on the factory level', function () {
    const createMethod = createMethodFactory()
    const mixins = [testMixin]
    // expect error
    expect(() => createMethod({ name: Random.id(), validate, run, mixins })).to.throw()

    // expect pass
    createMethod({ name: Random.id(), validate, run, foo: 'bar', mixins }).call()
  })
  it('allows to define mixins on both levels together', function () {
    const mixins = [function (options) {
      check(options.bar, String)
      return options
    }]

    // expect error
    expect(() => withMixins({ name: Random.id(), validate, run, mixins, foo: 'bar' })).to.throw()

    // expect pass
    withMixins({ name: Random.id(), validate, run, foo: 'bar', bar: 'baz', mixins }).call()
  })
})
