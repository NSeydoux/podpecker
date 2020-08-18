import { createFile, makePublic, createContainer, writeSomeData } from "./utlis";
import { Session } from "@inrupt/solid-client-authn-browser";

export async function initE2eTests(session: Session, rootContainer: string, owner: string, testSlug: string) {
    const testRoot = await createContainer(session, rootContainer, owner, testSlug);
    await makePublic(session, testRoot);
    // console.log(`Created ${testRoot}`)
    // await Promise.all([
    //     createFile(session, `${rootContainer}arbitrary.json`, owner, '{"arbitrary":"json data"}', "application/json")
    //         .then((iri) => makePublic(session, iri))
    //         .then(() => { console.log("JSON created") }),
    //     createContainer(session, rootContainer, owner, "container-test")
    //         .then((iri) => makePublic(session, iri))
    //         .then(() => {console.log("container-test created")}),
    //     createContainer(session, rootContainer, owner, "lit-pod-acl-initialisation-test")
    //         .then(async (iri) => {await makePublic(session, iri); return iri})
    //         .then((iri) => createContainer(session, iri, owner, "passthrough-container"))
    //         .then(async (iri) => {await makePublic(session, iri); return iri})
    //         .then(() => { console.log("lit-pod-acl-initialisation-test created") }),
    // ])

    let iri = await createFile(session, `${testRoot}arbitrary.json`, owner, '{"arbitrary":"json data"}', "text/plain");
    await makePublic(session, iri);
    console.log("JSON created")

    await makePublic(session, await createContainer(session, testRoot, owner, "container-test"));
    console.log("container-test created");

    iri = await createContainer(session, testRoot, owner, "lit-pod-acl-initialisation-test");
    await makePublic(session, iri);
    await makePublic(session, await writeSomeData(session, iri, owner, "", "resource.ttl"));
    console.log("lit-pod-acl-initialisation-test created");

    iri = await createContainer(session, testRoot, owner, "lit-pod-acl-test");
    await makePublic(session, iri);
    createContainer(session, iri, owner, "passthrough-container");
    await makePublic(session, iri);
    await makePublic(session, await writeSomeData(session, iri, owner, "", "resource-with-acl.ttl", true));
    // The following resource should be public by default
    await writeSomeData(session, iri, owner, "", "resource-witout-acl.ttl", false);
    console.log("lit-pod-acl-initialisation-test created")

    iri = await createContainer(session, testRoot, owner, "lit-solid-core-resource-info-test");
    await makePublic(session, iri);
    await makePublic(session, await writeSomeData(session, iri, owner, "", "litdataset.ttl", true));
    await makePublic(session, await createFile(session, `${iri}not-a-lit-dataset.png`, owner, "test text", "text/plain"));
    console.log("lit-solid-core-resource-info-test created");

    await makePublic(session, await writeSomeData(session, iri, owner, "", "lit-solid-core-test.ttl", true));
    console.log("lit-solid-core-test.ttl created");

}