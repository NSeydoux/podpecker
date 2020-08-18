import { createFile, makePublic, createContainer, writeSomeData, deleteTarget } from "./utlis";
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

    let iri = await createFile(session, `${testRoot}arbitrary.json`, owner, '{"arbitrary":"json data"}', "application/json");
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
    iri = await createContainer(session, iri, owner, "passthrough-container");
    await makePublic(session, iri);
    await makePublic(session, await writeSomeData(session, iri, owner, "", "resource-with-acl.ttl", true));
    // The following resource should be public by default
    await writeSomeData(session, iri, owner, "", "resource-without-acl.ttl", false);
    console.log("lit-pod-acl-initialisation-test created")

    iri = await createContainer(session, testRoot, owner, "lit-solid-core-resource-info-test");
    await makePublic(session, iri);
    await makePublic(session, await writeSomeData(session, iri, owner, "", "litdataset.ttl", true));
    await makePublic(session, await createFile(session, `${iri}not-a-lit-dataset.png`, owner, "test text", "text/plain"));
    console.log("lit-solid-core-resource-info-test created");

    await makePublic(session, await writeSomeData(session, testRoot, owner, "", "lit-solid-core-test.ttl", true));
    console.log("lit-solid-core-test.ttl created");
}

export async function cleanupTestData(session: Session, rootContainer: string) {
    await deleteTarget(session, `${rootContainer}lit-solid-core-test.ttl`);
    
    await deleteTarget(session, `${rootContainer}lit-solid-core-resource-info-test/litdataset.ttl`);
    await deleteTarget(session, `${rootContainer}lit-solid-core-resource-info-test/not-a-lit-dataset.png`);
    await deleteTarget(session, `${rootContainer}lit-solid-core-resource-info-test/`);

    await deleteTarget(session, `${rootContainer}lit-pod-acl-test/passthrough-container/resource-with-acl.ttl`);
    await deleteTarget(session, `${rootContainer}lit-pod-acl-test/passthrough-container/resource-without-acl.ttl`);
    await deleteTarget(session, `${rootContainer}lit-pod-acl-test/passthrough-container/`);
    await deleteTarget(session, `${rootContainer}lit-pod-acl-test/`);

    await deleteTarget(session, `${rootContainer}lit-pod-acl-initialisation-test/resource.ttl`);
    await deleteTarget(session, `${rootContainer}lit-pod-acl-initialisation-test/`);

    await deleteTarget(session, `${rootContainer}container-test/`);

    await deleteTarget(session, `${rootContainer}arbitrary.json`);
    await deleteTarget(session, `${rootContainer}`);
}