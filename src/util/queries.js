import coreQuery, { isStagingDb } from "./dbconnection";
import { CovidGraphLoader } from "./CovidGraphLoader";

let staging = isStagingDb();

const loader = new CovidGraphLoader(null);

export function isOfType(item, type) {
  if (item && item.labels && item.labels.length > 0) {
    if (Array.isArray(type)) {
      return type.every((t) => item.labels.indexOf(t) >= 0);
    } else {
      return item.labels.indexOf(type) >= 0;
    }
  }
}

export async function query(query, args = {}, name = "result") {
  return (await coreQuery(query, args)).records.map((r) => r.get(name));
}

export async function loadGenesForPaper(paper) {
  return await loader.queryBuilder.loadOutEdges(loader.paper_geneSymbol, paper);
}

export async function loadAuthorsForPaper(paper) {
  return await loader.queryBuilder.loadOutEdges(loader.paper_author, paper);
}

export async function loadGenesForPatent(patent) {
  return await loader.queryBuilder.loadOutEdges(
    loader.patent_geneSymbol,
    patent
  );
}

export async function loadAbstractsForPaper(paper) {
  return await query(
    staging
      ? `MATCH (n:Paper)-[r:PAPER_HAS_ABSTRACTCOLLECTION]->(ach:AbstractCollection)-[r2:ABSTRACTCOLLECTION_HAS_ABSTRACT]->(a:Abstract) WHERE id(n) = $paperId 
    RETURN a as result LIMIT 100`
      : `MATCH (n:Paper)-[r:PAPER_HAS_ABSTRACT]->(ach:Abstract:CollectionHub)-[r2:ABSTRACT_HAS_ABSTRACT]->(a:Abstract) WHERE id(n) = $paperId 
    RETURN a as result LIMIT 100`,
    { paperId: paper.identity }
  );
}

export async function loadTitlesForPatent(patent) {
  return await query(
    staging
      ? `MATCH (p:Patent)-[:PATENT_HAS_PATENTTITLE]->(pt:PatentTitle)
            WHERE id(p) = $id
            RETURN pt as result LIMIT 50`
      : `MATCH (p:Patent)--(pt:PatentTitle)
            WHERE id(p) = $id
            RETURN pt as result LIMIT 50`,
    { id: patent.identity }
  );
}

export async function findPatents(searchText) {
  return coreQuery(
    staging
      ? `call db.index.fulltext.queryNodes("patents", $searchText)
yield node,score match (node)--(p:Patent)-[:PATENT_HAS_PATENTTITLE]->(pt:PatentTitle)
return distinct(id(p)) as id, collect(pt.text) as titles, labels(node)[0] as found_type, node.lang as found_in_lang, score
order by score
desc limit 10`
      : `call db.index.fulltext.queryNodes("patents", $searchText)
yield node,score match (node)--(p:Patent)-[:HAS_TITLE]->(pt:PatentTitle)
return distinct(id(p)) as id, collect(pt.text) as titles, labels(node)[0] as found_type, node.lang as found_in_lang, score
order by score
desc limit 10`,
    {
      searchText,
    }
  );
}

export async function loadBodyTextForPaper(paper) {
  return await query(
    staging
      ? `MATCH (p:Paper)
            WHERE id(p) = $paperId
            MATCH (p)-[pr:PAPER_HAS_BODYTEXTCOLLECTION]->(c:BodyTextCollection)-[r:BODYTEXTCOLLECTION_HAS_BODYTEXT]->(t:BodyText)
            WITH collect({txt:t.text, pos:r.position}) as text
            UNWIND text as t
            WITH t
            order by t.pos
            RETURN collect(t.txt) as result LIMIT 10`
      : `MATCH (p:Paper)
            WHERE id(p) = $paperId
            MATCH (p)-[pr:PAPER_HAS_BODY_TEXT]->(c:Body_text:CollectionHub)-[r:BODY_TEXT_HAS_BODY_TEXT]->(t:Body_text)
            WITH collect({txt:t.text, pos:r.position}) as text
            UNWIND text as t
            WITH t
            order by t.pos
            RETURN collect(t.txt) as result LIMIT 10`,
    { paperId: paper.identity }
  );
}
