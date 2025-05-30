import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { ValidatedMethod } from 'meteor/mdg:validated-method'

const isMaybeValidatedMethod = Match.Where(v => !v || v instanceof ValidatedMethod || (v.prototype && v.prototype instanceof ValidatedMethod))
const isMaybeApplyOptions = Match.Maybe({
  wait: Match.Maybe(Boolean),
  onResultReceived: Match.Maybe(Function),
  noRetry: Match.Maybe(Boolean),
  throwStubExceptions: Match.Maybe(Boolean),
  returnStubValue: Match.Maybe(Boolean)
})

/**
 * Creates a new method factory for a fixed set of mixins and a schema factory
 * @param custom
 * @param mixins
 * @param schemaFactory
 * @return {function} a function to create a new ValidatedMethod
 */

export const createMethodFactory = ({ custom, mixins, schemaFactory } = {}) => {
  check(custom, isMaybeValidatedMethod)
  check(schemaFactory, Match.Maybe(Function))
  check(mixins, Match.Maybe([Function]))

  const ProductConstructor = custom || ValidatedMethod
  const isRequiredSchema = schemaFactory ? Match.OneOf(Object, null) : Match.Maybe(Object)
  const isRequiredValidate = schemaFactory ? Match.Maybe(Function) : Function
  const abstractFactoryLevelMixins = (mixins && mixins.length > 0) ? mixins : []

  /**
   *
   * @param name required, see https://github.com/meteor/validated-method
   * @param schema a schema definition (not an instance!) for input validation
   * @param validate overrides validation with a custom function, required if no schemaFactory is defined
   * @param run see https://github.com/meteor/validated-method
   * @param args your object can have any more arguments, that are internally defined as {args}
   * @return {ValidatedMethod}
   */

  return options => {
    check(options, Match.ObjectIncluding({
      name: String,
      schema: options.validate ? Match.Maybe(isRequiredSchema) : isRequiredSchema,
      schemaOptions: Match.Maybe(isRequiredSchema),
      validate: options.schema ? Match.Maybe(isRequiredValidate) : isRequiredValidate,
      run: Function,
      applyOptions: isMaybeApplyOptions,
      mixins: Match.Maybe([Function])
    }))

    const { name, schema, validate, run, mixins, applyOptions, ...args } = options

    let validateFn
    const hasValidate = typeof validate === 'function'

    if (hasValidate) {
      // We wrap the validate function to allow for a return value of Boolean type,
      // which SimpleSchema does not support.
      validateFn = function (...args) {
        const isValid = validate.apply(this, args)
        if (isValid === true) return
        if (isValid === false) {
          throw new Meteor.Error('422', 'validationFailed', {
            userId: this.userId,
            method: name
          })
        }
      }
    }

    if (!hasValidate && schemaFactory) {
      // for short-hand definition of pass-all schema
      // we allow schema to be null, which then
      // prevents any check in validate
      const validationSchema = schema === null
        ? null
        : schemaFactory(schema, options.schemaOptions)

      // We fall back to a plain object to support Meteor.call(name, callback)
      // for schemas that contain no property: { schema: {} }
      validateFn = function validate (document = {}) {
        if (validationSchema !== null) {
          validationSchema.validate(document, options.schemaOptions)
        }
      }
    }

    const methodArgs = Object.assign({ name, validate: validateFn, run }, args)
    if (applyOptions) methodArgs.applyOptions = applyOptions
    const localMixins = (mixins && mixins.length > 0) ? mixins : []
    const allMixins = [].concat(abstractFactoryLevelMixins, localMixins)
    if (allMixins.length > 0) methodArgs.mixins = allMixins

    const product = new ProductConstructor(methodArgs)
    check(product.name, name)
    check(product.validate, Function)
    check(product.run, Function)
    return product
  }
}
