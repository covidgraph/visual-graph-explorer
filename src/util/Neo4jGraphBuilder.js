// helper method to convert the Neo4j "long" ids, to a simple string
export function getId(identity) {
  return `${identity.low.toString()}:${identity.high.toString()}`;
}

export function isOfType(item, type) {
  if (item && item.labels && item.labels.length > 0) {
    if (Array.isArray(type)) {
      return type.every((t) => item.labels.indexOf(t) >= 0);
    } else {
      return item.labels.indexOf(type) >= 0;
    }
  }
}
