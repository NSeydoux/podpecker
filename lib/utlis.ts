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

export async function writeSomeData(session: Session) {
    const thing = createThing();

    let updatedThing = addStringNoLocale(
      thing,
      `http://xmlns.com/foaf/0.1/nick`,
      "zwifi"
    );
    
    const updatedDataset = setThing(createSolidDataset(), updatedThing);
    
    const savedDataset = await saveSolidDatasetInContainer(
      "https://ldp.demo-ess.inrupt.com/116455455448573774513/sandbox/",
      updatedDataset,
      { fetch: session.fetch, slugSuggestion: `test${Math.floor(Math.random() * Math.floor(15000))}` }
    );
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
    "https://ldp.demo-ess.inrupt.com/116455455448573774513/profile/card#me",
    { read: false, append: false, write: false, control: true }
    );
    updatedAcl = setPublicResourceAccess(
    updatedAcl,
    { read: true, append: true, write: true, control: false },
    );
    await saveAclFor(myDatasetWithAcl, updatedAcl, { fetch: session.fetch });
}
