import { useState, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
// import Files from "@/components/Files";
// import lit protocol sdk
import * as LitJsSdk from "@lit-protocol/lit-node-client";

export const chatWith = async (recipient: `0x${string}`) => {
  const [file, setFile] = useState("");
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [decryptionCid, setDecryptionCid] = useState("");
};

//token gate the conversation by address