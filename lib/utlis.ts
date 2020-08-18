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
    getFileWithAcl,
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
    overwriteFile,
    AclDataset,
    getFetchedFrom,
    getThingAll,
    getIri,
    addIri,
    asIri,
    asUrl,
    ThingPersisted,
    deleteFile,
    setAgentDefaultAccess
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
    // On ESS, default access requires resource access
    getThingAll(updatedAcl).forEach(thing => {
        if (getIri(thing, "http://www.w3.org/ns/auth/acl#default")) {
            const newthing = addIri(
                thing,
                "http://www.w3.org/ns/auth/acl#accessTo",
                getIri(thing, "http://www.w3.org/ns/auth/acl#default")
            );
            updatedAcl = setThing(updatedAcl, newthing);
        }
    })
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
}

export async function giveResourceAccessTo(session: Session, resourceIri: string, agent: string, access: {read: boolean, write: boolean, append: boolean, control: boolean}) {
    console.log(`Giving some access to ${agent} for ${resourceIri}`);
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
        }
        resourceAcl = createAclFromFallbackAcl(myDatasetWithAcl);
    } else {
        resourceAcl = getResourceAcl(myDatasetWithAcl);
    }

    // Set the access
    let updatedAcl = setAgentResourceAccess(
        resourceAcl,
        agent,
        access,
    );
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
}

export async function giveDefaultAccessTo(session: Session, resourceIri: string, agent: string, access: {read: boolean, write: boolean, append: boolean, control: boolean}) {
    console.log(`Giving default access to ${agent} for ${resourceIri}`);
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
        }
        resourceAcl = createAclFromFallbackAcl(myDatasetWithAcl);
    } else {
        resourceAcl = getResourceAcl(myDatasetWithAcl);
    }

    // Make the resource public
    let updatedAcl = setAgentDefaultAccess(
        resourceAcl,
        agent,
        access,
    );
    // On ESS, default access requires resource access
    getThingAll(updatedAcl).forEach(thing => {
        if (getIri(thing, "http://www.w3.org/ns/auth/acl#default")) {
            const newthing = addIri(
                thing,
                "http://www.w3.org/ns/auth/acl#accessTo",
                getIri(thing, "http://www.w3.org/ns/auth/acl#default")
            );
            updatedAcl = setThing(updatedAcl, newthing);
        }
    })
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
}

async function isTurtle(turtle: string, targetIri: string): Promise<boolean> {
    return turtleToTriples(turtle, targetIri).then(() => true).catch(() => false);
}

async function writeDataset(
        session: Session, 
        rootContainer: string, 
        owner: string, 
        turtle: string, 
        targetSlug: string, 
        targetIri: string) {
    const data = await turtleToTriples(turtle, targetIri)
    const dataset = createSolidDataset();
    data.forEach(quad => dataset.add(quad));
    
    return await saveSolidDatasetInContainer(
      rootContainer,
      dataset,
      { fetch: session.fetch, slugSuggestion: targetSlug }
    );
}

export async function deleteTarget(
    session: Session, 
    targetIri: string
) {
    await deleteFile(targetIri, { fetch: session.fetch });
}

export async function createContainer(
        session: Session, 
        rootContainer: string, 
        owner: string, 
        slug: string, 
        setAcl: boolean = true) {
    const containerIri = `${rootContainer}${slug}/`
    await session.fetch(rootContainer, {
        method: "POST",
        headers: {
            "Content-Type": "text/turtle",
            "Link": '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
            "Slug": slug
        }
    })
    if (!setAcl) {
        return containerIri;
    }
    console.log(`${containerIri} created, setting access`);
    // Get the ACL for the created file
    const myDatasetWithAcl = await getSolidDatasetWithAcl(
        containerIri, { fetch: session.fetch }
    );
    let resourceAcl: AclDataset;
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
        console.log("Creating acl from fallback")
        resourceAcl = createAclFromFallbackAcl(myDatasetWithAcl);
    } else {
        console.log("retrieving resource ACL")
        resourceAcl = getResourceAcl(myDatasetWithAcl);
    }

    // Give someone Control access to the given Resource:
    let updatedAcl = setAgentResourceAccess(
        resourceAcl,
        owner,
        { read: true, append: true, write: true, control: true }
    );
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
    return containerIri;
}

export async function writeSomeData(
        session: Session, 
        rootContainer: string, 
        owner: string, 
        turtle: string,
        slug?: string,
        setAcl: boolean = true) {
    const targetSlug = slug ?? `test${Math.floor(Math.random() * Math.floor(15000))}`;
    const targetIri = `${rootContainer}${targetSlug}`;
    console.log(`Creating resource at ${targetIri}`)
    if(await isTurtle(turtle, targetIri)) {
        const savedDataset = await writeDataset(session, rootContainer, owner, turtle, targetSlug, targetIri);
        if(!setAcl) {
            return targetIri;
        }
        // Get the ACL for the created file
        const myDatasetWithAcl = await getSolidDatasetWithAcl(getSourceUrl(savedDataset), { fetch: session.fetch });
        let resourceAcl: AclDataset;
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
        console.log("To create a non-RDF file, please use the 'Carve' button");
    }
    return targetIri;
}

export async function createFile(
        session: Session, 
        targetIri: string, 
        owner: string, 
        content: string, 
        contentType: string) {
    console.log(`Creating resource at ${targetIri}`)
    const savedFile = await overwriteFile(
        targetIri, 
        new Blob([content], { type: contentType}),
        { fetch: session.fetch }
    )
    console.log(`Saved file at ${getFetchedFrom(savedFile)}`)
    // Get the ACL for the created file
    // const myFileWithAcl = await getFileWithAcl(targetIri, { fetch: session.fetch, init: {headers: {Accept: contentType}} });
    const myFileWithAcl = await getFileWithAcl(
        targetIri, { fetch: session.fetch, init: {headers: {Accept: contentType}} }
    );
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

export async function createACL(session: Session, targetIri: string, content: string) {
    console.log(`PUTting ACL at ${targetIri}`)
    // const data = await turtleToTriples(content, targetIri)
    // const dataset = createSolidDataset();
    // data.forEach(quad => dataset.add(quad));

    // const savedFile = await saveSolidDatasetAt(
    //     targetIri, 
    //     dataset,
    //     { fetch: session.fetch }
    // )
    session.fetch(targetIri, {
        method: "PUT",
        body: content,
        headers: {
            "Content-Type": "text/turtle",
            Link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"',
        } 
        
    })
    // console.log(`Saved ACL at ${getFetchedFrom(savedFile)}`)
    return targetIri;
}