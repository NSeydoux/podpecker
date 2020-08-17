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
    saveAclFor,
    saveFileInContainer,
    WithResourceInfo,
    SolidDataset,
    setPublicDefaultAccess,
    overwriteFile
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
    console.log(`Making ${resourceIri} public`);
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
    let updatedAcl = setPublicResourceAccess(
        resourceAcl,
    { read: true, append: true, write: true, control: true },
    );
    updatedAcl = setPublicDefaultAccess(
        updatedAcl,
    { read: true, append: true, write: true, control: true },
    );
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
}

async function isTurtle(turtle: string, targetIri: string): Promise<boolean> {
    return turtleToTriples(turtle, targetIri).then(() => true).catch(() => false);
}

async function writeDataset(session: Session, rootContainer: string, owner: string, turtle: string, targetSlug: string, targetIri: string) {
    const data = await turtleToTriples(turtle, targetIri)
    const dataset = createSolidDataset();
    data.forEach(quad => dataset.add(quad));
    
    return await saveSolidDatasetInContainer(
      rootContainer,
      dataset,
      { fetch: session.fetch, slugSuggestion: targetSlug }
    );
}

async function writeFile(session: Session, rootContainer: string, owner: string, content: string, targetSlug: string) {
    return await saveFileInContainer(
        rootContainer, 
        new Blob([content]),
        { fetch: session.fetch, slug: targetSlug}
    )
}

export async function writeSomeData(session: Session, rootContainer: string, owner: string, turtle: string) {
    const targetSlug = `test${Math.floor(Math.random() * Math.floor(15000))}`;
    const targetIri = `${rootContainer}${targetSlug}`;
    console.log(`Creating resource at ${targetIri}`)
    if(await isTurtle(turtle, targetIri)) {
        const savedDataset = await writeDataset(session, rootContainer, owner, turtle, targetSlug, targetIri);
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
    } else {
        const savedFile = await writeFile(session, rootContainer, owner, turtle, targetSlug);
        // Get the ACL for the created file
        const myFileWithAcl = await getSolidDatasetWithAcl(getSourceUrl(savedFile), { fetch: session.fetch });
        let resourceAcl;
        if (!hasResourceAcl(myFileWithAcl)) {
            if (!hasAccessibleAcl(myFileWithAcl)) {
                throw new Error(
                "The current user does not have permission to change access rights to this Resource."
                );
            }
            if (!hasFallbackAcl(myFileWithAcl)) {
                throw new Error(
                "The current user does not have permission to see who currently has access to this Resource."
                );
                // Alternatively, initialise a new empty ACL as follows,
                // but be aware that if you do not give someone Control access,
                // **nobody will ever be able to change Access permissions in the future**:
                // resourceAcl = createAcl(myDatasetWithAcl);
            }
            resourceAcl = createAclFromFallbackAcl(myFileWithAcl);
        } else {
            resourceAcl = getResourceAcl(myFileWithAcl);
        }

        // Give someone Control access to the given Resource:
        let updatedAcl = setAgentResourceAccess(
            resourceAcl,
            owner,
            { read: true, append: true, write: true, control: true }
        );
        await saveAclFor(myFileWithAcl, updatedAcl, { fetch: session.fetch });
    }
    return targetIri;
}

export async function createFile(session: Session, targetIri: string, owner: string, content: string, contentType: string) {
    console.log(`Creating resource at ${targetIri}`)
    const savedFile = await overwriteFile(
        targetIri, 
        new Blob([content], { type: contentType}),
        { fetch: session.fetch }
    )
    // Get the ACL for the created file
    const myFileWithAcl = await getSolidDatasetWithAcl(getSourceUrl(savedFile), { fetch: session.fetch });
    let resourceAcl;
    if (!hasResourceAcl(myFileWithAcl)) {
        if (!hasAccessibleAcl(myFileWithAcl)) {
            throw new Error(
            "The current user does not have permission to change access rights to this Resource."
            );
        }
        if (!hasFallbackAcl(myFileWithAcl)) {
            throw new Error(
            "The current user does not have permission to see who currently has access to this Resource."
            );
            // Alternatively, initialise a new empty ACL as follows,
            // but be aware that if you do not give someone Control access,
            // **nobody will ever be able to change Access permissions in the future**:
            // resourceAcl = createAcl(myDatasetWithAcl);
        }
        resourceAcl = createAclFromFallbackAcl(myFileWithAcl);
    } else {
        resourceAcl = getResourceAcl(myFileWithAcl);
    }

    console.log(`Giving access to ${owner}`);
    // Give someone Control access to the given Resource:
    let updatedAcl = setAgentResourceAccess(
        resourceAcl,
        owner,
        { read: true, append: true, write: true, control: true }
    );
    await saveAclFor(myFileWithAcl, updatedAcl, { fetch: session.fetch });
    return targetIri;
}