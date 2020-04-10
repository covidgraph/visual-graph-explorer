import coreQuery from "./dbconnection";

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
  return await query(
    `MATCH (p:Paper) WHERE id(p) = $paperId MATCH (p)-[:MENTIONS]->(g:GeneSymbol) 
    RETURN g as result ORDER BY g.sid`,
    { paperId: paper.identity }
  );
}

export async function loadGenesForPatent(patent) {
  return await query(
    `MATCH (p:Patent) WHERE id(p) = $patentId MATCH (p)-[:HAS_DESCRIPTION]->(:PatentDescription)-[:MENTIONS]->(g:GeneSymbol) RETURN g as result`,
    { patentId: patent.identity }
  );
}

export async function loadPatentsForGene(gene) {
  return await query(
    `MATCH (g:GeneSymbol) WHERE id(g) = $geneId MATCH (p:Patent) - [:HAS_DESCRIPTION] -> (:PatentDescription) - [:MENTIONS] -> (g) 
    RETURN p as result`,
    { geneId: gene.identity }
  );
}

export async function loadGenePaperRelationShips(newGenes, existingPapers) {
  return await query(
    `MATCH (p)-[:MENTIONS]->(g:GeneSymbol) Where id(g) in $newGeneIds AND id(p) in $existingPaperIds RETURN id(p) as result`,
    {
      newGeneIds: newGenes.map((ng) => ng.identity),
      existingPaperIds: existingPapers.map((ep) => ep.identity),
    }
  );
}

export async function loadPapersForGene(gene) {
  return await query(
    `MATCH (g:GeneSymbol) WHERE id(g) = $geneId MATCH (p:Paper)-[:MENTIONS]->(g:GeneSymbol) 
    RETURN p as result`,
    { geneId: gene.identity }
  );
}

export async function loadAuthorsForPaper(paper) {
  return await query(
    `MATCH (p:Paper) WHERE id(p) = $paperId MATCH (p)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(result:Author) 
    RETURN result LIMIT 50`,
    { paperId: paper.identity }
  );
}

export async function loadPapersForAuthor(author) {
  return await query(
    `MATCH (a:Author) WHERE id(a) = $authorId MATCH (p:Paper)-[:PAPER_HAS_METADATA]->(m:Metadata)-[:METADATA_HAS_AUTHOR]->(:Author:CollectionHub)-[:AUTHOR_HAS_AUTHOR]->(a) 
    RETURN p as result LIMIT 100`,
    { authorId: author.identity }
  );
}

export async function loadAbstractsForPaper(paper) {
  return await query(
    `MATCH (n:Paper)-[r:PAPER_HAS_ABSTRACT]->(ach:Abstract:CollectionHub)-[r2:ABSTRACT_HAS_ABSTRACT]->(a:Abstract) WHERE id(n) = $paperId 
    RETURN a as result LIMIT 100`,
    { paperId: paper.identity }
  );
}

export async function loadReferencedPapersForPaper(paper) {
  return await query(
    `MATCH (n0:Paper) Where id(n0) in $papers MATCH (n0)-[r0:PAPER_HAS_BIB_ENTRIES]->(n1:Bib_entries)-[r1:BIB_ENTRIES_HAS_BIBREF]->(n2:Bibref)-[r2:BIBREF_HAS_OTHER_IDS]->(n3:Other_ids)-[r3]->(n4:CollectionHub)-[r4]->(paperId)<-[r6:PAPERID_COLLECTION_HAS_PAPERID]-(n5:CollectionHub:PaperID)<-[r5:PAPER_HAS_PAPERID_COLLECTION]-(p:Paper) WHERE n0 <> p
     RETURN p as result LIMIT 500`,
    { papers: [paper.identity] }
  );
}

export async function loadTitlesForPatent(patent) {
  return await query(
    `MATCH (p:Patent)--(pt:PatentTitle)
            WHERE id(p) = $id
            RETURN pt as result LIMIT 50`,
    { id: patent.identity }
  );
}

export async function loadBodyTextForPaper(paper) {
  return await query(
    `MATCH (p:Paper)
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
