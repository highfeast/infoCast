import fs from "fs";
import path from "path";
import axios from "axios";
import { DIDSession } from "did-session";
import { ComposeClient } from "@composedb/client";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { definition } from "../../../lib/__generated__/definition";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { PostProps } from "../../../composedb/utils/types";
import { GetRecentMessagesQuery } from "../../../composedb/utils/data.utils";
import { NextRequest, NextResponse } from "next/server";
import { callVectorDBQAChain } from "../../../lib/LLM";
import { Pinecone } from "@pinecone-database/pinecone";
import stream from "stream";
import sharp from "sharp";
import { removePrefix } from "@/composedb/utils/utils";
import pinataSDK from "@pinata/sdk";
import { createRobotPost } from "@/composedb/utils/ceramic";
import { Readable } from "stream";

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

const sessionFilePath = path.join(
  process.cwd(),
  "composedb/data",
  "session.json"
);
const didParentFilePath = path.join(process.cwd(), "composedb/data", "did.txt");
const robotDidParentFilePath = path.join(
  process.cwd(),
  "composedb/data",
  "robotdid.txt"
);
const ContextUrl = "http://localhost:3000/api/db-context";

export async function POST(req: any, res: any) {
  let session;
  const ceramic = new CeramicClient("http://localhost:7007/");
  const compose = new ComposeClient({
    ceramic: "http://localhost:7007/",
    //@ts-ignore
    definition: definition as RuntimeCompositeDefinition,
  });

  const sessionData = fs.readFileSync(sessionFilePath, "utf8");

  // console.log(sessionData);
  session = await DIDSession.fromSession(sessionData);
  // console.log(sessionData);

  if (session) {
    compose.setDID(session.did as any);
    //@ts-ignore
    ceramic.did = session.did;
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  //find a way to package the messages in an acceptable form
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json(
      { message: "mrompt format erro" },
      { status: 500 }
    );
  }

  let messages: any = [];

  const pineconeIndex = pinecone.index("highfeast1");

  //query message history
  const url = "http://localhost:3000/api/message";
  await axios
    .get(url)
    .then(function (response) {
      const x = response.data.messages;
      if (x) {
        const reorderedMessages = x.map((message: any) => {
          if (message.profile.gender === "male") {
            return { human_message: message.body };
          } else {
            return { ai_message: message.body };
          }
        });
        messages.push(...reorderedMessages);
      }
    })
    .catch(function (error) {
      console.error(error);
    });

  const response = await callVectorDBQAChain(
    prompt,
    await pineconeIndex.describeIndexStats(),
    "c",
    messages
  );

  if (response && response.length > 0) {
    const ntext = await removePrefix(response);
    const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
            <rect width="400" height="200" fill="white"/>
            <text x="50%" y="50%" font-size="20" fill="black" text-anchor="middle">${ntext}</text>
        </svg>
    `;
    const pngBuffer = await sharp(Buffer.from(svgContent)).png().toBuffer();
    const pngStream = Readable.from([pngBuffer]);

    const authorId = fs.readFileSync(didParentFilePath, "utf8");
    if (pngBuffer) {
      try {
        const { IpfsHash } = await pinata.pinFileToIPFS(pngStream, {
          pinataMetadata: {
            name: "infocast.png",
          },
        });
        if (IpfsHash) {
          const _message = await pinata.pinJSONToIPFS(
            {
              image: IpfsHash,
              message: removePrefix(response),
            },
            {
              pinataMetadata: {
                name: "infoCast",
              },
            }
          );
          //after post is successful, you move the user out
          const robotPost = await createRobotPost(
            authorId,
            ceramic,
            compose,
            _message.IpfsHash
          );
          console.log(robotPost);

          return NextResponse.json(_message.IpfsHash, { status: 200 });
        }
      } catch (e) {
        console.log(e);
      }
    }

    return NextResponse.json(response, { status: 200 });
  }
}
