import * as neo4j from "neo4j-driver/lib/browser/neo4j-web";

const { url, pass, user } =
  window.location.search && window.location.search.indexOf("db=staging") >= 0
    ? {
        url: "bolt://db-dev.covidgraph.org:7687",
        user: "public",
        pass: "corona",
      }
    : {
        url: "bolt://covid.petesis.com:7687",
        user: "public",
        pass: "corona",
      };

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
    trust: "TRUST_SYSTEM_CA_SIGNED_CERTIFICATES",
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

export const queryEvents = {
  onQueryStarted: () => {},
  onQuerySuccess: () => {},
  onQueryFailed: (error, retryQuery) => Promise.reject(error),
};

/** @param {String} q
 *  @param {{}} params
 *  @return {QueryResult}
 */
export default async function query(q, params = {}) {
  try {
    queryEvents.onQueryStarted();
    if (runQuery == null) {
      runQuery = await connectToDB(url, user, pass, true);
    }

    const result = runQuery(q, params);
    queryEvents.onQuerySuccess();
    return result;
  } catch (e) {
    return await queryEvents.onQueryFailed(e, () => query(q, params));
  }
}
