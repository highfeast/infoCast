import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { DIDSession } from 'did-session';
import { ComposeClient } from '@composedb/client';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { definition } from '../../../lib/__generated__/definition';
import { RuntimeCompositeDefinition } from '@composedb/types';
import { NextResponse } from 'next/server';
import { callVectorDBQAChain } from '../../../lib/LLM';
import { Pinecone } from '@pinecone-database/pinecone';
import sharp from 'sharp';
import { removePrefix } from '@/composedb/utils/utils';
import pinataSDK from '@pinata/sdk';
import { createRobotPost } from '@/composedb/utils/ceramic';
import { Readable } from 'stream';
import { FrameRequest } from '@coinbase/onchainkit';
import { chatFrame, errorFrame, parseRequest } from '@/lib/farcaster';


const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

const sessionFilePath = path.join(
  process.cwd(),
  'composedb/data',
  'session.json'
);
const didParentFilePath = path.join(process.cwd(), 'composedb/data', 'did.txt');

export async function POST(req: any, res: any) {
  let frameRequest: FrameRequest | undefined;
  let messages: any = [];

  try {
    frameRequest = await req.json();
    if (!frameRequest)
      throw new Error('Could not deserialize request from frame');
  } catch (e) {
    return new NextResponse(errorFrame);
  }
  const payload = await parseRequest(frameRequest);

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/history`;

  await axios
    .get(url)
    .then(function (response) {
      const x = response.data.messages;
      if (x) {
        const reorderedMessages = x.map((message: any) => {
          if (message.profile.gender === 'male') {
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

  // const pageLength = messages.length;

  const _prompt = payload.frameActionBody.inputText.toString();

  if (!_prompt || (_prompt && _prompt.length < 1)) {
    return new NextResponse(errorFrame);
  }

  let session;
  const ceramic = new CeramicClient('http://localhost:7007/');
  const compose = new ComposeClient({
    ceramic: 'http://localhost:7007/',
    //@ts-ignore
    definition: definition as RuntimeCompositeDefinition,
  });

  const sessionData = fs.readFileSync(sessionFilePath, 'utf8');
  session = await DIDSession.fromSession(sessionData);

  if (session) {
    compose.setDID(session.did as any);
    //@ts-ignore
    ceramic.did = session.did;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  const pineconeIndex = pinecone.index('highfeast1');
  const response = await callVectorDBQAChain(
    _prompt,
    await pineconeIndex.describeIndexStats(),
    'c',
    messages
  );

  if (response && response.length > 0) {
    const text = await removePrefix(response);
    const words = text.split(' ');
    const wordsPerLine = 8;
    const numLines = Math.ceil(words.length / wordsPerLine);
    const lines = [];
    for (let i = 0; i < numLines; i++) {
      const lineWords = words.slice(i * wordsPerLine, (i + 1) * wordsPerLine);
      lines.push(lineWords.join(' '));
    }

    let svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
    <text x="50%" y="50%" font-size="20" fill="black" text-anchor="middle">`;

    lines.forEach((line, index) => {
      const dy = index === 0 ? '0' : '1.2em'; // Adjust line spacing
      svgContent += `<tspan x="50%" dy="${dy}">${line}</tspan>`;
    });

    svgContent += `
    </text>
  </svg>
  `;
    const pngBuffer = await sharp(Buffer.from(svgContent)).png().toBuffer();
    const pngStream = Readable.from([pngBuffer]);
    const authorId = fs.readFileSync(didParentFilePath, 'utf8');

    if (pngBuffer) {
      try {
        const { IpfsHash } = await pinata.pinFileToIPFS(pngStream, {
          pinataMetadata: {
            name: 'infocast.png',
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
                name: 'infoCast',
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
          return new NextResponse(
            chatFrame(`${process.env.NEXT_PUBLIC_GATEWAY}/ipfs/${IpfsHash}`)
          );
        }
      } catch (e) {
        console.log(e);
      }
    }
    return NextResponse.json(response, { status: 200 });
  }
}

export const dynamic = 'force-dynamic';
