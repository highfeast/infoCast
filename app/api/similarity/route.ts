import { measuringUnits } from '../../../lib/helpers';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { OpenAI } from 'langchain/llms/openai';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  embedQuery,
  PineConeMetadata,
  prompt,
  // similarityVectorSearch,
} from '../../../lib/LLM';
import { NextResponse } from 'next/server';

const pineconeApiKey = process.env.PINECONE_API_KEY;
const openAIApiKey = process.env.OPENAI_API_KEY;

export async function POST(req: any, res: any) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: openAIApiKey,
  });

  const llm = new OpenAI({
    openAIApiKey: openAIApiKey as string,
  });
  const returnedResults = 1;

  let mappedMessages: any = [];
  //@ts-ignore
  const body = await req.json();
  try {
    const embeddedQuery = await embedQuery(body.query, embeddings);
    const pinecone = new Pinecone({
      apiKey: pineconeApiKey as string,
    });

    const docs = await similarityVectorSearch(
      pinecone,
      embeddedQuery,
      returnedResults,
      body.index,
      body.namespace
    );

    const messages = body.messages;

    if (messages.length > 0) {
      messages.forEach((message: any, index: number) => {
        if ('human_message' in message) {
          mappedMessages.push(new HumanMessage(message.human_message));
        }
        if ('ai_message' in message) {
          mappedMessages.push(new AIMessage(message.ai_message));
        }
      });
    }
    mappedMessages.push(new HumanMessage(body.query));

    const chain = prompt.pipe(llm);
    const result = await chain.invoke({
      input_documents: docs,
      units: measuringUnits,
      messages: mappedMessages,
      userPrompt: body.query,
    });

    if (result && result.length > 0) {
      return NextResponse.json(result, { status: 200 });
    }
  } catch (e) {
    return NextResponse.json({ error: e }, { status: 500 });
  }
}

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
  return result.map((result) => result[0]);
}
