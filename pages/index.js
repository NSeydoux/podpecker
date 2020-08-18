import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useState, useEffect } from "react";
import {
  Session as AuthSession,
  getClientAuthenticationWithDependencies
} from "@inrupt/solid-client-authn-browser";
import { writeSomeData, makePublic, createACL, createFile, createContainer, deleteTarget } from "../lib/utlis";
import { initE2eTests, cleanupTestData } from '../lib/e2e';

export default function Home() {
  const [session, setSession] = useState(new AuthSession(
    {
      clientAuthentication: getClientAuthenticationWithDependencies({})
    },
    "mySession"
  ));
  const [issuer, setIssuer] = useState("https://broker.demo-ess.inrupt.com/");
  const [oidc, setOidc] = useState("awaiting_login");
  const [resource, setResource] = useState(session.info.webId);
  const [data, setData] = useState(null);
  const [rootContainer, setRootContainer] = useState(null);
  const [testSlug, setTestSlug] = useState(null);
  const [contentType, setContentType] = useState("text/plain");
  
  useEffect(() => {
    if(oidc === "login_sent") {
      session.login({
        redirectUrl: new URL("http://localhost:3000/"),
        oidcIssuer: new URL(issuer)
      });
    }
  }, [oidc]);

  useEffect(() => {
    const authCode =
        new URL(window.location.href).searchParams.get("code");
    if (authCode) {
      console.log("Being redirected from the IdP")
      session.handleIncomingRedirect(
        new URL(window.location.href)
      ).then((info) => {
        setResource(info.webId)
      });
    }
  }, []);

  const handleLogin = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    setOidc("login_sent")
  }

  const handleFetch = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    session.fetch(resource).then(response => response.text()).then(setData);
  }

  const handlePublic = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    makePublic(session, resource)
  }

  const handlePeck = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    writeSomeData(session, rootContainer, session.info.webId, data).then((createdResource) => makePublic(session, createdResource)).then(() => console.log("Data written"));
  }

  const handleContainer = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    createContainer(session, rootContainer, session.info.webId, testSlug).then((createdResource) => makePublic(session, createdResource)).then(() => console.log("Container created"));
  }

  const handleCarve = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    createFile(session, resource, session.info.webId, data, contentType).then((createdResource) => makePublic(session, createdResource)).then(() => console.log("File created"));
  }

  const handleAcl = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    createACL(session, resource, data).then(() => console.log("ACL created"));
  }

  const handleDrill = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    // await createContainer(session, rootContainer, session.info.webId, testSlug);
    // createFile(session, `${rootContainer}${testSlug}/arbitrary.json`, session.info.webId, '{"arbitrary":"json data"}', "text/plain");
    initE2eTests(session, rootContainer, session.info.webId, testSlug).then(() => console.log("Test data drilled"));
  }

  const handleDelete = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    // await createContainer(session, rootContainer, session.info.webId, testSlug);
    // createFile(session, `${rootContainer}${testSlug}/arbitrary.json`, session.info.webId, '{"arbitrary":"json data"}', "text/plain");
    deleteTarget(session, resource).then(() => console.log("Target deleted"));
  }

  const handleCleanup = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    // await createContainer(session, rootContainer, session.info.webId, testSlug);
    // createFile(session, `${rootContainer}${testSlug}/arbitrary.json`, session.info.webId, '{"arbitrary":"json data"}', "text/plain");
    cleanupTestData(session, rootContainer).then(() => console.log("Test data cleaned up"));
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>PodPecker</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Peck some resources into your Pod
        </h1>
        <p>{session.info.webId ? `Logged in as ${session.info.webId}` : "Not logged in yet"} </p>
        <div>
        <form>
          <input
            type="text"
            value={issuer}
            onChange={e => {
              setIssuer(e.target.value);
            }}
          />
          <button onClick={(e) => handleLogin(e)}>Log In</button>
        </form>
        </div>
        <hr/>
        <div>
        <input
            type="text"
            value={resource}
            onChange={e => {
              setResource(e.target.value);
            }}
          />
          <button onClick={(e) => handleFetch(e)}>Fetch</button>
          <button onClick={(e) => handlePublic(e)}>Make public</button>
        </div>
        <hr/>
        <div>
        Root container: <input
            type="text"
            value={rootContainer}
            onChange={e => {
              setRootContainer(e.target.value);
            }}
          />
          Data: <textarea
            value={data}
            onChange={e => {
              setData(e.target.value);
            }}
          />
        <button onClick={(e) => handlePeck(e)}>Peck data</button>
        </div>
        <hr></hr>
        <div>
        Root container: <input
            type="text"
            value={rootContainer}
            onChange={e => {
              setRootContainer(e.target.value);
            }}
          />
          Slug: <input
            value={testSlug}
            onChange={e => {
              setTestSlug(e.target.value);
            }}
          />
        <button onClick={(e) => handleContainer(e)}>Peck container</button>
        </div>
        <hr/>
        <div>
        Target IRI: <input
            type="text"
            value={resource}
            onChange={e => {
              setResource(e.target.value);
            }}
          />
          Data: <textarea
            value={data}
            onChange={e => {
              setData(e.target.value);
            }}
          />
          Content type: <input
            type="text"
            value={contentType}
            onChange={e => {
              setContentType(e.target.value);
            }}
          />
        <button onClick={(e) => handleCarve(e)}>Carve file</button>
        </div>
        <hr></hr>
        <div>
        Target IRI: <input
            type="text"
            value={resource}
            onChange={e => {
              setResource(e.target.value);
            }}
          />
          Data: <textarea
            value={data}
            onChange={e => {
              setData(e.target.value);
            }}
          />
        <button onClick={(e) => handleAcl(e)}>Carve ACL</button>
        </div>
        <hr></hr>
        <div>
        Root container: <input
            type="text"
            value={rootContainer}
            onChange={e => {
              setRootContainer(e.target.value);
            }}
          />
          Test container slug: <input
            type="text"
            value={testSlug}
            onChange={e => {
              setTestSlug(e.target.value);
            }}
          />
          <button onClick={(e) => handleDrill(e)}>Drill test data</button>
          <button onClick={(e) => handleCleanup(e)}>Cleanup test data</button>
        </div>
        <div>
        Target IRI: <input
            type="text"
            value={resource}
            onChange={e => {
              setResource(e.target.value);
            }}
          />
        <button onClick={(e) => handleDelete(e)}>Delete target</button>
        </div>
        <pre>
          {data}
        </pre>
      </main>
    </div>
  )
}
