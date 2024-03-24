import { callVectorDBQAChain } from "../../../lib/LLM";
import { Pinecone } from "@pinecone-database/pinecone";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
};

export async function POST(req: NextApiRequest, res: NextApiResponse<Data>) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  const query = req.body.prompt;
  const messages = req.body.messages;

  if (!query) {
    return res.status(500).json({ message: "prompt format error" });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "messages format error" });
  }

  const pineconeIndex = pinecone.index("highfeast1");

  const response = await callVectorDBQAChain(
    query,
    await pineconeIndex.describeIndexStats(),
    "c",
    messages
  );

  res.status(200).json({ message: response });
}
