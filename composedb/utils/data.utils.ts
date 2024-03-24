import { createRobotDID } from './ceramic';
import { Profile } from './types';

// <{
//     contextIndex: { edges: { node: { id: string; context: string; authorId: string } }[] };
//   }>

export const getContext = async (authorId: string, compose: any) => {
  const existingContext = await compose.executeQuery(`
    query {
      contextIndex(
        filters: { where: { authorId: { equalTo: "${authorId}" } } }
        first: 1
      ) {
        edges {
          node {
            id
            context
            authorId
          }
        }
      }
    }
  `);

  if (
    existingContext &&
    existingContext.data &&
    existingContext.data.contextIndex?.edges.length > 0
  ) {
    return existingContext.data.contextIndex.edges[0].node.context;
  }

  return null;
};

// <{ viewer: { basicProfile: Profile } }>

export const getBasicProfile = async (compose: any) => {
  const profile = await compose.executeQuery(`
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

  return profile?.data?.viewer?.basicProfile || null;
};

export const getRobotProfile = async (
  compose: any,
  authorId: string,
  ceramic: any
) => {
  const robotDID = await createRobotDID(authorId, ceramic, compose);
  //   compose.setDID(authorId);
  const profile = await compose.executeQuery(`
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

  return profile?.data?.viewer?.basicProfile || null;
};

export const GetRecentMessagesQuery = async (
  compose: any,
  profileId: string,
  robotId: string
) => {
  const messages = await compose.executeQuery(`
    query  {
      postsIndex(
        filters: {
          or: [
            {where: 
              { authorId: 
                 { equalTo: "${profileId}" } 
              }
            }
            {where: 
              { authorId: 
                 { equalTo: "${robotId}" } 
                }
               }
              ]
           } 
        last: 100) {
        edges {
          node {
            id
            body
            tag
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
    }
  `);

  if (messages?.data?.postsIndex?.edges) {
    const newPosts = messages?.data?.postsIndex?.edges.map((edge: any) => ({
      id: edge.node.id,
      body: edge.node.body,
      profile: edge.node.profile,
      tag: edge.node.tag,
      created: edge.node.created,
      authorId: edge.node.authorId,
    }));
    // console.log(newPosts);
    // console.log([...posts, ...newPosts]);
    return newPosts; // messages?.data?.postsIndex?.edges;
  }
};
