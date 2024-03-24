import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { SHA256 } from 'crypto-js';
import seedrandom from 'seedrandom';
import { removePrefix } from './utils';
import { Profile } from './types';
import path from 'path/posix';
import fs from 'fs';
import axios from 'axios';

export const createRobotDID = async (
  authorId: string,
  ceramic: any,
  compose: any
) => {
  const uniqueKey = authorId;
  if (uniqueKey) {
    try {
      const hashedKey = SHA256(uniqueKey).toString();
      const rng = seedrandom(hashedKey);
      const seed = new Uint8Array(32);
      for (let i = 0; i < 32; i += 1) {
        seed[i] = Math.floor(rng() * 256);
      }
      const staticDid = new DID({
        provider: new Ed25519Provider(seed),
        //@ts-ignore
        resolver: getKeyResolver(),
      });
      await staticDid.authenticate();
      compose.setDID(staticDid);
      ceramic.did = staticDid;

      const update = await compose.executeQuery(`
        mutation {
          createBasicProfile(input: {
            content: {
              name: "InfoCast Bot"
              username: "infocastbot"
              description: "Here to answer all questions"
              gender: "robot"
              emoji: "sm"
            }
          }) 
          {
            document {
              name
              username
              description
              gender
              emoji
            }
          }
        }
      `);

      if (update.errors) {
        alert(update.errors);
      } else {
        const updatedProfile = await compose.executeQuery(`
        query {
          viewer {
            basicProfile {
              id
              name
              username
              description
              gender
              emoji
            }
          }
        }
      `);
        const followSelf = await compose.executeQuery(`
        mutation {
          createFollowing(input: {
            content: {
              profileId: "${updatedProfile?.data?.viewer?.basicProfile.id}"
            }
          }) 
          {
            document {
              profileId
            }
          }
        }
      `);
        console.log(followSelf);
      }

      return staticDid.id;
    } catch (e) {
      console.log(e);
    }
  }
};

export type PostProps = {
  profile: Profile;
  body: string;
  id: string;
  tag?: string;
  created?: string;
  authorId?: string;
};

export const createRobotPost = async (
  authorId: string,
  ceramic: any,
  compose: any,
  message: string
) => {
  const uniqueKey = authorId;
  const robotDidParentFilePath = path.join(
    process.cwd(),
    'composedb/data',
    'robotdid.txt'
  );
  const robotdid = fs.readFileSync(robotDidParentFilePath, 'utf8');
  if (uniqueKey) {
    try {
      const hashedKey = SHA256(uniqueKey).toString();
      const rng = seedrandom(hashedKey);
      const seed = new Uint8Array(32);
      for (let i = 0; i < 32; i += 1) {
        seed[i] = Math.floor(rng() * 256);
      }
      const staticDid = new DID({
        provider: new Ed25519Provider(seed),
        //@ts-ignore
        resolver: getKeyResolver(),
      });
      await staticDid.authenticate();
      compose.setDID(staticDid);
      ceramic.did = staticDid;
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/db-context`;

      axios
        .get(url)
        .then(async function (response) {
          const id = response.data.robotProfile.id;
          if (robotdid) {
            const createdPost = await compose.executeQuery(`
          mutation {
            createPosts(input: {
              content: {
                body: """${removePrefix(message)}"""
                created: "${new Date().toISOString()}"
                profileId: "${id}"
                authorId: "${staticDid.id}"
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

            return createdPost;
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    } catch (e) {
      console.log(e);
    }
  }
};

export const handleError = (res: any, error: any) => {
  return res.status(400).json({ error });
};
