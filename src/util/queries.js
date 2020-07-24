import coreQuery from "./dbconnection";
import { CovidGraphLoader } from "./CovidGraphLoader";

const loader = new CovidGraphLoader(null);

export async function query(query, args = {}, name = "result") {
  return (await coreQuery(query, args)).records.map((r) => r.get(name));
}

export async function loadGenesForPaper(paper) {
  return await loader.queryBuilder.loadTargetNodes(
    loader.paper_geneSymbol,
    paper
  );
}

export async function loadAuthorsForPaper(paper) {
  return await loader.queryBuilder.loadTargetNodes(loader.paper_author, paper);
}

export async function loadGenesForPatent(patent) {
  return await loader.queryBuilder.loadTargetNodes(
    loader.patent_geneSymbol,
    patent
  );
}

export async function loadChildPathways(pathway) {
  return await loader.queryBuilder.loadTargetNodes(
    loader.pathway_pathway,
    pathway
  );
}

export async function loadAbstractsForPaper(paper) {
  return await query(
    `MATCH (n:Paper)-[r:PAPER_HAS_ABSTRACTCOLLECTION]->(ach:AbstractCollection)-[r2:ABSTRACTCOLLECTION_HAS_ABSTRACT]->(a:Abstract) WHERE id(n) = $paperId 
    RETURN a as result LIMIT 100`,
    { paperId: paper.identity }
  );
}

export async function loadTitlesForPatent(patent) {
  return await query(
    `MATCH (p:Patent)-[:PATENT_HAS_PATENTTITLE]->(pt:PatentTitle)
            WHERE id(p) = $id
            RETURN pt as result LIMIT 50`,
    { id: patent.identity }
  );
}

export async function loadBodyTextForPaper(paper) {
  return await query(
    `MATCH (p:Paper)
            WHERE id(p) = $paperId
            MATCH (p)-[pr:PAPER_HAS_BODYTEXTCOLLECTION]->(c:BodyTextCollection)-[r:BODYTEXTCOLLECTION_HAS_BODYTEXT]->(t:BodyText)
            WITH collect({txt:t.text, pos:r.position}) as text
            UNWIND text as t
            WITH t
            order by t.pos
            RETURN collect(t.txt) as result LIMIT 10`,
    { paperId: paper.identity }
  );
}
