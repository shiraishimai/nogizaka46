Parse.Cloud.define('hello', function(request, response) {
    console.log('Ran cloud function.');
    response.success('Hello world! '+request.params.a+request.params.b);
});

var HashThumb = Parse.Object.extend('HashThumb');
Parse.Cloud.beforeSave('HashThumb', function(request, response) {
    var key = request.object.get('hash');
    if (!key) return response.error('Hash has to be provided');
    new Parse.Query(HashThumb).equalTo('hash', key).first().then(function(object) {
        if (!object) return response.error('Hash already exist');
        return response.success();
    }, function(error) {
        return response.error('Error:'+error);
    });
});

Parse.Cloud.define('findDuplicates', function(request, response) {
    console.log('findDuplicates...');
    var promises = [],
        dictionary = {},
        query = new Parse.Query(HashThumb);
    request.params.list.slice(0,200).forEach(function(hash) {
        promises.push(query.equalTo('hash', hash).count().then(function(result) {
            dictionary[hash] = result;
        }, function(error) {
            dictionary[hash] = -1;
        }));
    });
    Parse.Promise.when(promises).then(function() {
        return response.success(dictionary);
    }, function(error) {
        return response.error('Error'+error);
    });
});