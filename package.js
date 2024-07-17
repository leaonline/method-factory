/* eslint-env meteor */
Package.describe({
  name: 'leaonline:method-factory',
  version: '2.0.0',
  // Brief, one-line summary of the package.
  summary: 'Create validated Meteor methods. Lightweight. Simple.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/leaonline/method-factory.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom(['3.0.1'])
  api.use('ecmascript', 'server')
  api.use('mdg:validated-method@1.3.0', 'server')
  api.mainModule('method-factory.js', 'server')
})

Package.onTest(function (api) {
  api.versionsFrom(['3.0.1'])
  api.use('ecmascript')
  api.use('mongo')
  api.use('random')
  api.use('mdg:validated-method@1.3.0')
  api.use('meteortesting:mocha@3.0.0-rc.1')
  api.use('leaonline:method-factory')
  api.mainModule('method-factory-tests.js')
})
