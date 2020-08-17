import { 
    createThing,
    createSolidDataset,
    createAcl,
    addStringNoLocale,
    setThing,
    saveSolidDatasetAt,
    saveSolidDatasetInContainer,
    getSolidDatasetWithAcl,
    getSourceUrl,
    createAclFromFallbackAcl,
    hasResourceAcl,
    hasAccessibleAcl,
    hasFallbackAcl,
    setAgentResourceAccess,
    getResourceAcl,
    setPublicResourceAccess,
    saveAclFor
 } from "@inrupt/solid-client";

 import {
     Session
 } from "@inrupt/solid-client-authn-browser"
import { Quad, Parser } from "n3";

/**
 * Function recycled from https://github.com/inrupt/solid-client-js 
 */
 export async function turtleToTriples(
    raw: string,
    resourceIri: string
  ): Promise<Quad[]> {
    const format = "text/turtle";
    const parser = new Parser({ format: format, baseIRI: resourceIri });
  
    const parsingPromise = new Promise<Quad[]>((resolve, reject) => {
      const parsedTriples: Quad[] = [];
      parser.parse(raw, (error, triple, _prefixes) => {
        if (error) {
          return reject(error);
        }
        if (triple) {
          parsedTriples.push(triple);
        } else {
          resolve(parsedTriples);
        }
      });
    });
  
    return parsingPromise;
  }

export async function makePublic(session: Session, resourceIri: string) {
    const myDatasetWithAcl = await getSolidDatasetWithAcl(resourceIri, { fetch: session.fetch });
    let resourceAcl;
    if (!hasResourceAcl(myDatasetWithAcl)) {
        if (!hasAccessibleAcl(myDatasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to change access rights to this Resource."
            );
        }
        if (!hasFallbackAcl(myDatasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to see who currently has access to this Resource."
            );
            // Alternatively, initialise a new empty ACL as follows,
            // but be aware that if you do not give someone Control access,
            // **nobody will ever be able to change Access permissions in the future**:
            // resourceAcl = createAcl(myDatasetWithAcl);
        }
        resourceAcl = createAclFromFallbackAcl(myDatasetWithAcl);
    } else {
        resourceAcl = getResourceAcl(myDatasetWithAcl);
    }

    // Make the resource public
    const updatedAcl = setPublicResourceAccess(
        resourceAcl,
    { read: true, append: true, write: true, control: true },
    );
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
}

export async function writeSomeData(session: Session, rootContainer: string, owner: string, turtle: string) {
    const targetSlug = `test${Math.floor(Math.random() * Math.floor(15000))}`;
    const targetIri = `${rootContainer}${targetSlug}`;
    console.log(`Creating resource at ${targetIri}`)
    const data = await turtleToTriples(turtle, targetIri)
    const dataset = createSolidDataset();
    data.forEach(quad => dataset.add(quad));
    
    const savedDataset = await saveSolidDatasetInContainer(
      rootContainer, //"https://ldp.demo-ess.inrupt.com/116455455448573774513/sandbox/",
      dataset,
      { fetch: session.fetch, slugSuggestion: targetSlug }
    );

    // Get the ACL for the created file
    const myDatasetWithAcl = await getSolidDatasetWithAcl(getSourceUrl(savedDataset), { fetch: session.fetch });
    let resourceAcl;
    if (!hasResourceAcl(myDatasetWithAcl)) {
        if (!hasAccessibleAcl(myDatasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to change access rights to this Resource."
            );
        }
        if (!hasFallbackAcl(myDatasetWithAcl)) {
            throw new Error(
            "The current user does not have permission to see who currently has access to this Resource."
            );
            // Alternatively, initialise a new empty ACL as follows,
            // but be aware that if you do not give someone Control access,
            // **nobody will ever be able to change Access permissions in the future**:
            // resourceAcl = createAcl(myDatasetWithAcl);
        }
        resourceAcl = createAclFromFallbackAcl(myDatasetWithAcl);
    } else {
        resourceAcl = getResourceAcl(myDatasetWithAcl);
    }

    // Give someone Control access to the given Resource:
    let updatedAcl = setAgentResourceAccess(
        resourceAcl,
        owner,
        { read: true, append: true, write: true, control: true }
    );
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
    return targetIri;
}
