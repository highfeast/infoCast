import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { DIDSession } from 'did-session';
import { ComposeClient } from '@composedb/client';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { definition } from '../../../lib/__generated__/definition';
import { RuntimeCompositeDefinition } from '@composedb/types';
import { PostProps } from '../../../composedb/utils/types';
import { GetRecentMessagesQuery } from '../../../composedb/utils/data.utils';
import { NextRequest, NextResponse } from 'next/server';

const sessionFilePath = path.join(
  process.cwd(),
  'composedb/data',
  'session.json'
);
const didParentFilePath = path.join(process.cwd(), 'composedb/data', 'did.txt');
const robotDidParentFilePath = path.join(
  process.cwd(),
  'composedb/data',
  'robotdid.txt'
);
const ContextUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/db-context`;

export async function GET(req: any, res: any) {
  let session;
  try {
    const compose = new ComposeClient({
      ceramic: 'http://localhost:7007/',
      //@ts-ignore
      definition: definition as RuntimeCompositeDefinition,
    });

    const sessionStat = fs.statSync(sessionFilePath);

    if (sessionStat.size === 0) {
      console.log("it's zero?");
      return NextResponse.json({ error: 'Invalid Session' }, { status: 500 });
    }

    const sessionData = fs.readFileSync(sessionFilePath, 'utf8');
    session = await DIDSession.fromSession(sessionData);

    if (session) {
      console.log(await DIDSession.fromSession(sessionData));
    }
    const authorId = fs.readFileSync(didParentFilePath, 'utf8');
    const robotId = fs.readFileSync(robotDidParentFilePath, 'utf8');
    const messages = await GetRecentMessagesQuery(compose, authorId, robotId);
    if (messages === null) {
      return NextResponse.json(
        { error: 'messages not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { messages },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internals Server Error' },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: any, res: any) {
  const payload = req.json();
  const { message } = await payload;

  if (!message) {
    return res
      .status(400)
      .json({ error: 'Missing required fields or context' });
  }

  try {
    const ceramic = new CeramicClient('http://localhost:7007/');
    const compose = new ComposeClient({
      ceramic: 'http://localhost:7007/',
      //@ts-ignore
      definition: definition as RuntimeCompositeDefinition,
    });

    let session: any;
    let userProfile;

    const sessionStat = fs.statSync(sessionFilePath);

    if (sessionStat.size === 0) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 500 });
    } else {
      const sessionData = fs.readFileSync(sessionFilePath, 'utf8');
      session = await DIDSession.fromSession(sessionData);
    }

    if (session) {
      compose.setDID(session.did as any);
      //@ts-ignore
      ceramic.did = session.did;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return axios
      .get(ContextUrl)
      .then(async (response) => {
        const data = await response.data;
        const x = await data.profile?.data?.viewer?.basicProfile;
        userProfile = await x.id;

        const profileId = userProfile as string;

        const createdPost = await compose.executeQuery<{
          createPosts: {
            document: PostProps;
          };
        }>(`
          mutation {
            createPosts(input: {
              content: {
                body: """${message}"""
                created: "${new Date().toISOString()}"
                profileId: "${profileId}"
                authorId: "${session.did.parent}"
              }
            }) {
              document {
                id
                body
                created
                profile{
                    id
                    name
                    username
                    emoji
                    gender
                  }
                authorId
              }
            }
          }
        `);

        if (createdPost.errors) {
          return NextResponse.json(
            { error: createdPost.errors },
            { status: 400 }
          );
        }

        //@ts-ignore
        return NextResponse.json(createdPost.data.createPosts.document, {
          status: 200,
        });
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}
