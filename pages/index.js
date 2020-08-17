import Head from 'next/head'
import styles from '../styles/Home.module.css'
import React, { useState, useEffect } from "react";
import {
  Session as AuthSession,
  getClientAuthenticationWithDependencies
} from "@inrupt/solid-client-authn-browser";
import { writeSomeData, makePublic, createFile } from "../lib/utlis";

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
  const [targetIri, setTargetIri] = useState(null);
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

  const handleCarve = (e) => {
    // The default behaviour of the button is to resubmit. 
    // This prevents the page from reloading.
    e.preventDefault();
    createFile(session, targetIri, session.info.webId, data, contentType).then((createdResource) => makePublic(session, createdResource)).then(() => console.log("File created"));
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
        <button onClick={(e) => handlePeck(e)}>Peck!</button>
        </div>
        <div>
        Target IRI: <input
            type="text"
            value={targetIri}
            onChange={e => {
              setTargetIri(e.target.value);
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
        <pre>
          {data}
        </pre>
      </main>
    </div>
  )
}
