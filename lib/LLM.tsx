import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';



export async function callVectorDBQAChain(
  query: string,
  index: any,
  namespace: string,
  messages: any[] | any
) {
  const requestBody = {
    query: query,
    index: index,
    namespace: namespace,
    messages: messages,
  };

  try {
    const url = process.env.NEXT_PUBLIC_VECTOR_SEARCH_URL as string;
    const vectorSearchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!vectorSearchResponse.ok) {
      throw new Error('Failed to fetch from vector-search');
    }

    const result = await vectorSearchResponse.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

export const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a user's food companion and catering assitant. Always introduce yourself when greeted with  no more than 3 words
     Highfeast is a Nigerian catering company with over 23 years experience, 
     hence how it has rich datasets and information about menus. {input_documents} 
     contain recipe items and prices in naira of the items for making jollof rice for 500 guest sample size. 
     Use this and the measuring units in {units} as a knowledge base to analyse and give the most relevant answer to users prompts.
     You should always resolve the quantities into common language units users understand, example is 1 gallon

     Follow these other rules when generating an answer:
    - Always respond to greetings and start a conversation introducing yourself in 3 or 4 words.
    - Always assume that highfeast has mastered the menu sizes.
    - Interpret the sizes you come up with in small, standard or large descriptions based on the units given.
    - If you are unable to find an answer about food related request from the knowledge base, respond with I don't have enough information from highfeast on this yet.
    - if your response is request for menus or menu items, give the response in form of an accurate markdown table
    - Do not use ignore greetings from the user.
    - Responses of food list should always be in a table. A good a format for the headers would include condiments,
     one chosen size and estimated prices
     - ignore conversation log not relevant to user's prompt. Always priotize prompts and information from given knowledge base

    INPUT DOCUMENTS: {input_documents}

    MEASURING UNITS: {units}
  
    USER PROMPT: {userPrompt}
  
    CONVERSATION LOG: {messages}
  
    Final answer:`,
  ],
  new MessagesPlaceholder('messages'),
]);

export type PineConeMetadata = Record<string, any>;

export async function similarityVectorSearch(
  pinecone: any,
  vectorQuery: number[],
  k = 1,
  indexx: any,
  namespace: string
): Promise<Document[]> {
  const index = pinecone.index('highfeast1');
  const results = await index.query({
    vector: vectorQuery,
    topK: k,
    includeMetadata: true,
  });

  const result: [Document, number][] = [];

  if (results.matches) {
    for (const res of results.matches) {
      const { text: pageContent, ...metadata } =
        res?.metadata as PineConeMetadata;
      if (res.score) {
        //@ts-ignore
        result.push([new Document({ metadata, pageContent }), res.score]);
      }
    }
  }
  console.log('AI result', result);
  return result.map((result) => result[0]);
}

export async function embedQuery(
  query: string,
  embeddings: OpenAIEmbeddings
): Promise<number[]> {
  const embeddedQuery = await embeddings.embedQuery(query);
  return embeddedQuery;
}
