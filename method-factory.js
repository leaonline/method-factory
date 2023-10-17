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
  const isRequiredSchema = schemaFactory ? Object : Match.Maybe(Object)
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
      validate: options.schema ? Match.Maybe(isRequiredValidate) : isRequiredValidate,
      run: Function,
      applyOptions: isMaybeApplyOptions,
      mixins: Match.Maybe([Function])
    }))

    const { name, schema, validate, run, mixins, applyOptions, ...args } = options

    let validateFn = validate
    if (!validateFn && schemaFactory) {
      const validationSchema = schemaFactory(schema, options)
      // we fallback to a plain object to support Meteor.call(name, callback)
      // for schemas that contain no property: { schema: {} }
      validateFn = function validate (document = {}) {
        validationSchema.validate(document)
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
