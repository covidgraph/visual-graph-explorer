import * as neo4j from "neo4j-driver/lib/browser/neo4j-web";

/**
 * Establishes a connection to a Neo4j database.
 * @param {string} url The URL to connect to, usually through the bolt protocol (bolt://)
 * @param {string} user The username to use.
 * @param {string} pass The password to use.
 * @param {boolean} encrypted Whether to use encryption.
 */
async function connectToDB(url, user, pass, encrypted = false) {
  // create a new Neo4j driver instance
  const neo4jDriver = neo4j.driver(url, neo4j.auth.basic(user, pass), {
    encrypted: encrypted,
    trust: "TRUST_CUSTOM_CA_SIGNED_CERTIFICATES",
  });

  const runCypherQuery = createCypherQueryRunner(neo4jDriver);

  try {
    // check connection
    await runCypherQuery("MATCH (n) RETURN n LIMIT 1");
  } catch (e) {
    throw new Error(`Could not connect to Neo4j: ${e}`);
  }

  return runCypherQuery;
}

function createCypherQueryRunner(neo4jDriver) {
  /**
   * @param {string} query
   * @param {Object} [params]
   * @return {Promise}
   * @yjs:keep=run
   */
  return async function runCypherQuery(query, params = {}) {
    const session = neo4jDriver.session("READ");
    let result;
    try {
      result = await session.run(query, params);
    } catch (e) {
      throw new Error(`Could not run cypher query: ${e}`);
    } finally {
      await session.close();
    }
    return result;
  };
}

/** @type {function(query:String, params:{key:string, value:object})} */
let runQuery = null;

/** @param {String} query
 *  @param {{key:string, value:object}} params
 *  @return {QueryResult}
 */
export default async function query(query, params = {}) {
  if (runQuery == null) {
    runQuery = await connectToDB(
      "bolt://covid.petesis.com:7687",
      "public",
      "corona"
    );
  }
  return await runQuery(query, params);
}
