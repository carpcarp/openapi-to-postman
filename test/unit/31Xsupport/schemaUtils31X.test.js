const { expect } = require('chai'),
  {
    parseSpec, getRequiredData, compareTypes, fixExamplesByVersion, isBinaryContentType
  } = require('../../../lib/31XUtils/schemaUtils31X'),
  fs = require('fs'),
  valid31xFolder = './test/data/valid_openapi31X',
  invalid31xFolder = './test/data/invalid_openapi31X';

describe('parseSpec method', function () {
  it('should return true and a parsed specification', function () {
    let fileContent = fs.readFileSync(valid31xFolder + '/webhooks.json', 'utf8');
    const parsedSpec = parseSpec(fileContent);
    expect(parsedSpec.result).to.be.true;
    expect(parsedSpec.openapi.openapi).to.equal('3.1.0');
    expect(parsedSpec.openapi.webhooks).to.not.be.undefined;
  });

  it('should return false and invalid format message when input content is sent', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/empty-spec.yaml', 'utf8');
    const parsedSpec = parseSpec(fileContent);
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Invalid format. Input must be in YAML or JSON format.');
  });

  it('should return false and Spec must contain info object', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-no-info.json', 'utf8');
    const parsedSpec = parseSpec(fileContent);
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

});

describe('getRequiredData method', function() {
  it('Should return all required data from file', function() {
    const fileContent = fs.readFileSync(valid31xFolder + '/petstore.json', 'utf8'),
      requiredData = getRequiredData(JSON.parse(fileContent));
    expect(requiredData).to.be.an('object')
      .and.to.have.all.keys('info', 'paths', 'webhooks', 'components');
    expect(requiredData.webhooks).to.be.an('array').with.length(0);
  });
});

describe('compareTypes method', function() {
  it('Should match type in spec with type to compare when type in spec is a string when they are equal', function() {
    const typeInSpec = 'string',
      typeToCompare = 'string',
      matchTypes = compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.true;
  });

  it('Should match type in spec with type to compare when type in spec is an array when they are equal', function() {
    const typeInSpec = ['string'],
      typeToCompare = 'string',
      matchTypes = compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.true;
  });

  it('Should match type in spec with type to compare when ' +
    'type in spec is an array with multiple types when they are equal', function() {
    const typeInSpec = ['string', 'null'],
      typeToCompare = 'string',
      matchTypes = compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.true;
  });

  it('Should match type in spec with type to compare when ' +
    'type in spec is a string when they are different', function() {
    const typeInSpec = 'integer',
      typeToCompare = 'string',
      matchTypes = compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.false;
  });

  it('Should not match type in spec with type to compare when' +
    'type in spec is an array when they are different', function() {
    const typeInSpec = ['integer'],
      typeToCompare = 'string',
      matchTypes = compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.false;
  });
});

describe('fixExamplesByVersion method', function() {
  it('Should take the first element from examples and add it as example', function() {
    const providedSchema = {
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          name: {
            type: 'string',
            examples: [
              'this is my fisrt example name in pet'
            ]
          },
          tag: {
            type: 'string'
          }
        }
      },
      expectedSchemaAfterFix = {
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          name: {
            type: 'string',
            examples: [
              'this is my fisrt example name in pet'
            ],
            example: 'this is my fisrt example name in pet'
          },
          tag: {
            type: 'string'
          }
        }
      },
      fixedSchemaWithExample = fixExamplesByVersion(providedSchema);
    expect(JSON.stringify(fixedSchemaWithExample)).to.be.equal(JSON.stringify(expectedSchemaAfterFix));
  });
});

describe('isBinaryContentType method', function() {
  it('Should be true if content type is binary type without schema', function() {
    const bodyType = 'application/octet-stream',
      contentObject = {
        'application/octet-stream': {}
      },
      isBinary = isBinaryContentType(bodyType, contentObject);
    expect(isBinary).to.be.true;
  });

  it('Should be false if content type is not binary type', function() {
    const bodyType = 'application/json',
      contentObject = {
        'application/json': {
          'schema': {
            'type': 'string',
            'examples': [
              'OK'
            ]
          }
        }
      },
      isBinary = isBinaryContentType(bodyType, contentObject);
    expect(isBinary).to.be.false;
  });
});