
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!vectorSearchResponse.ok) {
      throw new Error("Failed to fetch from vector-search");
    }

    const result = await vectorSearchResponse.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}
