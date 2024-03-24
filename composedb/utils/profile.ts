import { Profile } from './types';

export const updateContext = async (
  context: string,
  authorId: string,
  compose: any
) => {
  const updateResult = await compose.executeQuery(`
    mutation {
      createContext(input: { content: { context: "${
        context || ''
      }" authorId: "${authorId}" } }) {
        document {
          id
          context
        }
      }
    }
  `);

  if (updateResult.errors) {
    return { success: false, errors: updateResult.errors };
  }

  return { success: true, data: updateResult.data?.createContext.document };
};

export const createBasicProfile = async (compose: any) => {
  return await compose.executeQuery(`
    mutation {
      createBasicProfile(input: { content: {
        name: "InfoCast Admin"
        username: "admin"
        description: "InfoUser"
        gender: "male"
        emoji: "In"
      } }) {
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
};

export const getBasicProfile = async (compose: any) => {
  return await compose.executeQuery(`
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
};

export const followSelf = async (profileId: string, compose: any) => {
  return await compose.executeQuery(`
    mutation {
      createFollowing(input: { content: { profileId: "${profileId}" } }) {
        document {
          profileId
        }
      }
    }
  `);
};
