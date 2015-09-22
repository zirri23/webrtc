exports.expand = function expand(object, callback) {
  return object.getMetadata().then(function(metadata, found) {
    metadata.forEach(function(metadatum) {
      object[metadatum.key] = metadatum.value;
    });
    return object;
  });
};