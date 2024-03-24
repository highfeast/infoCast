import { NextResponse } from "next/server";
import { callVectorDBQAChain } from "../../../lib/LLM";
import { Pinecone } from "@pinecone-database/pinecone";

export async function POST(req: any, res: any) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });

  //find a way to package the messages in an acceptable form
  const { prompt, messages } = await req.json();

  if (!prompt) {
    return NextResponse.json(
      { message: "mrompt format erro" },
      { status: 500 }
    );
  }

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { message: "messages format error" },
      { status: 400 }
    );
  }

  const pineconeIndex = pinecone.index("highfeast1");

  const response = await callVectorDBQAChain(
    prompt,
    await pineconeIndex.describeIndexStats(),
    "c",
    messages
  );

  if (response) {
    console.log("result", response);

    //ideally once there's a result - create a post with that result

    //show response in svg and text. Upload response into composeDB



    return NextResponse.json({ message: response }, { status: 200 });
  }
}
